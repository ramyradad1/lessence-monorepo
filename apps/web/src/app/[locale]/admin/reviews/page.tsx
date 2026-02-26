'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminReviews, ReviewStatus, AdminReview } from '@lessence/supabase';
import { Star, EyeOff, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function AdminReviewsPage() {
  const { reviews, loading, error, moderateReviews, deleteReview } = useAdminReviews(supabase);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [reviewToModerate, setReviewToModerate] = useState<AdminReview | null>(null);

  const [modStatus, setModStatus] = useState<ReviewStatus>('approved');
  const [modReason, setModReason] = useState('');
  const [modNote, setModNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => statusFilter === 'all' || r.status === statusFilter);
  }, [reviews, statusFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedReviews(filteredReviews.map(r => r.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedReviews(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const openModerateModal = (review: AdminReview | null = null) => {
    if (review) {
      setReviewToModerate(review);
      setModStatus(review.status === 'pending' ? 'approved' : review.status);
      setModReason(review.moderation_reason || '');
      setModNote(review.admin_note || '');
    } else {
      setReviewToModerate(null); // Bulk
      setModStatus('approved');
      setModReason('');
      setModNote('');
    }
    setIsModalOpen(true);
  };

  const submitModeration = async () => {
    try {
      setIsSubmitting(true);
      const ids = reviewToModerate ? [reviewToModerate.id] : selectedReviews;
      await moderateReviews(ids, modStatus, modReason, modNote);
      setIsModalOpen(false);
      setSelectedReviews([]);
    } catch (err) {
      alert(`Error moderating reviews: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved': return <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle size={12} /> Approved</span>;
      case 'pending': return <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
      case 'rejected': return <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"><XCircle size={12} /> Rejected</span>;
      case 'hidden': return <span className="bg-white/10 text-fg-muted px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"><EyeOff size={12} /> Hidden</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-fg-muted">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle size={24} />
          <h3 className="font-semibold text-lg">Failed to load reviews</h3>
        </div>
        <p className="opacity-80 ml-9">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Reviews</h1>
          <p className="text-fg-muted text-sm mt-1">Manage and moderate user product reviews</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#1e1b16] rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-muted">Status:</span>
            <select
              title="Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | 'all')}
              className="bg-black border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#f4c025] transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {selectedReviews.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#f4c025]">{selectedReviews.length} selected</span>
            <button
              onClick={() => openModerateModal()}
              className="bg-[#f4c025] hover:bg-[#e0b020] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Moderate Selected
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    title="Select All Reviews"
                    type="checkbox"
                    className="accent-[#f4c025] w-4 h-4 cursor-pointer rounded bg-white/10 border-white/20"
                    checked={filteredReviews.length > 0 && selectedReviews.length === filteredReviews.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">Reviewer</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">Rating & Comment</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-fg-muted">
                    No reviews found matching your criteria.
                  </td>
                </tr>
              ) : (
                  filteredReviews.map(review => (
                    <tr key={review.id} className={`hover:bg-white/[0.02] transition-colors ${selectedReviews.includes(review.id) ? 'bg-[#f4c025]/5' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input
                          title="Select Review"
                          type="checkbox"
                          className="accent-[#f4c025] w-4 h-4 cursor-pointer rounded bg-white/10 border-white/20"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => handleSelectRow(review.id)}
                        />
                      </td>

                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-[#f4c025]/10 overflow-hidden flex-shrink-0 relative">
                          {review.products?.image_url ? (
                              <Image src={review.products.image_url} alt="Product" fill unoptimized className="object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[#f4c025] font-bold">P</div>
                          )}
                        </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white line-clamp-1 max-w-[150px]">
                              {review.products?.name_en || 'Unknown Product'}
                            </span>
                          </div>
                      </div>
                    </td>

                    {/* Reviewer */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{review.profiles?.full_name || 'Anonymous'}</span>
                        <span className="text-xs text-fg-muted">{review.profiles?.email || 'No email'}</span>
                        {review.is_verified_purchase && (
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#f4c025] bg-[#f4c025]/10 px-2 py-0.5 rounded-full w-max">
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
                              className={i < review.rating ? "fill-[#f4c025] text-[#f4c025]" : "text-fg-faint"}
                            />
                          ))}
                        </div>
                        {review.comment ? (
                            <p className={`text-sm ${review.status === 'rejected' || review.status === 'hidden' ? 'text-fg-faint line-through' : 'text-white/70'} line-clamp-3`}>
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-xs text-fg-faint italic">No comment provided</p>
                        )}
                          {(review.moderation_reason || review.admin_note) && (
                            <div className="mt-3 text-xs bg-black/40 p-3 rounded-lg text-fg-muted border border-white/5 space-y-2">
                              {review.moderation_reason && <div><span className="font-semibold text-white/70 block mb-0.5">Customer Reason:</span> {review.moderation_reason}</div>}
                              {review.admin_note && <div><span className="font-semibold text-white/70 block mb-0.5">Admin Note:</span> {review.admin_note}</div>}
                            </div>
                          )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                        {getStatusBadge(review.status)}
                        <div className="mt-2 text-[10px] text-fg-faint">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => openModerateModal(review)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-sm font-medium transition-colors border border-white/10"
                        >
                            Moderate
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to permanently delete this review?')) {
                              deleteReview(review.id);
                            }
                          }}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1b16] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">
                {reviewToModerate ? 'Moderate Review' : `Moderate ${selectedReviews.length} Reviews`}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-fg">Status</label>
                <select
                  title="Moderation Status"
                  value={modStatus}
                  onChange={(e) => setModStatus(e.target.value as ReviewStatus)}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#f4c025] transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approve (Public)</option>
                  <option value="hidden">Hide (Customer can still see)</option>
                  <option value="rejected">Reject (Violation)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-fg">Moderation Reason (Optional)</label>
                <p className="text-xs text-fg-muted mb-1">Shown to the customer if rejected/hidden.</p>
                <textarea
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="e.g. Contains inappropriate language."
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#f4c025] transition-colors h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-fg">Admin Note (Optional)</label>
                <p className="text-xs text-fg-muted mb-1">Only visible to other administrators.</p>
                <textarea
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#f4c025] transition-colors h-24 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitModeration}
                disabled={isSubmitting}
                className="bg-[#f4c025] hover:bg-[#e0b020] text-black px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-[#f4c025]/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Apply Moderation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
