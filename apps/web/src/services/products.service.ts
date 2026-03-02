import { SupabaseClient } from "@supabase/supabase-js";
import { Product } from "@lessence/core";


export async function getProducts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Product[];
}

export async function getProductBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, variants(*), reviews(*)")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getFeaturedProducts(supabase: SupabaseClient, limit = 8) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Product[];
}
