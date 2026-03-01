import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@lessence/supabase"; // Assuming Database types are exported

type Category = Database["public"]["Tables"]["categories"]["Row"];

export async function getCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as Category[];
}

export async function getCategoryBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as Category;
}
