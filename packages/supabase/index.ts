import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These should be injected via environment variables in the consuming apps
// or passed to an initialization function.
export const createSupabaseClient = (
  url: string,
  key: string,
  options: any = {}
): SupabaseClient => {
  return createClient(url, key, options);
};

// Re-export shared types for convenience
export * from '@lessence/core';

// Export Shared Hooks
export * from './hooks/useProducts';
export * from './hooks/useOrders';
export * from './hooks/useCategories';
export * from './hooks/useHeroBanner';
export * from './hooks/useAuth';
export * from './hooks/useSearch';
export * from './hooks/useProductSearch';
export * from './hooks/useFavorites';
export * from './hooks/useCartEngine';
export * from './hooks/useReviews';
export * from './hooks/useRecentlyViewed';
export * from './hooks/useRelatedProducts';
export * from './hooks/useBundles';
export * from './hooks/useNotifications';
export * from './hooks/useBackInStock';
export * from './hooks/useReturnRequests';
export * from './hooks/useNotificationPreferences';
export * from './hooks/useLoyalty';

export interface RecentlyViewedStorage {
  getGuestRecentlyViewed(): Promise<string[]>;
  setGuestRecentlyViewed(ids: string[]): Promise<void>;
  clearGuestRecentlyViewed(): Promise<void>;
}

export interface FavoritesStorage {
  getGuestFavorites(): Promise<string[]>;
  setGuestFavorites(ids: string[]): Promise<void>;
  clearGuestFavorites(): Promise<void>;
}

export interface ProductsStorage {
  getProducts(categorySlug?: string): Promise<any[] | null>;
  setProducts(products: any[], categorySlug?: string): Promise<void>;
}

// Admin Hooks
export * from './hooks/useAdminDashboard';
export * from './hooks/useAdminOrders';
export * from './hooks/useAdminProducts';
export * from './hooks/useAdminCoupons';
export * from './hooks/useAdminUsers';
export * from './hooks/useAdminReviews';
export * from './hooks/useAdminCustomers';
export * from './hooks/useAdminReports';
export * from './hooks/useAdminBundles';
export * from './hooks/useAdminNotifications';
// Providers
export * from './providers/QueryProvider';
