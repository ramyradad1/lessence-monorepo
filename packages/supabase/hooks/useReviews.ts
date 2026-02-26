import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';

export type ReviewStatus = 'pending' | 'approved' | 'hidden' | 'rejected';

export type Review = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  moderation_reason: string | null;
  admin_note: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export function useReviews(supabaseClient: SupabaseClient | undefined, productId: string) {
  const queryClient = useQueryClient();
  const supabase = supabaseClient || (globalThis as any).supabase;

  // Get current user first so we can fetch their reviews even if pending
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: Infinity,
  });

  const { data: reviews = [], isLoading: loadingReviews, error: reviewsError } = useQuery<Review[]>({
    queryKey: ['reviews', productId, userData?.id],
    queryFn: async () => {
      if (!productId) return [];
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', productId);

      // Fetch all public approved OR user's own reviews
      if (userData?.id) {
         query = query.or(`status.eq.approved,user_id.eq.${userData.id}`);
      } else {
         query = query.eq('status', 'approved');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: canReview = false, isLoading: loadingCanReview } = useQuery({
    queryKey: ['can_review', productId, userData?.id],
    queryFn: async () => {
      if (!userData || !productId) return false;

      // Check if user has already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userData.id)
        .single();
      
      if (existingReview) return false;

      // RPC to check verified purchase
      const { data: hasPurchased } = await supabase.rpc('check_verified_purchase', {
         p_product_id: productId,
         p_user_id: userData.id
      });
      
      return !!hasPurchased;
    },
    enabled: !!userData && !!productId,
  });

  const userReview = reviews.find((r) => r.user_id === userData?.id) || null;

  const submitMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!userData) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: userData.id,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can_review', productId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can_review', productId] });
    },
  });

  return {
    reviews,
    loading: loadingReviews || loadingCanReview,
    error: reviewsError,
    canReview,
    userReview,
    submitReview: submitMutation.mutateAsync,
    updateReview: updateMutation.mutateAsync,
    deleteReview: deleteMutation.mutateAsync,
    refreshReviews: () => queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
  };
}
