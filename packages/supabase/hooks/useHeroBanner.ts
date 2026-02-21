import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { HeroBanner } from '@lessence/core';

export function useHeroBanner(supabase: SupabaseClient) {
  const { data: banner = null, isLoading: loading } = useQuery<HeroBanner | null>({
    queryKey: ['hero_banner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes for banner
  });

  return { banner, loading };
}
