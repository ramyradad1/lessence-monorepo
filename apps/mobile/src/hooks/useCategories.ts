import { supabase } from '../lib/supabase';
import { useCategories as useSharedCategories } from '@lessence/supabase';

export function useCategories() {
  return useSharedCategories(supabase);
}
