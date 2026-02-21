import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@lessence/core';

export function useRelatedProducts(
  supabase: SupabaseClient,
  productId: string,
  categoryId: string,
  price: number,
  scentProfiles: any[],
  limit: number = 4
) {
  const { data: relatedProducts = [], isLoading: loading, error: queryError, refetch } = useQuery<Product[]>({
    queryKey: ['products', 'related', productId, limit],
    queryFn: async () => {
      if (!productId || !categoryId) return [];
      
      const { data, error: apiError } = await supabase.rpc('get_related_products', {
        p_product_id: productId,
        p_category_id: categoryId,
        p_price: price || 0,
        p_scent_profiles: scentProfiles || [],
        p_limit: limit
      });

      if (apiError) throw apiError;
      return (data || []) as Product[];
    },
    enabled: !!productId && !!categoryId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const error = queryError ? (queryError as any) : null;

  return { relatedProducts, loading, error, refetch };
}
