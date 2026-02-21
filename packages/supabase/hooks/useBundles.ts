import { useState, useCallback, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Bundle } from '@lessence/core';

export function useBundles(supabase: SupabaseClient) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select(`
          *,
          items:bundle_items (
            id, quantity, product_id, variant_id,
            product:products (*),
            variant:product_variants (*)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (err: any) {
      console.error('Failed to fetch bundles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  return {
    bundles,
    loading,
    error,
    refresh: fetchBundles,
  };
}

export function useBundleBySlug(supabase: SupabaseClient, slug: string) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBundle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select(`
          *,
          items:bundle_items (
            id, quantity, product_id, variant_id,
            product:products (*),
            variant:product_variants (*)
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setBundle(data);
    } catch (err: any) {
      console.error(`Failed to fetch bundle ${slug}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, slug]);

  useEffect(() => {
    if (slug) fetchBundle();
  }, [fetchBundle, slug]);

  return {
    bundle,
    loading,
    error,
    refresh: fetchBundle,
  };
}
