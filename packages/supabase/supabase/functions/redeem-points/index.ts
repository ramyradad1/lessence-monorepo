// Edge Function: redeem-points
// Invoked during checkout to redeem loyalty points for a discount.
// Expects JSON body: { pointsToRedeem: number }
// Authenticated user required.

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

    // Get the authorization header to extract user_id
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Invalid or expired token");
    }

    const { pointsToRedeem } = await req.json();
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      throw new Error("pointsToRedeem must be a positive number");
    }

    // Fetch user loyalty account
    const { data: account, error: acctError } = await supabase
      .from("loyalty_accounts")
      .select("id, points_balance")
      .eq("user_id", user.id)
      .single();

    if (acctError || !account) {
      throw new Error("Loyalty account not found");
    }

    if (account.points_balance < pointsToRedeem) {
      throw new Error("Insufficient points balance");
    }

    // Conversion rate: 100 points = $1 (0.01 per point)
    const conversionRate = 0.01;
    const discountAmount = parseFloat((pointsToRedeem * conversionRate).toFixed(2));

    // Update balance and create transaction
    // Note: In a production app, you might want to wait until order is finalized,
    // but for this implementation we'll redeem immediately or mark as 'pending_redemption'.
    // Here we'll redeem immediately to simplify.
    
    const { error: updErr } = await supabase
      .from("loyalty_accounts")
      .update({
        points_balance: account.points_balance - pointsToRedeem,
      })
      .eq("id", account.id);

    if (updErr) {
      throw new Error("Failed to update loyalty balance");
    }

    await supabase.from("loyalty_transactions").insert({
      account_id: account.id,
      type: "redeemed",
      points: -pointsToRedeem,
      description: `Redeemed ${pointsToRedeem} points for $${discountAmount} discount`,
    });

    return new Response(
      JSON.stringify({ success: true, discountAmount, pointsRedeemed: pointsToRedeem }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
