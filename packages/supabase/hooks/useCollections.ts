"use client";

import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Collection } from './useAdminCollections';

export function useCollections(supabase: SupabaseClient) {
  const { data: collections = [], isLoading: loading } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour for collections
  });

  return { collections, loading };
}
