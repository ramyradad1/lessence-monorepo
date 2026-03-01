"use client";

import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export type ReviewStatus = 'pending' | 'approved' | 'hidden' | 'rejected';

export type AdminReview = {
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
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  products?: {
    name_en: string;
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
          products (name_en, slug)
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

  const moderateReviews = async (
    reviewIds: string[],
    newStatus: ReviewStatus,
    reason?: string,
    note?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('moderate_reviews', {
        p_review_ids: reviewIds,
        p_status: newStatus,
        p_reason: reason || null,
        p_note: note || null,
      });

      if (error) throw error;
      
      // Update local state without refetching everything
      setReviews(current => 
        current.map(review => 
          reviewIds.includes(review.id)
            ? { ...review, status: newStatus, moderation_reason: reason || null, admin_note: note || null }
            : review
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error moderating reviews:', err);
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
    moderateReviews,
    deleteReview
  };
}
