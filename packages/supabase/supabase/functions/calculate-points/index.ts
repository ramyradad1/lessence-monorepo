// Edge Function: calculate-points
// Invoked after an order is created to award loyalty points.
// Expects JSON body: { orderId: string, pointsPerCurrency: number }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { orderId, pointsPerCurrency } = await req.json();
    if (!orderId) {
      throw new Error("orderId is required");
    }
    const rate = pointsPerCurrency ?? 1; // default 1 point per currency unit

    // Fetch order total from orders table
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total, user_id")
      .eq("id", orderId)
      .single();
    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const pointsEarned = Math.floor(order.total * rate);
    if (pointsEarned <= 0) {
      return new Response(JSON.stringify({ success: true, pointsEarned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get or create loyalty account for the user
    const { data: account, error: acctError } = await supabase
      .from("loyalty_accounts")
      .select("id, points_balance, total_earned")
      .eq("user_id", order.user_id)
      .single();

    let accountId: string;
    if (acctError || !account) {
      // Create new account
      const { data: newAcct, error: createErr } = await supabase
        .from("loyalty_accounts")
        .insert({
          user_id: order.user_id,
          points_balance: pointsEarned,
          total_earned: pointsEarned,
        })
        .select("id")
        .single();
      if (createErr || !newAcct) {
        throw new Error("Failed to create loyalty account");
      }
      accountId = newAcct.id;
    } else {
      accountId = account.id;
      // Update existing account
      const { error: updErr } = await supabase
        .from("loyalty_accounts")
        .update({
          points_balance: account.points_balance + pointsEarned,
          total_earned: account.total_earned + pointsEarned,
        })
        .eq("id", account.id);
      if (updErr) {
        throw new Error("Failed to update loyalty account");
      }
    }

    // Insert transaction record
    await supabase.from("loyalty_transactions").insert({
      account_id: accountId,
      order_id: orderId,
      type: "earned",
      points: pointsEarned,
      description: `Points earned for order ${orderId}`,
    });

    return new Response(
      JSON.stringify({ success: true, pointsEarned }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
