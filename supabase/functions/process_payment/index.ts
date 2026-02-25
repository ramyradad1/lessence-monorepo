import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const { orderId, paymentMethod } = await req.json();

    // Placeholder logic for payment processing workflow
    const data = {
      message: `Payment initiated for order ${orderId} using ${paymentMethod}`,
      status: "success",
    };

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
