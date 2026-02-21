import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@lessence/core';

export interface ProductsStorage {
  getProducts(categorySlug?: string): Promise<Product[] | null>;
  setProducts(products: Product[], categorySlug?: string): Promise<void>;
}

export function useProducts(supabase: SupabaseClient, categorySlug?: string, storage?: ProductsStorage) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [categorySlug]);

  async function fetchProducts() {
    try {
      setLoading(true);

      // SWR: Try loading from storage first
      if (storage) {
        const cached = await storage.getProducts(categorySlug);
        if (cached && cached.length > 0) {
          setProducts(cached);
          // If we have cached data, we can set loading to false earlier 
          // but we still want to revalidate in the background
          setLoading(false);
        }
      }

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
      
      const fetchedProducts = data || [];
      setProducts(fetchedProducts);

      // Update storage
      if (storage && fetchedProducts.length > 0) {
        await storage.setProducts(fetchedProducts, categorySlug);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { products, loading, error, refetch: fetchProducts };
}
