import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { Product } from '@lessence/core';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../context/CartContext';
import LoginScreen from './LoginScreen';

export default function FavoritesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const navigation = useNavigation<any>();

  if (!user && !authLoading) return <LoginScreen />;

  // biome-ignore lint: deps
  useEffect(() => {
    async function fetchFavoriteProducts() {
      if (favorites.length === 0) {
        setProducts([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', favorites);
      setProducts(data || []);
      setLoading(false);
    }
    fetchFavoriteProducts();
  }, [favorites.length]);

  const isLoading = authLoading || loading;

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
        <Text className="text-xl font-bold tracking-[0.2em] text-white uppercase">Favorites</Text>
        <View className="flex-row items-center">
          <MaterialIcons name="favorite" size={20} color="#f4c025" />
          <Text className="text-white/40 text-xs ml-2">{favorites.length} saved</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f4c025" size="large" />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="favorite-border" size={64} color="rgba(255,255,255,0.07)" />
          <Text className="text-white/60 font-display text-xl mt-6 mb-2">No Favorites Yet</Text>
          <Text className="text-white/30 text-xs text-center mb-8">Browse our collection and tap the heart icon to save your favorite fragrances.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ProductDetails', { product })}
              className="flex-row bg-surface-dark rounded-2xl overflow-hidden border border-white/5 mb-4"
            >
              <Image source={{ uri: product.image_url }} className="w-28 h-36" resizeMode="cover" />
              <View className="flex-1 p-4 justify-between">
                <View>
                  <Text className="text-base font-bold text-white" numberOfLines={1}>{product.name}</Text>
                  <Text className="text-xs text-white/40 mt-0.5">{product.subtitle}</Text>
                  <View className="flex-row items-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons key={i} name="star" size={10} color={i < product.rating ? '#f4c025' : 'rgba(255,255,255,0.15)'} />
                    ))}
                    <Text className="text-[10px] text-white/30 ml-1">({product.review_count})</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-primary font-bold text-base">${product.price}</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      className="h-8 w-8 items-center justify-center rounded-full bg-red-500/10"
                    >
                      <MaterialIcons name="favorite" size={16} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); addToCart(product, product.size_options?.[0]?.size || '50ml'); }}
                      className="h-8 w-8 items-center justify-center rounded-full bg-primary"
                    >
                      <MaterialIcons name="add" size={16} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
