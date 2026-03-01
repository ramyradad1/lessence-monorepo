"use client";

import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@lessence/core';

export function useSearch(supabase: SupabaseClient) {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const term = `%${query.trim()}%`;

      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${term},subtitle.ilike.${term},description.ilike.${term}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (err) throw err;
      setResults(data || []);
    } catch (e: any) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
