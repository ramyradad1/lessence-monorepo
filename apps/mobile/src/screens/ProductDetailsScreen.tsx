import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Product } from "@lessence/core";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import {
  useAuth,
  useBackInStock,
  usePerformanceTracking,
  useRecentlyViewed,
} from "@lessence/supabase";
import { ProductReviews } from "../components/ProductReviews";
import { supabase } from "../lib/supabase";
import { mobileRecentlyViewedStorage } from "../lib/recentlyViewedStorage";
import { RecentlyViewed } from "../components/RecentlyViewed";
import { RelatedProducts } from "../components/RelatedProducts";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@lessence/core";

const DEFAULT_PRODUCT: Product = {
  id: "4",
  name: "Noire Essence",
  subtitle: "Eau de Parfum",
  description:
    "A provocative blend of dark florals and warm woods. Noire Essence captures the mystery of the night with its intoxicating top notes of spicy pink pepper, settling into a deep, sensual amber base.",
  price: 180,
  image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBRTDuGHsKv6gZggTWfA4p2SHMGKLyTdXnoWKr3Wu5ZpeMeK5cdBNdHuBOgaavvDXKXBwl3-1neXavcdbeUjFgJnLy0-U3sRL_oVGfsvk3b961rskG7KhHIHJNbMFg72ELXb1qsM-ieLm_XHaOedBYc70xDv5Q9bJh6jXGqa64nvlO_j5vdH7anYFWNB46lYnY0ouGqIxiAeu7aXEo3lv5USFaJ_rW46yAWlsbFdfM1GJRZUCzGRLzLoEwU0CbL0yVEwaJErzAlvS2Q",
  category_id: "",
  size_options: [
    { size: "50ml", price: 180 },
    { size: "100ml", price: 260 },
  ],
  scent_profiles: [
    { name: "Woody", icon: "park" },
    { name: "Spicy", icon: "local-fire-department" },
    { name: "Floral", icon: "spa" },
  ],
  fragrance_notes: {
    top: ["Bergamot", "Pink Pepper"],
    heart: ["Rose", "Cedarwood"],
    base: ["Amber", "Patchouli", "Musk"],
  },
  rating: 4.5,
  review_count: 42,
  is_new: true,
  is_limited: true,
};

const ICON_MAP: Record<string, string> = {
  park: "park",
  "local-fire-department": "local-fire-department",
  spa: "spa",
  wb_sunny: "wb-sunny",
  nights_stay: "nights-stay",
  water_drop: "water-drop",
};

