import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useProductSearch,
  useCategories,
  useFavorites,
  useAuth,
} from "@lessence/supabase";
import { supabase } from "../lib/supabase";
import { mobileFavoritesStorage } from "../lib/favoritesStorage";
import { ProductCard } from "../components/ProductCard";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "best_rated"
  | "most_popular";

export default function SearchScreen() {
  const { t, i18n } = useTranslation(["shop", "common"]);
  const locale = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [draftState, setDraftState] = useState({
    minPrice: "",
    maxPrice: "",
    gender: "",
    inStock: false,
    sort: "newest" as ProductSort,
  });

  const [activeFilters, setActiveFilters] = useState({ ...draftState });

  const { categories } = useCategories(supabase);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(
    supabase,
    user?.id,
    mobileFavoritesStorage,
  );
  const { addToCart } = useCart();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProductSearch(supabase, {
    searchQuery: debouncedQuery,
    categorySlugs: activeCategory !== "all" ? [activeCategory] : undefined,
    genderTargets: activeFilters.gender ? [activeFilters.gender] : undefined,
    minPrice: activeFilters.minPrice
      ? Number(activeFilters.minPrice)
      : undefined,
    maxPrice: activeFilters.maxPrice
      ? Number(activeFilters.maxPrice)
      : undefined,
    inStockOnly: activeFilters.inStock,
    sortBy: activeFilters.sort,
  });

  const allCategories = useMemo(
    () => [
      {
        id: "all",
        name: t("shop:all_scents"),
        name_en: "All Scents",
        name_ar: "كل العطور",
        slug: "all",
      },
      ...categories,
    ],
    [categories, t],
  );

  const applyFilters = () => {
    setActiveFilters({ ...draftState });
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const defaultState = {
      minPrice: "",
      maxPrice: "",
      gender: "",
      inStock: false,
      sort: "newest" as ProductSort,
    };
    setDraftState(defaultState);
    setActiveFilters(defaultState);
    setIsFilterOpen(false);
  };

  const hasActiveFilters =
    activeFilters.minPrice ||
    activeFilters.maxPrice ||
    activeFilters.gender ||
    activeFilters.inStock ||
    activeFilters.sort !== "newest";

  return (
    <SafeAreaView className="flex-1 bg-background-dark" edges={["top"]}>
      {/* Header & Search */}
      <View className="px-4 py-4 border-b border-white/5">
        <Text
          className={`text-4xl font-display text-white mb-4 ${isRTL ? "text-right" : "text-left"}`}
        >
          {t("shop:our_fragrances")}
        </Text>

        <View className={`flex-row gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <View
            className={`flex-1 flex-row items-center bg-surface-dark border border-white/10 rounded-full px-4 h-12 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <MaterialIcons
              name="search"
              size={20}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("shop:search_placeholder")}
              placeholderTextColor="rgba(255,255,255,0.2)"
              className={`flex-1 text-white text-xs px-2 ${isRTL ? "text-right" : "text-left"}`}
              style={{ paddingVertical: 0 }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons
                  name="close"
                  size={16}
                  color="rgba(255,255,255,0.4)"
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={async () => {
              const nextLng = i18n.language === "ar" ? "en" : "ar";
              await i18n.changeLanguage(nextLng);
              Alert.alert(
                nextLng === "ar" ? "إعادة التشغيل مطلوبة" : "Restart Required",
                nextLng === "ar"
                  ? "يجب إعادة تشغيل التطبيق لتطبيق تغييرات التخطيط."
                  : "The app needs to restart to apply layout changes.",
                [{ text: nextLng === "ar" ? "حسناً" : "OK" }],
              );
            }}
            className="h-12 w-12 bg-surface-dark border border-white/10 rounded-full items-center justify-center mr-2"
          >
            <MaterialIcons name="language" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setDraftState({ ...activeFilters });
              setIsFilterOpen(true);
            }}
            className="h-12 w-12 bg-surface-dark border border-white/10 rounded-full items-center justify-center relative"
          >
            <MaterialIcons name="tune" size={20} color="white" />
            {hasActiveFilters && (
              <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary border border-surface-dark" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View className="py-4 border-b border-white/5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 12,
            flexDirection: isRTL ? "row-reverse" : "row",
          }}
        >
          {allCategories.map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              onPress={() => setActiveCategory(cat.slug)}
              className={`px-5 py-2 rounded-full border ${activeCategory === cat.slug ? "bg-primary border-primary" : "bg-transparent border-white/10"}`}
            >
              <Text
                className={`text-xs font-bold uppercase tracking-widest ${activeCategory === cat.slug ? "text-black" : "text-white/60"}`}
              >
                {locale === "ar"
                  ? cat.name_ar || cat.name
                  : cat.name_en || cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      {productsLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f4c025" size="large" />
        </View>
      ) : productsError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center mb-2">
            {t("common:error_occurred")}
          </Text>
          <Text className="text-white/40 text-xs text-center">
            {productsError}
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons
            name="search-off"
            size={48}
            color="rgba(255,255,255,0.1)"
            className="mb-4"
          />
          <Text className="text-lg font-display text-white mt-4">
            {t("shop:no_results_found")}
          </Text>
          <Text className="text-white/40 text-sm mt-2 mb-6 text-center">
            {t("shop:adjust_filters")}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text className="text-primary text-xs font-bold uppercase tracking-widest">
              {t("shop:clear_all_filters")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          columnWrapperStyle={{
            gap: 16,
            marginBottom: 16,
            flexDirection: isRTL ? "row-reverse" : "row",
          }}
          renderItem={({ item }) => (
            <View className="flex-1 max-w-[50%]">
              <ProductCard
                isWeb={false}
                product={item}
                isFav={isFavorite(item.id)}
                onFavToggle={() => toggleFavorite(item.id)}
                onPress={() =>
                  navigation.navigate("ProductDetails", { productId: item.id })
                }
                onAdd={() => {
                  const variant = item.variants?.[0]; // Default to first variant
                  if (variant) {
                    addToCart(item, variant.size_ml?.toString(), variant.id);
                  }
                }}
              />
            </View>
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-background-dark min-h-[70%] rounded-t-3xl p-6">
            <View
              className={`flex-row items-center justify-between border-b border-white/10 pb-4 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Text className="text-2xl font-display text-white">
                {t("shop:filters")}
              </Text>
              <TouchableOpacity
                onPress={() => setIsFilterOpen(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/5"
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Sort */}
              <View className="mb-8">
                <Text
                  className={`text-xs font-bold text-white/50 uppercase tracking-widest mb-4 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("shop:sort_by")}
                </Text>
                <View className="flex-col gap-2">
                  {[
                    { value: "newest", label: t("shop:newest") },
                    { value: "price_asc", label: t("shop:price_asc") },
                    { value: "price_desc", label: t("shop:price_desc") },
                    { value: "best_rated", label: t("shop:best_rated") },
                    { value: "most_popular", label: t("shop:most_popular") },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setDraftState((prev) => ({
                          ...prev,
                          sort: option.value as ProductSort,
                        }))
                      }
                      className={`flex-row items-center p-3 rounded-xl border ${draftState.sort === option.value ? "bg-primary/10 border-primary" : "border-white/5"} ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <View
                        className={`w-4 h-4 rounded-full border items-center justify-center ${draftState.sort === option.value ? "border-primary" : "border-white/30"}`}
                      >
                        {draftState.sort === option.value && (
                          <View className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </View>
                      <Text
                        className={`text-white text-sm ${isRTL ? "mr-3" : "ml-3"} ${draftState.sort === option.value ? "font-bold" : ""}`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View className="mb-8">
                <Text
                  className={`text-xs font-bold text-white/50 uppercase tracking-widest mb-4 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("shop:price_range")}
                </Text>
                <View
                  className={`flex-row items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <TextInput
                    value={draftState.minPrice}
                    onChangeText={(val) =>
                      setDraftState((prev) => ({ ...prev, minPrice: val }))
                    }
                    keyboardType="numeric"
                    placeholder={t("shop:min")}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className={`flex-1 h-12 bg-surface-dark border border-white/10 rounded-xl px-4 text-white ${isRTL ? "text-right" : "text-left"}`}
                  />
                  <Text className="text-white/30">-</Text>
                  <TextInput
                    value={draftState.maxPrice}
                    onChangeText={(val) =>
                      setDraftState((prev) => ({ ...prev, maxPrice: val }))
                    }
                    keyboardType="numeric"
                    placeholder={t("shop:max")}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className={`flex-1 h-12 bg-surface-dark border border-white/10 rounded-xl px-4 text-white ${isRTL ? "text-right" : "text-left"}`}
                  />
                </View>
              </View>

              {/* Gender */}
              <View className="mb-8">
                <Text
                  className={`text-xs font-bold text-white/50 uppercase tracking-widest mb-4 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("shop:gender_target")}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {[
                    { value: "", label: t("shop:all") },
                    { value: "unisex", label: t("shop:unisex") },
                    { value: "women", label: t("shop:women") },
                    { value: "men", label: t("shop:men") },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setDraftState((prev) => ({
                          ...prev,
                          gender: option.value,
                        }))
                      }
                      className={`px-4 py-2 rounded-full border ${draftState.gender === option.value ? "bg-primary border-primary" : "border-white/20"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${draftState.gender === option.value ? "text-black" : "text-white/70"}`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* In Stock Only */}
              <TouchableOpacity
                onPress={() =>
                  setDraftState((prev) => ({ ...prev, inStock: !prev.inStock }))
                }
                className={`flex-row items-center p-4 rounded-xl border ${draftState.inStock ? "bg-primary/10 border-primary" : "border-white/5"} ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View
                  className={`w-5 h-5 rounded border items-center justify-center ${draftState.inStock ? "bg-primary border-primary" : "border-white/30"}`}
                >
                  {draftState.inStock && (
                    <MaterialIcons name="check" size={14} color="black" />
                  )}
                </View>
                <Text
                  className={`text-white font-bold tracking-widest uppercase text-xs ${isRTL ? "mr-3" : "ml-3"}`}
                >
                  {t("shop:in_stock_only")}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View
              className={`flex-row gap-4 mt-auto pt-4 border-t border-white/5 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <TouchableOpacity
                onPress={clearFilters}
                className="flex-1 py-4 border border-white/10 rounded-full items-center"
              >
                <Text className="text-white/60 font-bold tracking-widest uppercase text-xs">
                  {t("shop:clear_all")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyFilters}
                className="flex-1 py-4 bg-primary rounded-full items-center"
              >
                <Text className="text-black font-bold tracking-widest uppercase text-xs">
                  {t("shop:apply_filters")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
