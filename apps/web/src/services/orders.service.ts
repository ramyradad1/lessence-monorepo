import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserOrders(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderById(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*))")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return data;
}
