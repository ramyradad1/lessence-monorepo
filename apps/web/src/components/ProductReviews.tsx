"use client";
import { useState } from "react";
import { useReviews } from "@lessence/supabase";
import { Star, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      if (isEditing && userReview) {
        await updateReview(userReview.id, rating, comment);
        setIsEditing(false);
      } else {
        await submitReview(rating, comment);
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
    if (confirm("Are you sure you want to delete this review?")) {
      await deleteReview(id);
    }
  };

  if (loading) {
    return (
      <div className="mt-20 border-t border-white/10 pt-16">
        <h2 className="text-3xl font-display text-white mb-8">Customer Reviews</h2>
        <div className="h-32 bg-surface-dark/50 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="mt-20 border-t border-white/10 pt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-display text-white mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < Math.round(Number(averageRating))
                      ? "text-primary fill-primary"
                      : "text-white/20"
                  }
                />
              ))}
            </div>
            <span className="text-lg text-white font-bold">{averageRating}</span>
            <span className="text-white/40 text-sm">({reviews.length} reviews)</span>
          </div>
        </div>

        {canReview && !isWriting && !userReview && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-primary text-black px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all self-start md:self-auto"
          >
            Write a Review
          </button>
        )}
      </div>

      {isWriting && (
        <form onSubmit={handleSubmit} className="bg-surface-dark p-6 md:p-8 rounded-2xl border border-white/5 mb-12">
          <h3 className="text-xl font-display text-white mb-6">
            {isEditing ? "Edit Your Review" : "Write Your Review"}
          </h3>
          
          <div className="mb-6">
            <label className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-3">Rating</label>
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
                    className={star <= rating ? "text-primary fill-primary" : "text-white/20"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-3">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this fragrance..."
              className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors min-h-[120px]"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : isEditing ? "Save Changes" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setIsEditing(false);
                setRating(5);
                setComment("");
              }}
              className="bg-transparent text-white/60 border border-white/10 px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:border-white/30 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 border border-white/5 rounded-2xl bg-surface-dark">
          <p className="text-white/40">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-6 md:p-8 rounded-2xl border border-white/5 glass-effect relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                    {review.profiles?.avatar_url ? (
                      <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (review.profiles?.full_name || "A").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{review.profiles?.full_name || "Anonymous User"}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? "text-primary fill-primary" : "text-white/20"}
                          />
                        ))}
                      </div>
                      <span className="text-white/30 text-xs">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {review.is_verified_purchase && (
                    <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-400 px-2 py-1 rounded hidden md:block">
                      Verified Buyer
                    </span>
                  )}
                  {userReview?.id === review.id && !isWriting && (
                    <div className="flex gap-2">
                      <button onClick={handleEditClick} className="p-2 text-white/40 hover:text-primary transition-colors" aria-label="Edit review">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(review.id)} className="p-2 text-white/40 hover:text-red-400 transition-colors" aria-label="Delete review">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-white/60 leading-relaxed text-sm md:text-base">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