export default function ProductDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const product: Product = route.params?.product || DEFAULT_PRODUCT;
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecentlyViewed } = useRecentlyViewed(
    supabase,
    user?.id,
    mobileRecentlyViewedStorage,
  );
  const {
    isSubscribed,
    subscribe,
    loading: bisLoading,
  } = useBackInStock(supabase, user?.id);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language;

  usePerformanceTracking(supabase, "mobile_product_load", "mobile-client", {
    productId: product?.id,
  });

  React.useEffect(() => {
    if (product?.id) {
      addRecentlyViewed(product.id);
    }
  }, [product?.id, addRecentlyViewed]);

  const variants =
    product.variants?.length && product.variants.length > 0
      ? product.variants
      : undefined;

  const sizes = !variants
    ? product.size_options?.length > 0
      ? product.size_options
      : [
          { size: "50ml", price: product.price },
          { size: "100ml", price: product.price * 1.44 },
        ]
    : [];

  const currentPrice = variants
    ? variants[selectedVariantIdx]?.price || product.price
    : sizes[selectedVariantIdx]?.price || product.price;

  const notes = product.fragrance_notes || { top: [], heart: [], base: [] };
  const profiles = product.scent_profiles || [];

  const renderStars = () => {
    const stars = [];
    const full = Math.floor(product.rating);
    const half = product.rating % 1 >= 0.5;
    for (let i = 0; i < full; i++)
      stars.push(
        <MaterialIcons key={`s${i}`} name="star" size={16} color="#f4c025" />,
      );
    if (half)
      stars.push(
        <MaterialIcons key="sh" name="star-half" size={16} color="#f4c025" />,
      );
    return stars;
  };

  // Localized Strings
  const productName =
    locale === "ar"
      ? product.name_ar || product.name
      : product.name_en || product.name;
  const productSubtitle =
    locale === "ar"
      ? product.subtitle_ar || product.subtitle
      : product.subtitle_en || product.subtitle;
  const productDesc =
    locale === "ar"
      ? product.description_ar || product.description
      : product.description_en || product.description;

  // === DESKTOP LAYOUT ===
  if (isDesktop) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark">
        <View className="flex-1 w-full mx-auto" style={{ maxWidth: 1200 }}>
          {/* Header */}
          <View
            className={`flex-row items-center px-6 py-4 border-b border-white/5 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`flex-row items-center gap-2 ${isRTL ? "ml-6" : "mr-6"} ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <MaterialIcons
                name={isRTL ? "arrow-forward" : "arrow-back"}
                size={24}
                color="white"
              />
              <Text className="text-sm text-gray-400">{t("common.back")}</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold tracking-[0.2em] text-white uppercase flex-1 text-center">
              L'Essence
            </Text>
            <TouchableOpacity
              className="p-2"
              onPress={() => toggleFavorite(product.id)}
            >
              <MaterialIcons
                name={isFavorite(product.id) ? "favorite" : "favorite-border"}
                size={24}
                color={isFavorite(product.id) ? "#ef4444" : "white"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View
              className={`flex-row px-8 pt-8 gap-8 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {/* Left: Image */}
              <View className="flex-1">
                <View className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-slate-800">
                  <Image
                    source={{ uri: product.image_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/10" />
                  {(product.is_new || product.is_limited) && (
                    <View
                      className={`absolute bottom-4 ${isRTL ? "right-4" : "left-4"}`}
                    >
                      <View className="bg-black/80 px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold uppercase tracking-widest text-white">
                          {product.is_limited
                            ? t("common.limited_edition")
                            : t("common.new_arrival")}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Right: Details */}
              <View className="flex-1 flex-col gap-6 pt-4">
                <View className={isRTL ? "items-end" : "items-start"}>
                  <Text
                    className={`text-4xl font-normal text-white italic leading-tight ${isRTL ? "text-right" : "text-left"}`}
                    style={{ fontFamily: "Newsreader_400Regular_Italic" }}
                  >
                    {productName.split(" ")[0]}{" "}
                    <Text
                      className="not-italic font-medium text-primary"
                      style={{ fontFamily: "Newsreader_400Regular" }}
                    >
                      {productName.split(" ").slice(1).join(" ") || ""}
                    </Text>
                  </Text>
                  <Text
                    className={`text-slate-400 text-lg font-light italic mt-1 ${isRTL ? "text-right" : "text-left"}`}
                    style={{ fontFamily: "Newsreader_400Regular_Italic" }}
                  >
                    {productSubtitle}
                  </Text>
                </View>

                <View
                  className={`flex-row items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Text className="text-3xl font-medium text-white">
                    {formatCurrency(currentPrice, locale)}
                  </Text>
                  <View
                    className={`flex-row items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    {renderStars()}
                    <Text className="ml-1 text-slate-500 text-sm">
                      ({product.review_count})
                    </Text>
                  </View>
                </View>

                <View className={isRTL ? "items-end" : "items-start"}>
                  <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                    {t("product.select_variant")}
                  </Text>
                  <View
                    className={`flex-row flex-wrap p-1 gap-2 rounded-lg bg-surface-dark border border-white/10 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    {variants
                      ? variants.map((v, i) => (
                          <TouchableOpacity
                            key={i}
                            onPress={() => setSelectedVariantIdx(i)}
                            className={`py-3 px-4 items-center justify-center rounded-md ${selectedVariantIdx === i ? "bg-primary shadow-sm" : "bg-transparent"} ${v.stock_qty <= 0 ? "opacity-50" : ""}`}
                          >
                            <Text
                              className={`text-sm font-bold ${selectedVariantIdx === i ? "text-black" : "text-slate-400"} ${v.stock_qty <= 0 ? "line-through" : ""}`}
                            >
                              {v.size_ml}ml{" "}
                              {locale === "ar"
                                ? v.concentration_ar || v.concentration
                                : v.concentration}
                            </Text>
                          </TouchableOpacity>
                        ))
                      : sizes.map((s, i) => (
                          <TouchableOpacity
                            key={i}
                            onPress={() => setSelectedVariantIdx(i)}
                            className={`py-3 px-4 items-center justify-center rounded-md ${selectedVariantIdx === i ? "bg-primary shadow-sm" : "bg-transparent"}`}
                          >
                            <Text
                              className={`text-sm font-bold ${selectedVariantIdx === i ? "text-black" : "text-slate-400"}`}
                            >
                              {s.size}
                            </Text>
                          </TouchableOpacity>
                        ))}
                  </View>
                </View>

                {/* Scent Profiles */}
                {profiles.length > 0 && (
                  <View className={isRTL ? "items-end" : "items-start"}>
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      {t("product.scent_profile")}
                    </Text>
                    <View
                      className={`flex-row gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      {profiles.map((p, i) => (
                        <View
                          key={i}
                          className="flex-1 flex-col items-center justify-center py-4 bg-surface-dark rounded-xl border border-white/5"
                        >
                          <MaterialIcons
                            name={
                              (ICON_MAP[p.icon || ""] ||
                                p.icon ||
                                "park") as any
                            }
                            size={32}
                            color="#f4c025"
                          />
                          <Text className="text-sm font-medium text-slate-200 mt-2">
                            {locale === "ar" ? p.name_ar || p.name : p.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Description */}
                <Text
                  className={`text-slate-300 leading-relaxed text-sm ${isRTL ? "text-right" : "text-left"}`}
                >
                  {productDesc}
                </Text>

                {/* Add to Bag */}
                <TouchableOpacity
                  className={`w-full py-4 px-6 rounded-xl shadow-lg flex-row items-center justify-between mt-4 ${isRTL ? "flex-row-reverse" : ""} ${isAdding ? "bg-green-500" : variants && variants[selectedVariantIdx]?.stock_qty <= 0 ? "bg-white/10" : "bg-primary"}`}
                  disabled={
                    isAdding ||
                    (variants && variants[selectedVariantIdx]?.stock_qty <= 0)
                  }
                  onPress={() => {
                    setIsAdding(true);
                    if (variants) {
                      const selected = variants[selectedVariantIdx];
                      addToCart(
                        product,
                        `${selected.size_ml}ml ${selected.concentration}`,
                        selected.id,
                      );
                    } else {
                      addToCart(product, sizes[selectedVariantIdx].size);
                    }
                    setTimeout(() => setIsAdding(false), 1500);
                  }}
                >
                  <Text
                    className={`font-bold text-lg ${variants && variants[selectedVariantIdx]?.stock_qty <= 0 ? "text-white/40" : "text-black"}`}
                  >
                    {isAdding
                      ? t("product.added_to_bag")
                      : variants && variants[selectedVariantIdx]?.stock_qty <= 0
                        ? t("product.out_of_stock")
                        : t("product.add_to_bag")}
                  </Text>
                  <View
                    className={`flex-row items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    {(!variants ||
                      variants[selectedVariantIdx]?.stock_qty > 0) && (
                      <Text className="text-black/80 font-bold">
                        {formatCurrency(currentPrice, locale)}
                      </Text>
                    )}
                    <MaterialIcons
                      name={
                        isAdding
                          ? "check"
                          : isRTL
                            ? "arrow-back"
                            : "arrow-forward"
                      }
                      size={20}
                      color={
                        variants && variants[selectedVariantIdx]?.stock_qty <= 0
                          ? "white"
                          : "black"
                      }
                    />
                  </View>
                </TouchableOpacity>

                {/* Notify Me – Back in Stock (Desktop) */}
                {variants && variants[selectedVariantIdx]?.stock_qty <= 0 && (
                  <TouchableOpacity
                    className={`w-full py-3 px-6 rounded-xl border mt-3 flex-row items-center justify-center gap-2 ${
                      isSubscribed(
                        product.id,
                        variants[selectedVariantIdx]?.id,
                      ) || notifySuccess
                        ? "border-green-500/30"
                        : "border-white/20"
                    }`}
                    disabled={
                      bisLoading ||
                      isSubscribed(
                        product.id,
                        variants[selectedVariantIdx]?.id,
                      ) ||
                      notifySuccess
                    }
                    onPress={async () => {
                      const ok = await subscribe(
                        product.id,
                        variants[selectedVariantIdx]?.id,
                      );
                      if (ok) setNotifySuccess(true);
                    }}
                  >
                    <MaterialIcons
                      name="notifications-none"
                      size={16}
                      color={
                        isSubscribed(
                          product.id,
                          variants[selectedVariantIdx]?.id,
                        ) || notifySuccess
                          ? "#4ade80"
                          : "white"
                      }
                    />
                    <Text
                      className={`text-xs font-bold uppercase tracking-widest ${isSubscribed(product.id, variants[selectedVariantIdx]?.id) || notifySuccess ? "text-green-400" : "text-white"}`}
                    >
                      {isSubscribed(
                        product.id,
                        variants[selectedVariantIdx]?.id,
                      ) || notifySuccess
                        ? t("product.will_be_notified")
                        : t("product.notify_me")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Fragrance Notes - Full width below */}
            <View className="px-8 mt-8">
              <Text
                className={`text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("product.fragrance_notes")}
              </Text>
              <View
                className={`flex-row gap-8 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                {[
                  {
                    label: t("product.top_notes"),
                    desc: t("product.top_notes_desc"),
                    items: notes.top,
                    active: true,
                  },
                  {
                    label: t("product.heart_notes"),
                    desc: t("product.heart_notes_desc"),
                    items: notes.heart,
                    active: false,
                  },
                  {
                    label: t("product.base_notes"),
                    desc: t("product.base_notes_desc"),
                    items: notes.base,
                    active: false,
                  },
                ].map((note, i) => (
                  <View
                    key={i}
                    className={`flex-1 bg-surface-dark rounded-xl p-5 border border-white/5 ${isRTL ? "items-end" : "items-start"}`}
                  >
                    <Text className="text-base font-semibold text-white mb-1">
                      {note.label}
                    </Text>
                    <Text className="text-slate-400 text-sm italic mb-3">
                      {note.desc}
                    </Text>
                    <View
                      className={`flex-row flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      {note.items.map((item: string, j: number) => (
                        <View
                          key={j}
                          className="bg-slate-800 px-3 py-1 rounded-full"
                        >
                          <Text className="text-xs text-slate-300">{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="px-8 mt-4 pb-8">
              <ProductReviews productId={product.id} />
            </View>

            <View className="px-8 mt-4 pb-4">
              <RelatedProducts currentProduct={product} />
            </View>

            <View className="px-8 pb-20">
              <RecentlyViewed currentProductId={product.id} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // === MOBILE LAYOUT (pixel-perfect match to Stitch design) ===
  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className="flex-1 w-full mx-auto relative">
        {/* Top Navigation */}
        <View
          className={`absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between p-4 bg-background-dark/80 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex h-10 w-10 items-center justify-center rounded-full"
          >
            <MaterialIcons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <Text className="text-sm font-semibold tracking-widest uppercase text-white/0">
            {productName}
          </Text>
          <TouchableOpacity
            className="flex h-10 w-10 items-center justify-center rounded-full"
            onPress={() => toggleFavorite(product.id)}
          >
            <MaterialIcons
              name={isFavorite(product.id) ? "favorite" : "favorite-border"}
              size={24}
              color={isFavorite(product.id) ? "#ef4444" : "white"}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          className="flex-1 pt-16"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Hero Image */}
          <View className="px-4 pb-6">
            <View className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm bg-slate-800">
              <View className="absolute inset-0 bg-black/20 z-10" />
              <Image
                source={{ uri: product.image_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {(product.is_new || product.is_limited) && (
                <View
                  className={`absolute bottom-4 ${isRTL ? "right-4" : "left-4"} z-20`}
                >
                  <View className="bg-black/80 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold uppercase tracking-widest text-white">
                      {product.is_limited
                        ? t("common.limited_edition")
                        : t("common.new_arrival")}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View className="px-6 flex-col gap-6">
            {/* Header & Price */}
            <View className="flex-col gap-1">
              <View
                className={`flex-row justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-4xl font-normal text-white italic leading-tight ${isRTL ? "text-right" : "text-left"}`}
                    style={{ fontFamily: "Newsreader_400Regular_Italic" }}
                  >
                    {productName.split(" ")[0]}{" "}
                    <Text
                      className="not-italic font-medium text-primary"
                      style={{ fontFamily: "Newsreader_400Regular" }}
                    >
                      {productName.split(" ").slice(1).join(" ") || ""}
                    </Text>
                  </Text>
                </View>
                <View
                  className={`flex-col ${isRTL ? "items-start" : "items-end"} pt-2`}
                >
                  <Text className="text-2xl font-medium text-white">
                    {formatCurrency(currentPrice, locale)}
                  </Text>
                  <View
                    className={`flex-row items-center mt-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    {renderStars()}
                    <Text
                      className={`text-slate-500 text-xs ${isRTL ? "mr-1" : "ml-1"}`}
                    >
                      ({product.review_count})
                    </Text>
                  </View>
                </View>
              </View>
              <Text
                className={`text-slate-400 text-lg font-light italic ${isRTL ? "text-right" : "text-left"}`}
                style={{ fontFamily: "Newsreader_400Regular_Italic" }}
              >
                {productSubtitle}
              </Text>
            </View>

            {/* Variant / Size Selection */}
            <View className="py-2 mt-4">
              <Text
                className={`text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("product.select_variant")}
              </Text>
              <View
                className={`flex-row flex-wrap gap-2 p-1 rounded-lg bg-surface-dark border border-white/10 w-full ${isRTL ? "flex-row-reverse" : ""}`}
              >
                {variants
                  ? variants.map((v, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setSelectedVariantIdx(i)}
                        className={`py-3 px-4 flex-grow items-center justify-center rounded-md ${selectedVariantIdx === i ? "bg-primary shadow-sm" : "bg-transparent"} ${v.stock_qty <= 0 ? "opacity-50" : ""}`}
                      >
                        <Text
                          className={`text-sm font-bold ${selectedVariantIdx === i ? "text-black" : "text-slate-400"} ${v.stock_qty <= 0 ? "line-through" : ""}`}
                        >
                          {v.size_ml}ml{" "}
                          {locale === "ar"
                            ? v.concentration_ar || v.concentration
                            : v.concentration}
                        </Text>
                      </TouchableOpacity>
                    ))
                  : sizes.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setSelectedVariantIdx(i)}
                        className={`flex-1 py-3 items-center justify-center rounded-md ${selectedVariantIdx === i ? "bg-primary shadow-sm" : "bg-transparent"}`}
                      >
                        <Text
                          className={`text-sm font-bold ${selectedVariantIdx === i ? "text-white" : "text-slate-400"}`}
                        >
                          {s.size}
                        </Text>
                      </TouchableOpacity>
                    ))}
              </View>
            </View>

            <View className="h-px bg-slate-800 w-full my-4" />

            {/* Scent Profile Icons */}
            {profiles.length > 0 && (
              <View>
                <Text
                  className={`text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("product.scent_profile")}
                </Text>
                <View
                  className={`flex-row justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  {profiles.map((p, i) => (
                    <View
                      key={i}
                      className={`flex-1 ${isRTL ? (i === 0 ? "ml-2" : i === profiles.length - 1 ? "mr-2" : "mx-2") : i === 0 ? "mr-2" : i === profiles.length - 1 ? "ml-2" : "mx-2"} flex-col items-center justify-center py-4 bg-surface-dark rounded-xl border border-white/5 shadow-sm`}
                    >
                      <MaterialIcons
                        name={
                          (ICON_MAP[p.icon || ""] || p.icon || "park") as any
                        }
                        size={32}
                        color="#f4c025"
                      />
                      <Text className="text-sm font-medium text-slate-200 mt-2">
                        {locale === "ar" ? p.name_ar || p.name : p.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Fragrance Notes Timeline */}
            <View className="pb-8 mt-6">
              <Text
                className={`text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("product.fragrance_notes")}
              </Text>
              <View
                className={`${isRTL ? "mr-3 border-r pr-6" : "ml-3 border-l pl-6"} border-slate-700 flex-col gap-8`}
              >
                {[
                  {
                    label: t("product.top_notes"),
                    desc: t("product.top_notes_desc"),
                    items: notes.top,
                    active: true,
                  },
                  {
                    label: t("product.heart_notes"),
                    desc: t("product.heart_notes_desc"),
                    items: notes.heart,
                    active: false,
                  },
                  {
                    label: t("product.base_notes"),
                    desc: t("product.base_notes_desc"),
                    items: notes.base,
                    active: false,
                  },
                ].map((note, i) => (
                  <View
                    key={i}
                    className={`relative ${isRTL ? "items-end" : "items-start"}`}
                  >
                    <View
                      className={`absolute ${isRTL ? "-right-[32.5px]" : "-left-[32.5px]"} top-0.5 w-4 h-4 rounded-full bg-background-dark border-2 ${note.active ? "border-primary" : "border-slate-600"}`}
                    />
                    <Text className="text-base font-semibold text-white leading-none mb-1">
                      {note.label}
                    </Text>
                    <Text
                      className={`text-slate-400 text-sm italic mb-3 ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {note.desc}
                    </Text>
                    <View
                      className={`flex-row flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      {note.items.map((item: string, j: number) => (
                        <View
                          key={j}
                          className="bg-slate-800 px-3 py-1 rounded-full"
                        >
                          <Text className="text-xs text-slate-300">{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="pb-4">
              <Text
                className={`text-slate-300 leading-relaxed text-sm ${isRTL ? "text-right" : "text-left"}`}
              >
                {productDesc}
              </Text>
            </View>

            <View className="pb-8">
              <ProductReviews productId={product.id} />
            </View>

            <View className="pb-4 -mx-2">
              <RelatedProducts currentProduct={product} />
            </View>

            <View className="pb-32 -mx-2">
              <RecentlyViewed currentProductId={product.id} />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom CTA */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background-dark/95 border-t border-white/10 z-40">
          <TouchableOpacity
            className={`w-full py-4 px-6 rounded-xl shadow-lg flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""} ${isAdding ? "bg-green-500" : variants && variants[selectedVariantIdx]?.stock_qty <= 0 ? "bg-white/10" : "bg-primary"}`}
            disabled={
              isAdding ||
              (variants && variants[selectedVariantIdx]?.stock_qty <= 0)
            }
            onPress={() => {
              setIsAdding(true);
              if (variants) {
                const selected = variants[selectedVariantIdx];
                addToCart(
                  product,
                  `${selected.size_ml}ml ${selected.concentration}`,
                  selected.id,
                );
              } else {
                addToCart(product, sizes[selectedVariantIdx].size);
              }
              setTimeout(() => setIsAdding(false), 1500);
            }}
          >
            <Text
              className={`font-bold text-lg ${variants && variants[selectedVariantIdx]?.stock_qty <= 0 ? "text-white/40" : "text-black"}`}
            >
              {isAdding
                ? t("product.added_to_bag")
                : variants && variants[selectedVariantIdx]?.stock_qty <= 0
                  ? t("product.out_of_stock")
                  : t("product.add_to_bag")}
            </Text>
            <View
              className={`flex-row items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {(!variants || variants[selectedVariantIdx]?.stock_qty > 0) && (
                <Text className="text-black/80 font-bold">
                  {formatCurrency(currentPrice, locale)}
                </Text>
              )}
              <MaterialIcons
                name={
                  isAdding ? "check" : isRTL ? "arrow-back" : "arrow-forward"
                }
                size={20}
                color={
                  variants && variants[selectedVariantIdx]?.stock_qty <= 0
                    ? "white"
                    : "black"
                }
              />
            </View>
          </TouchableOpacity>

          {/* Notify Me – Back in Stock (Mobile) */}
          {variants && variants[selectedVariantIdx]?.stock_qty <= 0 && (
            <TouchableOpacity
              className={`w-full py-3 px-6 rounded-xl border mt-2 flex-row items-center justify-center gap-2 ${
                isSubscribed(product.id, variants[selectedVariantIdx]?.id) ||
                notifySuccess
                  ? "border-green-500/30"
                  : "border-white/20"
              }`}
              disabled={
                bisLoading ||
                isSubscribed(product.id, variants[selectedVariantIdx]?.id) ||
                notifySuccess
              }
              onPress={async () => {
                const ok = await subscribe(
                  product.id,
                  variants[selectedVariantIdx]?.id,
                );
                if (ok) setNotifySuccess(true);
              }}
            >
              <MaterialIcons
                name="notifications-none"
                size={16}
                color={
                  isSubscribed(product.id, variants[selectedVariantIdx]?.id) ||
                  notifySuccess
                    ? "#4ade80"
                    : "white"
                }
              />
              <Text
                className={`text-xs font-bold uppercase tracking-widest ${isSubscribed(product.id, variants[selectedVariantIdx]?.id) || notifySuccess ? "text-green-400" : "text-white"}`}
              >
                {isSubscribed(product.id, variants[selectedVariantIdx]?.id) ||
                notifySuccess
                  ? t("product.will_be_notified")
                  : t("product.notify_me")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
