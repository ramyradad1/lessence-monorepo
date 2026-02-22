import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@lessence/supabase";
import { supabase } from "../lib/supabase";
import { Product } from "@lessence/core";
import { useFavorites } from "../hooks/useFavorites";
import { useCart } from "../context/CartContext";
import LoginScreen from "./LoginScreen";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@lessence/core";

export default function FavoritesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation(["common"]);
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language;

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
        .from("products")
        .select("*")
        .in("id", favorites);
      setProducts(data || []);
      setLoading(false);
    }
    fetchFavoriteProducts();
  }, [favorites.length]);

  const isLoading = authLoading || loading;

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View
        className={`flex-row items-center justify-between px-4 py-4 border-b border-white/5 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <Text className="text-xl font-bold tracking-[0.2em] text-white uppercase">
          {t("favorites")}
        </Text>
        <View
          className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <MaterialIcons name="favorite" size={20} color="#f4c025" />
          <Text className={`text-white/40 text-xs ${isRTL ? "mr-2" : "ml-2"}`}>
            {t("saved_count", { count: favorites.length })}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f4c025" size="large" />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons
            name="favorite-border"
            size={64}
            color="rgba(255,255,255,0.07)"
          />
          <Text className="text-white/60 font-display text-xl mt-6 mb-2">
            {t("no_favorites_yet")}
          </Text>
          <Text className="text-white/30 text-xs text-center mb-8">
            {t("favorites_empty_desc")}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {products.map((product) => {
            const localizedName =
              locale === "ar"
                ? product.name_ar || product.name
                : product.name_en || product.name;
            const localizedSubtitle =
              locale === "ar"
                ? product.subtitle_ar || product.subtitle
                : product.subtitle_en || product.subtitle;

            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("ProductDetails", { product })
                }
                className={`flex-row bg-surface-dark rounded-2xl overflow-hidden border border-white/5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Image
                  source={{ uri: product.image_url }}
                  className="w-28 h-36"
                  resizeMode="cover"
                />
                <View
                  className={`flex-1 p-4 justify-between ${isRTL ? "items-end" : "items-start"}`}
                >
                  <View className={isRTL ? "items-end" : "items-start"}>
                    <Text
                      className={`text-base font-bold text-white ${isRTL ? "text-right" : "text-left"}`}
                      numberOfLines={1}
                    >
                      {localizedName}
                    </Text>
                    <Text
                      className={`text-xs text-white/40 mt-0.5 ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {localizedSubtitle}
                    </Text>
                    <View
                      className={`flex-row items-center mt-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <MaterialIcons
                          key={i}
                          name="star"
                          size={10}
                          color={
                            i < product.rating
                              ? "#f4c025"
                              : "rgba(255,255,255,0.15)"
                          }
                        />
                      ))}
                      <Text
                        className={`text-[10px] text-white/30 ${isRTL ? "mr-1" : "ml-1"}`}
                      >
                        ({product.review_count})
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`flex-row items-center justify-between w-full mt-3 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Text className="text-primary font-bold text-base">
                      {formatCurrency(product.price, locale)}
                    </Text>
                    <View
                      className={`flex-row gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        className="h-8 w-8 items-center justify-center rounded-full bg-red-500/10"
                      >
                        <MaterialIcons
                          name="favorite"
                          size={16}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          addToCart(
                            product,
                            product.size_options?.[0]?.size || "50ml",
                          );
                        }}
                        className="h-8 w-8 items-center justify-center rounded-full bg-primary"
                      >
                        <MaterialIcons name="add" size={16} color="black" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
