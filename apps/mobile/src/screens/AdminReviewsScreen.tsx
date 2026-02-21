import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAdminReviews } from '@lessence/supabase';
import { supabase } from '../lib/supabase';

export default function AdminReviewsScreen() {
  const navigation = useNavigation<any>();
  const { reviews, loading, error, toggleReviewHiddenStatus, deleteReview } = useAdminReviews(supabase);

  const handleToggleHide = async (id: string, currentStatus: boolean) => {
    try {
      await toggleReviewHiddenStatus(id, currentStatus);
    } catch (err: any) {
      Alert.alert("Error", "Could not update review status.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to permanently delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReview(id);
            } catch (err: any) {
              Alert.alert("Error", "Could not delete review.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-background-dark/95 border-b border-surface-lighter">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Manage Reviews</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator color="#f4c025" size="large" className="mt-8" />
        ) : error ? (
          <View className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mt-4">
            <Text className="text-red-400 text-center">{error.message}</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-white/40 text-lg">No reviews found.</Text>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {reviews.map((review) => (
              <View key={review.id} className="bg-surface-dark p-4 rounded-xl border border-surface-lighter">
                
                {/* Product & User Header */}
                <View className="flex-row items-center gap-3 mb-3 border-b border-white/5 pb-3">
                  <View className="h-10 w-10 rounded overflow-hidden bg-primary/10">
                    {review.products?.image_url ? (
                      <Image source={{ uri: review.products.image_url }} className="h-full w-full" />
                    ) : (
                      <View className="h-full w-full bg-primary/20 items-center justify-center">
                        <MaterialIcons name="inventory" size={20} color="#f4c025" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold" numberOfLines={1}>
                      {review.products?.name || 'Unknown Product'}
                    </Text>
                    <Text className="text-white/50 text-xs">
                      {review.profiles?.full_name || 'Anonymous User'}
                    </Text>
                  </View>
                  {review.is_verified_purchase && (
                    <View className="bg-green-500/10 px-2 py-1 rounded">
                      <Text className="text-green-500 text-[8px] font-bold uppercase tracking-widest">Verified</Text>
                    </View>
                  )}
                </View>

                {/* Rating & Comment */}
                <View className="mb-4">
                  <View className="flex-row items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons 
                        key={i} 
                        name={i < review.rating ? "star" : "star-border"} 
                        size={14} 
                        color={i < review.rating ? "#f4c025" : "rgba(255,255,255,0.2)"} 
                      />
                    ))}
                    <Text className="text-white/30 text-xs ml-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {review.comment ? (
                    <Text className={`text-sm ${review.is_hidden ? 'text-white/30 line-through' : 'text-white/70'}`}>
                      {review.comment}
                    </Text>
                  ) : (
                    <Text className="text-white/30 text-xs italic">No comment</Text>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row justify-end gap-2 border-t border-white/5 pt-3">
                  <TouchableOpacity 
                    onPress={() => handleToggleHide(review.id, review.is_hidden)}
                    className={`flex-row items-center gap-1 px-3 py-1.5 rounded-lg border ${
                      review.is_hidden 
                        ? 'bg-[#f4c025]/10 border-[#f4c025]/20' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <MaterialIcons 
                      name={review.is_hidden ? "visibility" : "visibility-off"} 
                      size={16} 
                      color={review.is_hidden ? "#f4c025" : "rgba(255,255,255,0.6)"} 
                    />
                    <Text className={`text-xs font-medium uppercase tracking-wider ${
                      review.is_hidden ? 'text-[#f4c025]' : 'text-white/60'
                    }`}>
                      {review.is_hidden ? "Unhide" : "Hide"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDelete(review.id)}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10"
                  >
                    <MaterialIcons name="delete" size={16} color="#f87171" />
                    <Text className="text-xs font-medium uppercase tracking-wider text-red-400">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
