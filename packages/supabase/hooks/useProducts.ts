import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@lessence/core';

export function useProducts(supabase: SupabaseClient, categorySlug?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [categorySlug]);

  async function fetchProducts() {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');
      
      if (categorySlug && categorySlug !== 'all') {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) throw err;
      setProducts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { products, loading, error, refetch: fetchProducts };
}
