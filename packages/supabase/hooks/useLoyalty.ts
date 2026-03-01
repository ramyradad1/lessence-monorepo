"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';

export function useLoyalty(supabase: SupabaseClient, userId?: string) {
  const queryClient = useQueryClient();

  const { data: loyaltyAccount, isLoading: loadingLoyalty } = useQuery({
    queryKey: ['loyalty_account', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select(`
          *,
          transactions:loyalty_transactions (*)
        `)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows found'
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const redeemPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      const response = await supabase.functions.invoke('redeem-points', {
        body: { pointsToRedeem: points }
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_account', userId] });
    },
  });

  const getTier = (points: number = 0) => {
    if (points >= 10000) return 'VIP';
    if (points >= 5000) return 'Gold';
    if (points >= 1000) return 'Silver';
    return 'Bronze';
  };

  return {
    loyaltyAccount,
    loadingLoyalty,
    redeemPoints: (points: number) => redeemPointsMutation.mutateAsync(points),
    isRedeeming: redeemPointsMutation.isPending,
    getTier
  };
}
