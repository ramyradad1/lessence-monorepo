import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export type AdminReview = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  products?: {
    name: string;
    image_url: string;
  };
};

export function useAdminReviews(supabase: SupabaseClient) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Fetch all reviews with user and product details
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (full_name, email),
          products (name, image_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data as AdminReview[]);
    } catch (err: any) {
      console.error('Error fetching admin reviews:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleReviewHiddenStatus = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_hidden: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;
      
      // Update local state without refetching everything
      setReviews(current => 
        current.map(review => 
          review.id === reviewId 
            ? { ...review, is_hidden: !currentStatus }
            : review
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error toggling review hidden status:', err);
      throw err;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(current => current.filter(review => review.id !== reviewId));
      return true;
    } catch (err) {
      console.error('Error deleting review (admin):', err);
      throw err;
    }
  };

  return {
    reviews,
    loading,
    error,
    refreshReviews: fetchReviews,
    toggleReviewHiddenStatus,
    deleteReview
  };
}
