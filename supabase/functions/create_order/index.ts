import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const { items, address, coupon_code, idempotency_key, is_gift, gift_wrap, gift_message } = await req.json();

    if (!items || !items.length || !address || !idempotency_key) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // 0. Save the address to get an ID
    const { data: addrData, error: addrError } = await supabaseClient
      .from('addresses')
      .insert({
        user_id: user.id,
        full_name: address.fullName,
        email: address.email,
        phone: address.phone,
        address_line1: address.line1,
        address_line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || 'Egypt',
      })
      .select('id')
      .single();

    if (addrError || !addrData) {
      console.error('Address creation failed:', addrError);
      return new Response(JSON.stringify({ error: 'Failed to save address' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
    const shipping_address_id = addrData.id;


    // 1. Fetch server-side product prices
    let subtotal = 0;
    const itemsWithPrices = [];
    
    // Using admin client for fetching product prices securely without RLS issues if any
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const item of items) {
       const { data: productVariant } = await supabaseAdmin
           .from('product_variants')
           .select('price, product_id')
           .eq('id', item.variant_id)
           .single();

       if (!productVariant || productVariant.product_id !== item.product_id) {
           return new Response(JSON.stringify({ error: `Invalid item ${item.product_id}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
       }
       
       const price = productVariant.price;
       subtotal += price * item.quantity;
       itemsWithPrices.push({
           ...item,
           expected_price: price
       });
    }

    let discount_amount = 0;
    let coupon_id = null;

    // 2. Validate coupon if provided
    if (coupon_code) {
        const { data: coupon } = await supabaseAdmin
           .from('coupons')
           .select('*')
           .eq('code', coupon_code)
           .eq('is_active', true)
           .single();
           
        if (coupon) {
            let valid = true;
            if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) valid = false;
            if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) valid = false;
            if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) valid = false;
            if (coupon.min_order_amount && subtotal < coupon.min_order_amount) valid = false;
            
            if (valid) {
                coupon_id = coupon.id;
                if (coupon.discount_type === 'percentage') {
                   discount_amount = (subtotal * coupon.discount_amount) / 100;
                   if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) discount_amount = coupon.max_discount_amount;
                } else {
                   discount_amount = coupon.discount_amount;
                }
                if (discount_amount > subtotal) discount_amount = subtotal;
            } else {
                return new Response(JSON.stringify({ error: 'Invalid coupon code criteria' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }
        } else {
            return new Response(JSON.stringify({ error: 'Invalid coupon code' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }
    }

    const total_amount = subtotal - discount_amount;

    // 3. Call the secure RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('place_order_transaction', {
       p_user_id: user.id,
       p_items: itemsWithPrices,
       p_subtotal: subtotal,
       p_discount_amount: discount_amount,
       p_total_amount: total_amount,
       p_shipping_address_id: shipping_address_id,
       p_idempotency_key: idempotency_key,
       p_coupon_id: coupon_id,
       p_is_gift: is_gift || false,
       p_gift_wrap: gift_wrap || false,
       p_gift_message: gift_message || null
    });

    if (rpcError || !rpcResult.success) {
       console.error("RPC Error:", rpcError || rpcResult.error);
       return new Response(JSON.stringify({ error: rpcError?.message || rpcResult.error || 'Failed to create order' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    return new Response(JSON.stringify(rpcResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
