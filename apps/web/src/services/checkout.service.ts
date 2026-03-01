import { SupabaseClient } from "@supabase/supabase-js";

export async function createCheckoutSession(supabase: SupabaseClient, payload: any) {
  // This would typically invoke a Supabase Edge Function
  // e.g., /functions/v1/create-checkout-session
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: payload,
  });

  if (error) throw error;
  return data;
}
