"use client";

import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from '@lessence/core';

export function useCategories(supabase: SupabaseClient) {
  const { data: categories = [], isLoading: loading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour for categories as they rarely change
  });

  return { categories, loading };
}
