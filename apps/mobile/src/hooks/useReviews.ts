import { supabase } from "../lib/supabase";
import { useReviews as useSharedReviews } from "@lessence/supabase";

export function useReviews(productId: string) {
  return useSharedReviews(supabase, productId);
}
