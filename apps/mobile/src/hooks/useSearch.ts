import { supabase } from '../lib/supabase';
import { useSearch as useSharedSearch } from '@lessence/supabase';

export function useSearch() {
  return useSharedSearch(supabase);
}
