import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Product } from "@lessence/core";
import { useAuth, useRecentlyViewed } from "@lessence/supabase";
import { supabase } from "../lib/supabase";
import { mobileRecentlyViewedStorage } from "../lib/recentlyViewedStorage";
import { useFavorites } from "../hooks/useFavorites";
import { useCart } from "../context/CartContext";
import { ProductCard } from "./ProductCard";

import { useTranslation } from "react-i18next";

interface RecentlyViewedProps {
  currentProductId?: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { recentlyViewedIds, loading: hookLoading } = useRecentlyViewed(
    supabase,
    user?.id,
    mobileRecentlyViewedStorage,
  );
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const idsToFetch = recentlyViewedIds.filter(
        (id) => id !== currentProductId,
      );

      if (idsToFetch.length === 0) {
        setProducts([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", idsToFetch);

      if (!error && data) {
        // Keep sorting order
        const sortedData = [...data].sort((a, b) => {
          return idsToFetch.indexOf(a.id) - idsToFetch.indexOf(b.id);
        });
        setProducts(sortedData);
      }
      setLoading(false);
    }

    fetchProducts();
  }, [recentlyViewedIds, currentProductId]);

  if (hookLoading || loading) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator color="#f4c025" />
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View className="mt-8 flex-col gap-4">
      <View
        className={`flex-row items-center justify-between px-4 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <Text
          className={`text-xl font-bold tracking-tight text-white ${isRTL ? "text-right" : "text-left"}`}
        >
          {t("common:recently_viewed")}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        className={isRTL ? "flex-row-reverse" : ""}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.push("ProductDetails", { product })}
            onAdd={() =>
              addToCart(product, product.size_options?.[0]?.size || "50ml")
            }
            isWeb={false}
            isFav={isFavorite(product.id)}
            onFavToggle={() => toggleFavorite(product.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
