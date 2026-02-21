import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // ── Fetch from Supabase (logged in) or local storage (guest) ──
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) {
        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId);
        if (!error && data) {
          setFavoriteIds(new Set(data.map((f: any) => f.product_id)));
        }
      } else if (storage) {
        const ids = await storage.getGuestFavorites();
        setFavoriteIds(new Set(ids));
      } else {
        setFavoriteIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, storage]);

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
      syncGuestToServer(userId).then(() => fetchFavorites());
    } else {
      fetchFavorites();
    }
    prevUserIdRef.current = userId;
  }, [userId, fetchFavorites, syncGuestToServer, storage]);

  // ── Toggle ──
  const toggleFavorite = useCallback(async (productId: string) => {
    const isFav = favoriteIds.has(productId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });

    if (userId) {
      // Logged in → Supabase
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        if (error) {
          setFavoriteIds(prev => { const n = new Set(prev); n.add(productId); return n; });
          return { error: error.message };
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, product_id: productId });
        if (error) {
          setFavoriteIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
          return { error: error.message };
        }
      }
    } else if (storage) {
      // Guest → local storage
      const updated = isFav
        ? Array.from(favoriteIds).filter(id => id !== productId)
        : Array.from(favoriteIds).concat(productId);
      await storage.setGuestFavorites(updated);
    }

    return { error: null };
  }, [supabase, userId, favoriteIds, storage]);

  const isFavorite = useCallback((productId: string) => {
    return favoriteIds.has(productId);
  }, [favoriteIds]);

  return { favoriteIds, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
}
