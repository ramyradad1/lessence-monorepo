"use client";
import { useState } from "react";
import { useReviews, ReviewStatus } from "@lessence/supabase";
import { Star, Trash2, Edit2, Clock, XCircle, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function ProductReviews({ productId }: { productId: string }) {
  const {
    reviews,
    loading,
    canReview,
    userReview,
    submitReview,
    updateReview,
    deleteReview,
  } = useReviews(supabase, productId);

  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate average rating only from approved reviews
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  const averageRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
    : "0.0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      if (isEditing && userReview) {
        await updateReview({ reviewId: userReview.id, rating, comment });
        setIsEditing(false);
      } else {
        await submitReview({ rating, comment });
        setIsWriting(false);
      }
      setRating(5);
      setComment("");
    } catch (err) {
      console.error("Error submitting review", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = () => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || "");
      setIsEditing(true);
      setIsWriting(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete your review?")) {
      await deleteReview(id);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'pending': return <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 w-fit mt-2 border border-yellow-500/20"><Clock size={10} /> Awaiting Moderation</span>;
      case 'rejected': return <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 w-fit mt-2 border border-red-500/20"><XCircle size={10} /> Rejected</span>;
      case 'hidden': return <span className="text-[10px] bg-white/10 text-fg-muted px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 w-fit mt-2 border border-white/20"><EyeOff size={10} /> Hidden by Admin</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="mt-20 border-t border-white/10 pt-16">
        <h2 className="text-3xl font-sans text-white mb-8">Customer Reviews</h2>
        <div className="h-32 bg-surface-dark/50 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="mt-20 border-t border-white/10 pt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-sans text-white mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < Math.round(Number(averageRating))
                      ? "text-[#f4c025] fill-[#f4c025]"
                      : "text-fg-faint"
                  }
                />
              ))}
            </div>
            <span className="text-lg text-white font-bold">{averageRating}</span>
            <span className="text-fg-muted text-sm">({approvedReviews.length} reviews)</span>
          </div>
        </div>

        {canReview && !isWriting && !userReview && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-[#f4c025] text-black px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all self-start md:self-auto"
          >
            Write a Review
          </button>
        )}
      </div>

      {isWriting && (
        <form onSubmit={handleSubmit} className="bg-surface-dark p-6 md:p-8 rounded-2xl border border-white/5 mb-12">
          <h3 className="text-xl font-sans text-white mb-6">
            {isEditing ? "Edit Your Review" : "Write Your Review"}
          </h3>
          
          <div className="mb-6">
            <label className="text-fg-muted text-xs uppercase tracking-widest font-bold block mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} stars`}
                  onClick={() => setRating(star)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    size={28}
                    className={star <= rating ? "text-[#f4c025] fill-[#f4c025]" : "text-fg-faint"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="text-fg-muted text-xs uppercase tracking-widest font-bold block mb-3">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this fragrance..."
              className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white placeholder:text-fg-faint focus:outline-none focus:border-[#f4c025] transition-colors min-h-[120px]"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#f4c025] text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : isEditing ? "Save Changes" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setIsEditing(false);
                if (userReview) {
                  setRating(userReview.rating);
                  setComment(userReview.comment || "");
                } else {
                  setRating(5);
                  setComment("");
                }
              }}
              className="bg-transparent text-fg-muted border border-white/10 px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:border-white/30 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 border border-white/5 rounded-2xl bg-surface-dark">
          <p className="text-fg-muted">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
            {reviews.map((review) => {
              const isOwner = userReview?.id === review.id;
              // Only render if it's approved OR if the user owns it
              if (review.status !== 'approved' && !isOwner) return null;

              return (
                <div key={review.id} className={`p-6 md:p-8 rounded-2xl border ${isOwner ? 'border-[#f4c025]/20 bg-[#f4c025]/5' : 'border-white/5 bg-surface-dark'} relative`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#f4c025]/20 flex items-center justify-center text-[#f4c025] font-bold overflow-hidden relative border border-[#f4c025]/30">
                        {review.profiles?.avatar_url ? (
                          <Image src={review.profiles.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          (review.profiles?.full_name || "A").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <h4 className="text-white font-bold">{review.profiles?.full_name || "Anonymous User"}</h4>
                          {review.is_verified_purchase && (
                            <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold border border-green-500/20 italic w-fit">
                              Verified Buyer
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                              className={i < review.rating ? "text-[#f4c025] fill-[#f4c025]" : "text-fg-faint"}
                            />
                          ))}
                          </div>
                          <span className="text-fg-faint text-xs text-mono tracking-widest">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner && !isWriting && (
                        <div className="flex gap-2">
                          <button onClick={handleEditClick} className="p-2 bg-white/5 rounded-lg text-fg-muted hover:text-[#f4c025] hover:bg-[#f4c025]/10 border border-white/10 hover:border-[#f4c025]/30 transition-colors" aria-label="Edit review">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(review.id)} className="p-2 bg-white/5 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-colors" aria-label="Delete review">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm md:text-base leading-relaxed ${review.status !== 'approved' ? 'text-fg-muted' : 'text-fg'}`}>
                    {review.comment}
                  </p>

                  {isOwner && review.status !== 'approved' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {getStatusBadge(review.status)}
                      {review.moderation_reason && (
                        <p className="mt-2 text-xs text-fg-muted bg-black/40 p-3 rounded-lg border border-white/5">
                          <span className="text-fg-muted font-semibold block mb-1">Reason:</span>
                          {review.moderation_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
