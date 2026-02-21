import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useReviews } from '../hooks/useReviews';

export function ProductReviews({ productId }: { productId: string }) {
  const {
    reviews,
    loading,
    canReview,
    userReview,
    submitReview,
    updateReview,
    deleteReview,
  } = useReviews(productId);

  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const handleSubmit = async () => {
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
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit review");
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

  const handleDelete = () => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (userReview) {
              try {
                await deleteReview(userReview.id);
              } catch (err: any) {
                Alert.alert("Error", err.message || "Failed to delete review");
              }
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="mt-8 pt-8 border-t border-white/10">
        <Text className="text-2xl font-bold text-white mb-6">Reviews</Text>
        <ActivityIndicator color="#f4c025" />
      </View>
    );
  }

  return (
    <View className="mt-8 pt-8 border-t border-white/10">
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-2xl font-bold text-white mb-2">Reviews</Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row">
              {[...Array(5)].map((_, i) => (
                <MaterialIcons
                  key={i}
                  name={i < Math.round(Number(averageRating)) ? "star" : "star-border"}
                  size={16}
                  color={i < Math.round(Number(averageRating)) ? "#f4c025" : "rgba(255,255,255,0.2)"}
                />
              ))}
            </View>
            <Text className="text-base text-white font-bold">{averageRating}</Text>
            <Text className="text-white/40 text-xs">({reviews.length})</Text>
          </View>
        </View>

        {canReview && !isWriting && !userReview && (
          <TouchableOpacity
            onPress={() => setIsWriting(true)}
            className="bg-primary px-4 py-2 rounded-full"
          >
            <Text className="text-black text-xs font-bold uppercase tracking-wider">Write Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {isWriting && (
        <View className="bg-surface-dark p-4 rounded-xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">
            {isEditing ? "Edit Review" : "Write Review"}
          </Text>
          
          <Text className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Rating</Text>
          <View className="flex-row gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <MaterialIcons
                  name={star <= rating ? "star" : "star-border"}
                  size={32}
                  color={star <= rating ? "#f4c025" : "rgba(255,255,255,0.2)"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Comment</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your thoughts..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            multiline
            numberOfLines={4}
            className="bg-background-dark border border-white/10 rounded-lg p-3 text-white mb-4 min-h-[100px]"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      )}

      <View className="flex-row gap-3">
        {isWriting && (
          <>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className={`flex-1 items-center justify-center py-3 rounded-full ${submitting ? 'bg-primary/50' : 'bg-primary'}`}
            >
              {submitting ? (
                <ActivityIndicator color="black" size="small" />
              ) : (
                <Text className="text-black font-bold uppercase tracking-wider text-xs">
                  {isEditing ? "Save" : "Submit"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsWriting(false);
                setIsEditing(false);
                setRating(5);
                setComment("");
              }}
              className="flex-1 items-center justify-center py-3 rounded-full border border-white/10"
            >
              <Text className="text-white/60 font-bold uppercase tracking-wider text-xs">Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {reviews.length === 0 ? (
        <View className="items-center py-8 border border-white/5 rounded-xl bg-surface-dark mt-2">
          <Text className="text-white/40">No reviews yet.</Text>
        </View>
      ) : (
        <View className="flex-col gap-4 mt-2">
          {reviews.map((review) => (
            <View key={review.id} className="p-4 rounded-xl border border-white/5 bg-surface-dark">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-full bg-primary/20 items-center justify-center overflow-hidden">
                    {review.profiles?.avatar_url ? (
                      <Image source={{ uri: review.profiles.avatar_url }} className="h-full w-full" />
                    ) : (
                      <Text className="text-primary font-bold text-lg">
                        {(review.profiles?.full_name || "A").charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text className="text-white font-bold">{review.profiles?.full_name || "Anonymous User"}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <View className="flex-row">
                        {[...Array(5)].map((_, i) => (
                          <MaterialIcons
                            key={i}
                            name={i < review.rating ? "star" : "star-border"}
                            size={12}
                            color={i < review.rating ? "#f4c025" : "rgba(255,255,255,0.2)"}
                          />
                        ))}
                      </View>
                      <Text className="text-white/30 text-[10px]">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  {review.is_verified_purchase && (
                    <View className="bg-green-500/10 px-2 py-1 rounded">
                      <Text className="text-green-400 text-[8px] uppercase tracking-wider font-bold">Verified</Text>
                    </View>
                  )}
                  {userReview?.id === review.id && !isWriting && (
                    <View className="flex-row gap-2 ml-1">
                      <TouchableOpacity onPress={handleEditClick} className="p-1">
                        <MaterialIcons name="edit" size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleDelete} className="p-1">
                        <MaterialIcons name="delete" size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              {review.comment ? (
                <Text className="text-white/60 leading-relaxed text-sm">{review.comment}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
