import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { code, subtotal } = await req.json();

    if (!code || subtotal === undefined) {
       return new Response(JSON.stringify({ error: 'Missing code or subtotal' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Call supabase to get the coupon
    const { data: coupon, error } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive coupon' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Validate dates
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
       return new Response(JSON.stringify({ error: 'Coupon not yet active' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
       return new Response(JSON.stringify({ error: 'Coupon expired' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
    
    // Validate usage limits
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
       return new Response(JSON.stringify({ error: 'Coupon usage limit reached' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Min order amount
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
       return new Response(JSON.stringify({ error: `Order subtotal must be at least ${coupon.min_order_amount}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
       discount = (subtotal * coupon.discount_amount) / 100;
       if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount;
       }
    } else {
       discount = coupon.discount_amount;
    }

    // Cap discount at subtotal
    if (discount > subtotal) {
        discount = subtotal;
    }

    return new Response(JSON.stringify({ coupon_id: coupon.id, discount_amount: discount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
