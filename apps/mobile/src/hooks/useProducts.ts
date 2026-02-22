import { supabase } from "../lib/supabase";
import { useProducts as useSharedProducts } from "@lessence/supabase";

export function useProducts(categorySlug?: string) {
  return useSharedProducts(supabase, categorySlug);
}
