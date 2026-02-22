import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@lessence/core';
import { TelemetryLogger, withRetryAndLog } from '../src/utils/telemetry';

export interface ProductSearchFilters {
  searchQuery?: string;
  categorySlugs?: string[];
  genderTargets?: string[];
  sizes?: number[];
  concentrations?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  minRating?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'best_rated' | 'most_popular';
}

export function useProductSearch(supabase: SupabaseClient, filters: ProductSearchFilters) {
  const queryKey = [
    'products',
    'search',
    filters.searchQuery,
    filters.categorySlugs?.sort().join(','),
    filters.genderTargets?.sort().join(','),
    filters.sizes?.sort().join(','),
    filters.concentrations?.sort().join(','),
    filters.minPrice,
    filters.maxPrice,
    filters.inStockOnly,
    filters.minRating,
    filters.sortBy,
  ];

  const { data: products = [], isLoading: loading, error: queryError } = useQuery<Product[]>({
    queryKey,
    queryFn: async () => {
      const logger = new TelemetryLogger(supabase, 'web-client');
      return await withRetryAndLog('product_search', logger, async () => {
        const { data, error: err } = await supabase.rpc('search_products', {
          search_query: filters.searchQuery || null,
          category_slugs: filters.categorySlugs?.length ? filters.categorySlugs : null,
          gender_targets: filters.genderTargets?.length ? filters.genderTargets : null,
          sizes: filters.sizes?.length ? filters.sizes : null,
          concentrations: filters.concentrations?.length ? filters.concentrations : null,
          min_price: filters.minPrice ?? null,
          max_price: filters.maxPrice ?? null,
          in_stock_only: filters.inStockOnly ?? false,
          min_rating: filters.minRating ?? null,
          sort_by: filters.sortBy || 'newest',
        });

        if (err) throw err;
        if (!data || data.length === 0) return [];

        // Fetch variants separately since RPC doesn't support PostgREST embedding
        const productIds = data.map((p: any) => p.id);
        const { data: variants } = await supabase
          .from('product_variants')
          .select('*')
          .in('product_id', productIds);

        // Attach variants to their products
        const variantMap = new Map<string, any[]>();
        (variants || []).forEach((v: any) => {
          if (!variantMap.has(v.product_id)) variantMap.set(v.product_id, []);
          variantMap.get(v.product_id)!.push(v);
        });

        return data.map((p: any) => ({
          ...p,
          variants: variantMap.get(p.id) || [],
        }));
      });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for products
  });

  const error = queryError ? (queryError as any).message : null;

  return { products, loading, error };
}
