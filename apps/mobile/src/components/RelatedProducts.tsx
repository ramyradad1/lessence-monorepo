import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Product } from '@lessence/core';
import { useAuth, useRelatedProducts } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
  currentProduct: Product;
}

export function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const { relatedProducts, loading } = useRelatedProducts(
    supabase,
    currentProduct.id,
    currentProduct.category_id,
    currentProduct.price,
    currentProduct.scent_profiles || [],
    4
  );
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (loading) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator color="#f4c025" />
      </View>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <View className="mt-8 flex-col gap-4">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-xl font-bold tracking-tight text-white">
          You may also like
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
      >
        {relatedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onPress={() => navigation.push('ProductDetails', { product })} 
            onAdd={() => addToCart(product, product.size_options?.[0]?.size || '50ml')}
            isWeb={false}
            isFav={isFavorite(product.id)}
            onFavToggle={() => toggleFavorite(product.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
