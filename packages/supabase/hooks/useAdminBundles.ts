import { useState, useCallback, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Bundle } from '@lessence/core';

export function useAdminBundles(supabase: SupabaseClient) {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (err: any) {
      console.error('Failed to fetch admin bundles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const createBundle = async (bundle: Partial<Bundle>, items: any[]) => {
    try {
      // Create bundle
      const { data: newBundle, error: bundleError } = await supabase
        .from('bundles')
        .insert([bundle])
        .select()
        .single();
        
      if (bundleError) throw bundleError;

      // Add items
      if (items && items.length > 0) {
        const bundleItems = items.map(item => ({
          bundle_id: newBundle.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        }));
        
        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(bundleItems);
          
        if (itemsError) throw itemsError;
      }

      await fetchBundles();
      return { success: true, bundle: newBundle };
    } catch (err: any) {
      console.error('Failed to create bundle:', err);
      return { success: false, error: err.message };
    }
  };

  const updateBundle = async (id: string, updates: Partial<Bundle>, items?: any[]) => {
    try {
      const { error: updateError } = await supabase
        .from('bundles')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      if (items) {
        // Delete all existing items 
        await supabase.from('bundle_items').delete().eq('bundle_id', id);
        
        // Insert new ones
        if (items.length > 0) {
          const newItems = items.map(item => ({
             bundle_id: id,
             product_id: item.product_id,
             variant_id: item.variant_id,
             quantity: item.quantity,
          }));
          const { error: insertError } = await supabase.from('bundle_items').insert(newItems);
          if (insertError) throw insertError;
        }
      }

      await fetchBundles();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update bundle:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBundles();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete bundle:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    bundles,
    loading,
    error,
    refresh: fetchBundles,
    createBundle,
    updateBundle,
    deleteBundle,
  };
}
