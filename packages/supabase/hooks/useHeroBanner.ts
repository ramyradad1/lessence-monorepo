import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { HeroBanner } from '@lessence/core';

export function useHeroBanner(supabase: SupabaseClient) {
  const [banner, setBanner] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .single();
      setBanner(data);
      setLoading(false);
    }
    fetch();
  }, []);

  return { banner, loading };
}
