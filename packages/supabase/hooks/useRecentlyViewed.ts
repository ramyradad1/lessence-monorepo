"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface RecentlyViewedStorage {
  getGuestRecentlyViewed(): Promise<string[]>;
  setGuestRecentlyViewed(ids: string[]): Promise<void>;
  clearGuestRecentlyViewed(): Promise<void>;
}

export function useRecentlyViewed(
  supabase: SupabaseClient,
  userId?: string,
  storage?: RecentlyViewedStorage
) {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // ── Fetch from Supabase (logged in) or local storage (guest) ──
  const fetchRecentlyViewed = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) {
        const { data, error } = await supabase
          .from('recently_viewed')
          .select('product_id')
          .eq('user_id', userId)
          .order('viewed_at', { ascending: false })
          .limit(20);
          
        if (!error && data) {
          setRecentlyViewedIds(data.map((f: any) => f.product_id));
        }
      } else if (storage) {
        const ids = await storage.getGuestRecentlyViewed();
        setRecentlyViewedIds(ids);
      } else {
        setRecentlyViewedIds([]);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, storage]);

  // ── Sync guest → server on login ──
  const syncGuestToServer = useCallback(async (uid: string) => {
    if (!storage) return;
    const guestIds = await storage.getGuestRecentlyViewed();
    if (guestIds.length === 0) return;

    // Insert guest history (let trigger limit to 20 handling conflicts)
    // We reverse the array to keep the chronological order if they were added sequentially
    // But since they are IDs, we just upsert them. The trigger handles limits.
    const rows = guestIds.reverse().map(pid => ({ user_id: uid, product_id: pid }));
    await supabase.from('recently_viewed').upsert(rows, { onConflict: 'user_id,product_id' });
    await storage.clearGuestRecentlyViewed();
  }, [supabase, storage]);

  useEffect(() => {
    // Detect login transition: prevUserId was undefined, now it's set
    if (!prevUserIdRef.current && userId && storage) {
      syncGuestToServer(userId).then(() => fetchRecentlyViewed());
    } else {
      fetchRecentlyViewed();
    }
    prevUserIdRef.current = userId;
  }, [userId, fetchRecentlyViewed, syncGuestToServer, storage]);

  // ── Add Item ──
  const addRecentlyViewed = useCallback(async (productId: string) => {
    // Optimistic update
    setRecentlyViewedIds(prev => {
      const next = prev.filter(id => id !== productId);
      next.unshift(productId);
      return next.slice(0, 20);
    });

    if (userId) {
      // Logged in → Supabase upsert updates viewed_at timestamp too
      const { error } = await supabase
        .from('recently_viewed')
        .upsert(
          { user_id: userId, product_id: productId, viewed_at: new Date().toISOString() }, 
          { onConflict: 'user_id,product_id' }
        );
        
      if (error) {
        return { error: error.message };
      }
    } else if (storage) {
      // Guest → local storage
      const next = recentlyViewedIds.filter(id => id !== productId);
      next.unshift(productId);
      const limited = next.slice(0, 20);
      await storage.setGuestRecentlyViewed(limited);
    }

    return { error: null };
  }, [supabase, userId, recentlyViewedIds, storage]);

  return { recentlyViewedIds, loading, addRecentlyViewed, refetch: fetchRecentlyViewed };
}
