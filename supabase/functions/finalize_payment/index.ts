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
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { order_id, payment_intent_id, status } = await req.json();

    if (!order_id || !payment_intent_id || !status) {
       return new Response(JSON.stringify({ error: 'Missing required body fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Idempotency: skip if payment intent already processed
    const { data: existingPayment } = await supabaseAdmin
       .from('payments')
       .select('id')
       .eq('idempotency_key', payment_intent_id)
       .single();
       
    if (existingPayment) {
       return new Response(JSON.stringify({ message: 'Payment already processed idempotently', success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Get order to ensure it exists
    const { data: order } = await supabaseAdmin.from('orders').select('id, user_id, total_amount').eq('id', order_id).single();
    if (!order) {
       return new Response(JSON.stringify({ error: 'Order not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    // Insert payment
    const { error: insertError } = await supabaseAdmin.from('payments').insert({
       order_id: order.id,
       user_id: order.user_id,
       provider: 'paymob', // Or stripe, etc.
       transaction_id: payment_intent_id,
       amount: order.total_amount,
       status: status === 'succeeded' ? 'completed' : 'failed',
       idempotency_key: payment_intent_id
    });

    if (insertError) {
        throw insertError;
    }
    
    if (status === 'succeeded') {
        const { error: updateError } = await supabaseAdmin.from('orders').update({
            status: 'paid'
        }).eq('id', order.id);
        if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error("Payment finalize error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
