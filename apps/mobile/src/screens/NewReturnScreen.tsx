import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, useCreateReturnRequest } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { Order } from '@lessence/core';

const RETURN_REASONS = [
  "Wrong size/fit",
  "Damaged item",
  "Item not as described",
  "Defective/Doesn't work",
  "Changed my mind",
  "Other"
];

export default function NewReturnScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { createRequest, submitting } = useCreateReturnRequest(supabase);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (!error && data) {
        setOrder(data);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const updateQty = (itemId: string, qty: number, maxQty: number) => {
    if (qty < 1 || qty > maxQty) return;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can only upload up to 5 photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) {
      setError("Please select at least one item");
      return;
    }
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    if (!user) return;

    setError(null);
    
    // In mobile, we need to convert uris to Blobs or similar for createRequest
    // But since useCreateReturnRequest expects mediaFiles: File[]
    // In React Native, we can pass objects with {uri, type, name}
    const mediaFiles = images.map((uri, index) => {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      return {
        uri,
        name: filename || `image_${index}.jpg`,
        type
      } as any;
    });

    const result = await createRequest({
      userId: user.id,
      orderId,
      reason,
      comment,
      items: Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
        orderItemId,
        quantity
      })),
      mediaFiles
    });

    if (result.success) {
      Alert.alert("Success", "Return request submitted successfully.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } else {
      setError("Failed to submit request. Please try again.");
    }
  };

  if (loading || !order) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-display text-white">Return Request</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-6">Order #{order.order_number || order.id.slice(0, 8)}</Text>

          {/* Items Section */}
          <View className="mb-8">
            <Text className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Select Items</Text>
            <View className="space-y-3">
              {(order as any).items?.map((item: any) => (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => toggleItem(item.id, item.quantity)}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    selectedItems[item.id] ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface-dark/50'
                  }`}
                >
                  <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${
                    selectedItems[item.id] ? 'bg-primary border-primary' : 'border-white/20'
                  }`}>
                    {selectedItems[item.id] && <MaterialIcons name="check" size={14} color="black" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-sm">{item.product_name}</Text>
                    <Text className="text-white/40 text-[10px]">{item.selected_size}</Text>
                  </View>
                  {selectedItems[item.id] && item.quantity > 1 && (
                    <View className="flex-row items-center gap-2">
                       <TouchableOpacity onPress={() => updateQty(item.id, selectedItems[item.id] - 1, item.quantity)}>
                         <MaterialIcons name="remove-circle-outline" size={20} color="white" />
                       </TouchableOpacity>
                       <Text className="text-white font-bold w-4 text-center">{selectedItems[item.id]}</Text>
                       <TouchableOpacity onPress={() => updateQty(item.id, selectedItems[item.id] + 1, item.quantity)}>
                         <MaterialIcons name="add-circle-outline" size={20} color="white" />
                       </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reason Section */}
          <View className="mb-8">
            <Text className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Reason</Text>
            <View className="bg-surface-dark/50 border border-white/5 rounded-2xl overflow-hidden">
              {RETURN_REASONS.map((r, idx) => (
                <TouchableOpacity 
                  key={r}
                  onPress={() => setReason(r)}
                  className={`flex-row items-center px-4 py-3 border-b border-white/5 last:border-b-0 ${
                    reason === r ? 'bg-primary/10' : ''
                  }`}
                >
                  <View className={`w-4 h-4 rounded-full border items-center justify-center mr-3 ${
                    reason === r ? 'border-primary' : 'border-white/20'
                  }`}>
                    {reason === r && <View className="w-2 h-2 rounded-full bg-primary" />}
                  </View>
                  <Text className={`text-sm ${reason === r ? 'text-white font-bold' : 'text-white/60'}`}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment Section */}
          <View className="mb-8">
            <Text className="text-white font-bold uppercase tracking-widest text-[10px] mb-4">Additional Comments</Text>
            <TextInput 
              autoCapitalize="none"
              placeholder="Tell us more about the issue..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              className="bg-surface-dark/50 border border-white/5 rounded-2xl p-4 text-white text-sm min-h-[100]"
              textAlignVertical="top"
            />
          </View>

          {/* Media Section */}
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Photos ({images.length}/5)</Text>
              <TouchableOpacity onPress={pickImage} className="flex-row items-center">
                <MaterialIcons name="add-a-photo" size={16} color="#f4c025" />
                <Text className="text-primary text-[10px] font-bold uppercase tracking-widest ml-1">Add Photo</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
              {images.map((uri, index) => (
                <View key={index} className="w-20 h-20 rounded-xl bg-surface-dark overflow-hidden relative mr-3">
                  <Image source={{ uri }} className="w-full h-full" />
                  <TouchableOpacity 
                    onPress={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                  >
                    <MaterialIcons name="close" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length === 0 && (
                <View className="w-20 h-20 rounded-xl border border-dashed border-white/10 items-center justify-center">
                  <MaterialIcons name="image" size={24} color="rgba(255,255,255,0.1)" />
                </View>
              )}
            </ScrollView>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 flex-row items-center">
              <MaterialIcons name="error-outline" size={18} color="#FF4444" />
              <Text className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-2">{error}</Text>
            </View>
          )}

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={submitting}
            className={`bg-primary h-14 rounded-full items-center justify-center mb-10 shadow-lg shadow-primary/20 ${
              submitting ? 'opacity-50' : ''
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text className="text-black font-bold uppercase tracking-widest text-xs">Submit Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
