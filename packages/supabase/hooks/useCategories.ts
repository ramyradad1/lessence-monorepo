import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from '@lessence/core';

export function useCategories(supabase: SupabaseClient) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      setCategories(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { categories, loading };
}
