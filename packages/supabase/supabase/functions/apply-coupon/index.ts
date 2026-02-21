import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Optional user authentication for user-specific rules
    const authHeader = req.headers.get('Authorization');
    let user_id = null;

    if (authHeader && authHeader !== 'Bearer null' && authHeader !== 'Bearer undefined' && authHeader !== 'Bearer ') {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      if (!userError && user) {
        user_id = user.id;
      }
    }

    const { couponCode, cartItems } = await req.json()

    if (!couponCode) {
      throw new Error('Coupon code is required.');
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty.');
    }

    // 1. Calculate proper subtotal from DB prices
    let subtotal = 0;
    for (const item of cartItems) {
      const productId = item.id || item.product_id;
      const selectedSize = item.selectedSize || item.selected_size;

      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('name, size_options')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        throw new Error(`Product not found: ${productId}`)
      }

      const sizeOptions = product.size_options as any[];
      const sizeOption = (sizeOptions || []).find((s: any) => s.size === selectedSize);
      
      if (!sizeOption) {
        throw new Error(`Invalid size ${selectedSize} for product ${product.name}`)
      }

      subtotal += sizeOption.price * item.quantity;
    }

    // 2. Fetch and Validate Coupon
    const { data: coupon, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .single();

    if (couponError || !coupon) {
      throw new Error('Invalid coupon code.')
    }

    if (!coupon.is_active) {
       throw new Error('This coupon is no longer active.')
    }
    
    // Check Dates
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
        throw new Error('This coupon is not yet valid.')
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        throw new Error('This coupon has expired.')
    }

    // Check Minimum Order Amount
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        throw new Error(`Minimum order amount of $${coupon.min_order_amount} is required for this coupon.`)
    }

    // Check Global Usage Limit
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
         throw new Error('This coupon has reached its usage limit.')
    }

    // Check User-Specific Rules
    if (coupon.first_order_only || coupon.per_user_limit) {
        if (!user_id) {
            throw new Error('You must be logged in to use this coupon.');
        }

        if (coupon.first_order_only) {
            // Check if user has any existing paid/processing/completed orders
            const { count, error: orderCheckError } = await supabaseClient
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user_id)
              .not('status', 'in', '("cancelled")');
              
            if (count && count > 0) {
                 throw new Error('This coupon is only valid for your first order.');
            }
        }

        if (coupon.per_user_limit) {
             const { count, error: redemptionCheckError } = await supabaseClient
              .from('coupon_redemptions')
              .select('*', { count: 'exact', head: true })
              .eq('coupon_id', coupon.id)
              .eq('user_id', user_id);

             if (count && count >= coupon.per_user_limit) {
                  throw new Error(`You have reached the usage limit (${coupon.per_user_limit}) for this coupon.`);
             }
        }
    }

    // 3. Calculate Discount
    let discountAmount = 0;
    
    if (coupon.discount_type === 'percentage') {
        discountAmount = parseFloat((subtotal * (coupon.discount_amount / 100)).toFixed(2));
    } else if (coupon.discount_type === 'fixed') {
        discountAmount = Math.min(coupon.discount_amount, subtotal);
        discountAmount = parseFloat(discountAmount.toFixed(2));
    } else if (coupon.discount_type === 'free_shipping') {
        discountAmount = 0; // Value technically handled outside this by zeroing shipping fee
    }

    const newTotal = parseFloat((subtotal - discountAmount).toFixed(2));

    return new Response(
      JSON.stringify({ 
          success: true, 
          couponId: coupon.id,
          discountAmount, 
          newTotal, 
          discountType: coupon.discount_type,
          originalSubtotal: subtotal
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 } // Send 400 for bad request/validation errors
    )
  }
})
