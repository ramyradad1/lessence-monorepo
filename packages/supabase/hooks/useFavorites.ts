"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

// Storage adapter interface for guest favorites
export interface FavoritesStorage {
  getGuestFavorites(): Promise<string[]>;
  setGuestFavorites(ids: string[]): Promise<void>;
  clearGuestFavorites(): Promise<void>;
}

export function useFavorites(
  supabase: SupabaseClient,
  userId?: string,
  storage?: FavoritesStorage
) {
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // ── Sync guest → server on login ──
  const syncGuestToServer = useCallback(async (uid: string) => {
    if (!storage) return;
    const guestIds = await storage.getGuestFavorites();
    if (guestIds.length === 0) return;

    // Upsert each guest favorite (ignore conflicts)
    const rows = guestIds.map(pid => ({ user_id: uid, product_id: pid }));
    await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,product_id' });
    await storage.clearGuestFavorites();
  }, [supabase, storage]);

  useEffect(() => {
    // Detect login transition: prevUserId was undefined, now it's set
    if (!prevUserIdRef.current && userId && storage) {
      syncGuestToServer(userId).then(() => {
        // Invalidate so we refetch from the server immediately
        queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      });
    }
    prevUserIdRef.current = userId;
  }, [userId, syncGuestToServer, storage, queryClient]);

  // ── Fetch from Supabase (logged in) or local storage (guest) ──
  const { data: favoriteIdsArray = [], isLoading: loading, refetch } = useQuery<string[]>({
    queryKey: ['favorites', userId || 'guest'],
    queryFn: async () => {
      if (userId) {
        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId);
        if (!error && data) {
          return data.map((f: any) => f.product_id);
        }
        return [];
      } else if (storage) {
        const ids = await storage.getGuestFavorites();
        return ids;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const favoriteIds = new Set(favoriteIdsArray);

  // ── Toggle Mutation ──
  const toggleMutation = useMutation({
    mutationFn: async ({ productId, isFav }: { productId: string, isFav: boolean }) => {
      if (userId) {
        // Logged in → Supabase
        if (isFav) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert({ user_id: userId, product_id: productId });
          if (error) throw error;
        }
      } else if (storage) {
        // Guest → local storage
        const current = await storage.getGuestFavorites();
        const updated = isFav
          ? current.filter(id => id !== productId)
          : current.concat(productId);
        await storage.setGuestFavorites(updated);
      }
      return { productId, isFav };
    },
    onMutate: async ({ productId, isFav }) => {
      const key = ['favorites', userId || 'guest'];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) || [];

      // Optimistic update
      queryClient.setQueryData<string[]>(key, old => {
        const current = old || [];
        if (isFav) return current.filter(id => id !== productId);
        return [...current, productId];
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favorites', userId || 'guest'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId || 'guest'] });
    }
  });

  const toggleFavorite = useCallback(async (productId: string) => {
    const isFav = favoriteIds.has(productId);
    try {
      await toggleMutation.mutateAsync({ productId, isFav });
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Error updating favorite' };
    }
  }, [favoriteIds, toggleMutation]);

  const isFavorite = useCallback((productId: string) => {
    return favoriteIds.has(productId);
  }, [favoriteIds]);

  return { favoriteIds, loading, toggleFavorite, isFavorite, refetch };
}
