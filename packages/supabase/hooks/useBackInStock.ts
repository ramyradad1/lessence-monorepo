import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { BackInStockSubscription } from '@lessence/core';

export function useBackInStock(supabase: SupabaseClient, userId?: string) {
  const [subscriptions, setSubscriptions] = useState<BackInStockSubscription[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all active subscriptions for the current user
  const fetchSubscriptions = useCallback(async () => {
    if (!userId) {
      setSubscriptions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('back_in_stock_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      if (!error && data) {
        setSubscriptions(data as BackInStockSubscription[]);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Check if user is subscribed for a specific product+variant
  const isSubscribed = useCallback(
    (productId: string, variantId?: string): boolean => {
      return subscriptions.some(
        (s) =>
          s.product_id === productId &&
          (variantId ? s.variant_id === variantId : !s.variant_id)
      );
    },
    [subscriptions]
  );

  // Subscribe to back-in-stock notifications
  const subscribe = useCallback(
    async (productId: string, variantId?: string): Promise<boolean> => {
      if (!userId) return false;

      // Optimistic: check locally first
      if (isSubscribed(productId, variantId)) return true;

      const row: Record<string, any> = {
        user_id: userId,
        product_id: productId,
        status: 'active',
      };
      if (variantId) row.variant_id = variantId;

      const { data, error } = await supabase
        .from('back_in_stock_subscriptions')
        .upsert(row, { onConflict: 'user_id,product_id,variant_id' })
        .select()
        .single();

      if (!error && data) {
        setSubscriptions((prev) => [...prev, data as BackInStockSubscription]);
        return true;
      }

      // If upsert fails due to existing row, update status to active
      if (error) {
        const { data: updated, error: updateError } = await supabase
          .from('back_in_stock_subscriptions')
          .update({ status: 'active' })
          .eq('user_id', userId)
          .eq('product_id', productId)
          .eq('variant_id', variantId ?? '')
          .select()
          .single();

        if (!updateError && updated) {
          setSubscriptions((prev) => [...prev, updated as BackInStockSubscription]);
          return true;
        }
      }

      return false;
    },
    [supabase, userId, isSubscribed]
  );

  // Unsubscribe (cancel)
  const unsubscribe = useCallback(
    async (productId: string, variantId?: string): Promise<void> => {
      if (!userId) return;

      setSubscriptions((prev) =>
        prev.filter(
          (s) =>
            !(
              s.product_id === productId &&
              (variantId ? s.variant_id === variantId : !s.variant_id)
            )
        )
      );

      let query = supabase
        .from('back_in_stock_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (variantId) {
        query = query.eq('variant_id', variantId);
      } else {
        query = query.is('variant_id', null);
      }

      await query;
    },
    [supabase, userId]
  );

  return {
    subscriptions,
    loading,
    isSubscribed,
    subscribe,
    unsubscribe,
    refetch: fetchSubscriptions,
  };
}
