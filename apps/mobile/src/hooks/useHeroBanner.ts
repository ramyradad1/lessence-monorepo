import { supabase } from "../lib/supabase";
import { useHeroBanner as useSharedHeroBanner } from "@lessence/supabase";

export function useHeroBanner() {
  return useSharedHeroBanner(supabase);
}
