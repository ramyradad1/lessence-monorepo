'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminReviews } from '@lessence/supabase';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function AdminReviewsPage() {
  const { reviews, loading, error, toggleReviewHiddenStatus, deleteReview } = useAdminReviews(supabase);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        <p className="font-medium">Failed to load reviews</p>
        <p className="text-sm opacity-80 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Reviews</h1>
          <p className="text-white/40 text-sm mt-1">Manage user reviews and ratings</p>
        </div>
      </div>

      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Reviewer</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Rating & Comment</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map(review => (
                  <tr key={review.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-[#f4c025]/10 overflow-hidden flex-shrink-0">
                          {review.products?.image_url ? (
                            <img src={review.products.image_url} alt="Product" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[#f4c025] font-bold">P</div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-white line-clamp-2 max-w-[150px]">
                          {review.products?.name || 'Unknown Product'}
                        </span>
                      </div>
                    </td>

                    {/* Reviewer */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{review.profiles?.full_name || 'Anonymous'}</span>
                        <span className="text-xs text-white/40">{review.profiles?.email || 'No email'}</span>
                        {review.is_verified_purchase && (
                          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full w-max">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rating & Comment */}
                    <td className="px-6 py-4">
                      <div className="max-w-[300px]">
                        <div className="flex items-center gap-1 mb-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < review.rating ? "fill-[#f4c025] text-[#f4c025]" : "text-white/20"}
                            />
                          ))}
                        </div>
                        {review.comment ? (
                          <p className={`text-sm ${review.is_hidden ? 'text-white/30 line-through' : 'text-white/70'} line-clamp-3`}>
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-xs text-white/30 italic">No comment provided</p>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-white/50">
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleReviewHiddenStatus(review.id, review.is_hidden)}
                          className={`p-2 rounded-lg transition-colors border ${
                            review.is_hidden 
                              ? 'bg-[#f4c025]/10 text-[#f4c025] border-[#f4c025]/20 hover:bg-[#f4c025]/20' 
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                          title={review.is_hidden ? "Unhide Review" : "Hide Review"}
                        >
                          {review.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to permanently delete this review?')) {
                              deleteReview(review.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
