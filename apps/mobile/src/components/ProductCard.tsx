import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Product } from '@lessence/core';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
  isWeb: boolean;
  isFav?: boolean;
  onFavToggle?: () => void;
}

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQipWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

function ProductCardComponent({ product, onPress, onAdd, isWeb, isFav, onFavToggle }: ProductCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={isWeb ? 'flex-col gap-3' : 'w-[180px] mr-4 flex-col gap-3'}
      style={isWeb ? { flex: 1, minWidth: 180 } : undefined}
    >
      <View className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-dark">
        <Image 
          source={product.image_url} 
          className="h-full w-full" 
          contentFit="cover"
          placeholder={blurhash}
          transition={200}
        />
        <TouchableOpacity
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          onPress={(e) => { e.stopPropagation(); onFavToggle?.(); }}
        >
          <MaterialIcons name={isFav ? "favorite" : "favorite-border"} size={16} color={isFav ? "#ef4444" : "white"} />
        </TouchableOpacity>
      </View>
      <View className="flex-col gap-1">
        <Text className="text-base font-semibold text-white" numberOfLines={1}>{product.name}</Text>
        <Text className="text-xs text-gray-400">{product.subtitle}</Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-white">${product.price.toFixed(2)}</Text>
          <TouchableOpacity 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary"
            onPress={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <MaterialIcons name="add" size={16} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const ProductCard = memo(ProductCardComponent);
