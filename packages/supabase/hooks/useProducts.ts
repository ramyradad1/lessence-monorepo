import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@lessence/core';

export function useProducts(supabase: SupabaseClient, categorySlug?: string) {
  const { data: products = [], isLoading: loading, error: queryError, refetch } = useQuery<Product[]>({
    queryKey: ['products', categorySlug || 'all'],
    queryFn: async () => {
      let query = supabase.from('products').select('*, variants:product_variants(*)');
      
      if (categorySlug && categorySlug !== 'all') {
        const { data: cat, error: catErr } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (catErr && catErr.code !== 'PGRST116') throw catErr;
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) throw err;
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes for general product lists
  });

  const error = queryError ? (queryError as any).message : null;

  return { products, loading, error, refetch };
}
