import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, useWindowDimensions, ActivityIndicator, Modal, TextInput, Switch, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Product } from '@lessence/core';
import { useCategories } from '../hooks/useCategories';
import { useHeroBanner } from '../hooks/useHeroBanner';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../context/CartContext';
import { useAuth, useProductSearch, ProductSearchFilters, useNotifications, usePerformanceTracking } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@lessence/core';

// Fallback data when Supabase is not connected yet
const FALLBACK_PRODUCTS: Product[] = [
  { id: '1', name: 'Velvet Rose', subtitle: 'Eau de Parfum', description: '', price: 120, image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6fAinLXTPnn1NtZXGpP7kDctFKFTPYqj-Hh-yjKwAGEVFmQRmJBe0Tfwmj5KCs_ZZ1br3CXRSRSXR7vID-3CrRhZLxDwO2XNXQmCAB1LqvB2S5SAiWAg5-FgNhV_iICZaMmw-RsZHm5CXvRCdWvIJbLL2VRsYVfYjKnug-UP9k_omvjmgPwQDH5V1UKtN-RqdqRux1jmR78_AWLUu_8sarc2Wbwoud5dRHBwIAckw3qk4_TI3D93eDhvV8W1T8UvcWLM2_LcsCJ1m', category_id: '', size_options: [], scent_profiles: [], fragrance_notes: { top: [], heart: [], base: [] }, rating: 4.5, review_count: 38, is_new: true, is_limited: false },
  { id: '2', name: 'Midnight Oud', subtitle: 'Intense Parfum', description: '', price: 145, image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdC0bsFJLwidqKoCJC16JdiW2LC4xui1Pxpk-L6L2zFQ5Dcl6-IsId7YC-EyIGNaTE9jwIz6WF1RzRKcuGlwV1K_ncPY65w4AO47x2FI4jZM-pC1AnrO2NbWrfJfZY1HnkQ15zveSdZHVohL8wxcyiPyi19EKvT8Tt0zd3-tdJ1J_-9nzS_Vm6qLozLVMXwYOMgkmyM6fRaxYCPwgYBHWCOaRi4Eh47attE0_TUI9bLKr4PTsHgTJLrVHlFwS_V1kTGGHDM_grCxve', category_id: '', size_options: [], scent_profiles: [], fragrance_notes: { top: [], heart: [], base: [] }, rating: 4.8, review_count: 56, is_new: false, is_limited: false },
  { id: '3', name: 'Citrus Breeze', subtitle: 'Eau de Toilette', description: '', price: 95, image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGCt1T_0-iQGpFCp1Mloe8J4RjCyOL02u48IvM_voW_eTCWRHVkpZO947cZ_tOtdYbKp1FHVszH00ekwErrmY4eYs1dC7FYTpZgRBRKCO1xxgHhjzpLg1HUmrMhUyomjnD2VFBlWDWuS58Hdf7pXE9Mp3NR413Wy-xggnjwH4FurxFPxtnejCNJwGymVQoS7KGjRpwOPE6yuGiwjFpB5iXTALHl6bYoZKO7NBYeJtJtCbgPlcE7Kb_XUAR8Np3o8zdNzzWNvvv4fei', category_id: '', size_options: [], scent_profiles: [], fragrance_notes: { top: [], heart: [], base: [] }, rating: 4.3, review_count: 27, is_new: true, is_limited: false },
  { id: '4', name: 'Noire Essence', subtitle: 'Eau de Parfum', description: '', price: 180, image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRTDuGHsKv6gZggTWfA4p2SHMGKLyTdXnoWKr3Wu5ZpeMeK5cdBNdHuBOgaavvDXKXBwl3-1neXavcdbeUjFgJnLy0-U3sRL_oVGfsvk3b961rskG7KhHIHJNbMFg72ELXb1qsM-ieLm_XHaOedBYc70xDv5Q9bJh6jXGqa64nvlO_j5vdH7anYFWNB46lYnY0ouGqIxiAeu7aXEo3lv5USFaJ_rW46yAWlsbFdfM1GJRZUCzGRLzLoEwU0CbL0yVEwaJErzAlvS2Q', category_id: '', size_options: [], scent_profiles: [], fragrance_notes: { top: [], heart: [], base: [] }, rating: 4.5, review_count: 42, is_new: true, is_limited: true },
];

const FALLBACK_CATEGORIES = [
  { id: '0', name: 'All Scents', name_en: 'All Scents', name_ar: 'الكل', slug: 'all', icon: 'local_florist', sort_order: 0 },
  { id: '1', name: 'Floral', name_en: 'Floral', name_ar: 'زهري', slug: 'floral', icon: 'spa', sort_order: 1 },
  { id: '2', name: 'Woody', name_en: 'Woody', name_ar: 'خشبي', slug: 'woody', icon: 'park', sort_order: 2 },
  { id: '3', name: 'Citrus', name_en: 'Citrus', name_ar: 'حمضيات', slug: 'citrus', icon: 'wb_sunny', sort_order: 3 },
  { id: '4', name: 'Oriental', name_en: 'Oriental', name_ar: 'شرقي', slug: 'oriental', icon: 'auto_awesome', sort_order: 4 },
];

import { ProductCard } from '../components/ProductCard';

import { RecentlyViewed } from '../components/RecentlyViewed';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  usePerformanceTracking(supabase, 'mobile_home_load', 'mobile-client');

  // Filters state
  const [filters, setFilters] = useState<ProductSearchFilters>({ sortBy: 'newest' });
  const [draftFilters, setDraftFilters] = useState<ProductSearchFilters>({ sortBy: 'newest' });

  const { products: supabaseProducts, loading: productsLoading } = useProductSearch(supabase, {
    searchQuery: searchQuery,
    categorySlugs: activeCategory !== 'all' ? [activeCategory] : undefined,
    genderTargets: filters.genderTargets,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStockOnly: filters.inStockOnly,
    sortBy: filters.sortBy,
  });

  const { categories: supabaseCategories, loading: catsLoading } = useCategories();
  const { banner } = useHeroBanner();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { cart, cartCount, cartTotal, addToCart, removeFromCart, clearCart, placeOrder } = useCart();
  const { unreadCount } = useNotifications(supabase, user?.id);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleCheckout = () => {
    setIsCartVisible(false);
    navigation.navigate('Checkout');
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const initial = { sortBy: 'newest' as any };
    setDraftFilters(initial);
    setFilters(initial);
    setIsFilterModalOpen(false);
  };

  const baseProducts = supabaseProducts.length > 0 ? supabaseProducts : FALLBACK_PRODUCTS;
  const products = (searchQuery.length >= 2 || Object.keys(filters).length > 1) ? supabaseProducts : baseProducts;
  const categories = supabaseCategories.length > 0 ? supabaseCategories : FALLBACK_CATEGORIES;
  const currentLoading = productsLoading;

  const heroTitle = i18n.language === 'ar' ? (banner?.title_ar || banner?.title) : (banner?.title_en || banner?.title) || t('common:hero_title_fallback');
  const heroSubtitle = i18n.language === 'ar' ? (banner?.subtitle_ar || banner?.subtitle) : (banner?.subtitle_en || banner?.subtitle) || t('common:hero_subtitle_fallback');
  const heroDesc = i18n.language === 'ar' ? (banner?.description_ar || banner?.description) : (banner?.description_en || banner?.description) || t('common:hero_desc_fallback');
  const heroBadge = i18n.language === 'ar' ? (banner?.badge_text_ar || banner?.badge_text) : (banner?.badge_text_en || banner?.badge_text) || t('common:hero_badge_fallback');
  const heroCta = i18n.language === 'ar' ? (banner?.cta_text_ar || banner?.cta_text) : (banner?.cta_text_en || banner?.cta_text) || t('common:hero_cta_fallback');
  const heroImage = banner?.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmz59Oikko0Q3-z9Y_cuN0EOHRAjzIIFzACcv_ZrCxt54PxtmUvsiqUMmLsJ3fWtwR_kHxMWfDhf8RPGi2K0881AEfHAwoTK3_HYNgljZYsPTq20o_wJDF7ZKDJNMa5W7PXo8CnJdt5534EoF2RRXCxdXJ6KFHGrCeJwYnEpquaQHZLWlDfsB-2mv3ijMZrzLJwtnx0J8kjFmWAxyQ5y1rH5X_E5SVXRqVthpiaZV-huqgcFcKw3Qs8EzAoA8HHzgkBMEm1Hz3KIiP';

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className="flex-1 w-full mx-auto" style={isDesktop ? { maxWidth: 1200 } : undefined}>

        {/* Header */}
        <View className={`flex-row items-center justify-between px-4 py-4 bg-background-dark/90 border-b border-white/5 z-20 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity className="p-2 rounded-full" onPress={() => setIsSearchOpen(!isSearchOpen)}>
              <MaterialIcons name={isSearchOpen ? "close" : "search"} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className={`p-2 rounded-full ${isRTL ? 'mr-1' : 'ml-1'}`} onPress={() => { setDraftFilters(filters); setIsFilterModalOpen(true); }}>
              <MaterialIcons name="tune" size={24} color="rgba(255,255,255,0.7)" />
              {Object.keys(filters).length > 1 && <View className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} h-2 w-2 rounded-full bg-primary`} />}
            </TouchableOpacity>
          </View>
          <Text className={`text-xl font-bold tracking-[0.2em] text-white uppercase ${isRTL ? 'mr-4' : 'ml-4'}`}>{t('common:brand_name')}</Text>
          <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity className="relative p-2 rounded-full mx-2" onPress={() => navigation.navigate('Notifications')}>
              <MaterialIcons name="notifications" size={24} color="white" />
              {unreadCount > 0 && (
                <View className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} h-4 w-4 rounded-full bg-primary items-center justify-center border-2 border-background-dark`}>
                  <Text className="text-[9px] font-bold text-black">{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity className="relative p-2 rounded-full" onPress={() => setIsCartVisible(true)}>
              <MaterialIcons name="shopping-bag" size={24} color="white" />
              {cartCount > 0 && (
                <View className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} h-5 w-5 rounded-full bg-primary items-center justify-center border-2 border-background-dark`}>
                  <Text className="text-[10px] font-bold text-black">{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {isSearchOpen && (
          <View className="px-4 py-3 bg-background-dark border-b border-white/5">
            <View className={`flex-row items-center bg-surface-dark border border-white/10 rounded-full px-4 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.3)" />
              <TextInput
                placeholder={t('shop:search_placeholder')}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={localSearch}
                onChangeText={setLocalSearch}
                autoFocus
                className={`flex-1 text-white text-xs tracking-widest ${isRTL ? 'mr-2 text-right' : 'ml-2 text-left'}`}
              />
              {localSearch.length > 0 && (
                <TouchableOpacity onPress={() => { setLocalSearch(''); setSearchQuery(''); }}>
                  <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* Hero Banner */}
          <View className={isDesktop ? 'w-full px-6 pt-6 pb-8' : 'w-full px-4 pt-4 pb-6'}>
            <View className={`relative flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 shadow-xl w-full ${isDesktop ? 'min-h-[500px]' : 'min-h-[420px]'}`}>
              <Image source={{ uri: heroImage }} className="absolute inset-0 h-full w-full opacity-80" resizeMode="cover" />
              <View className="absolute inset-0 bg-black/40" />
              <View className={`relative z-10 justify-end px-6 pb-10 mt-auto w-full ${isRTL ? 'items-end' : 'items-center'}`}>
                <View className="rounded-full bg-white/10 px-3 py-1 border border-white/10 mb-4">
                  <Text className="text-xs font-bold uppercase tracking-widest text-primary">{heroBadge}</Text>
                </View>
                <Text className={`text-4xl font-bold leading-tight tracking-tight text-white mb-1 ${isRTL ? 'text-right' : 'text-center'}`}>{heroTitle}</Text>
                <Text className={`text-4xl font-bold italic text-white/90 mb-4 ${isRTL ? 'text-right' : 'text-center'}`} style={{ fontFamily: 'Newsreader_400Regular_Italic' }}>{heroSubtitle}</Text>
                <Text className={`max-w-[320px] text-sm font-medium leading-relaxed text-gray-200 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>{heroDesc}</Text>
                <TouchableOpacity
                  className="h-12 w-full max-w-[200px] items-center justify-center rounded-lg bg-primary px-6 shadow-lg"
                  onPress={() => navigation.navigate('Shop')}
                >
                  <Text className="text-sm font-bold tracking-wide text-surface-dark">{heroCta}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Category Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }} className={isRTL ? 'flex-row-reverse' : ''}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.slug)}
                className={`rounded-full px-5 py-2 ${activeCategory === cat.slug ? 'bg-surface-dark border border-white/10' : 'bg-transparent border border-transparent'} ${isRTL ? 'ml-3' : 'mr-3'}`}
              >
                <Text className={`text-sm font-semibold ${activeCategory === cat.slug ? 'text-white' : 'text-gray-400'}`}>
                  {i18n.language === 'ar' ? (cat.name_ar || cat.name) : (cat.name_en || cat.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products Section */}
          <View className="mt-6 flex-col gap-4">
            <View className={`flex-row items-center justify-between px-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Text className={`text-xl font-bold tracking-tight text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {searchQuery.length >= 2 ? t('common:results_for', { query: searchQuery }) : t('common:new_arrivals')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-primary">{t('common:see_all')}</Text>
              </TouchableOpacity>
            </View>

            {currentLoading ? (
              <ActivityIndicator color="#f4c025" style={{ marginTop: 20 }} />
            ) : isDesktop ? (
                /* DESKTOP: Grid layout */
                <View className={`flex-row flex-wrap px-4 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {products.length === 0 ? (
                    <View className="w-full items-center py-16">
                      <MaterialIcons name="search-off" size={48} color="rgba(255,255,255,0.1)" />
                      <Text className="text-white/40 mt-4 text-center">{searchQuery ? t('common:no_results', { query: searchQuery }) : t('common:no_products')}</Text>
                    </View>
                  ) : products.map((product) => (
                  <View key={product.id} style={{ width: '23%', minWidth: 200 }}>
                    <ProductCard 
                      product={product} 
                      onPress={() => navigation.navigate('ProductDetails', { product })} 
                      onAdd={() => addToCart(product, '50ml')}
                        isWeb={true}
                        isFav={isFavorite(product.id)}
                        onFavToggle={() => toggleFavorite(product.id)}
                    />
                  </View>
                ))}
              </View>
            ) : (
                  /* MOBILE: Horizontal scroll */
                  products.length === 0 ? (
                    <View className="w-full items-center py-16">
                      <MaterialIcons name="search-off" size={48} color="rgba(255,255,255,0.1)" />
                      <Text className="text-white/40 mt-4 text-center">{searchQuery ? t('common:no_results', { query: searchQuery }) : t('common:no_products')}</Text>
                    </View>
                  ) : (
                      <View>
                        <FlatList
                          horizontal
                          data={products}
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                          keyExtractor={(item) => item.id}
                          className={isRTL ? 'flex-row-reverse' : ''}
                          renderItem={({ item: product }) => (
                            <ProductCard 
                              product={product}
                              onPress={() => navigation.navigate('ProductDetails', { product })}
                              onAdd={() => addToCart(product, '50ml')}
                              isWeb={false}
                              isFav={isFavorite(product.id)}
                              onFavToggle={() => toggleFavorite(product.id)}
                            />
                          )}
                        />
                      </View>
                    )
            )}
          </View>

          <RecentlyViewed />

          {/* Gift Sets Banner */}
          <View className="px-4 pb-8 mt-2">
            <View className={`relative flex-row w-full items-center justify-between overflow-hidden rounded-xl bg-surface-dark px-6 py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <View className={`relative z-10 flex-col gap-2 flex-1 ${isRTL ? 'pl-4' : 'pr-4'} ${isRTL ? 'items-end' : 'items-start'}`}>
                <Text className="text-lg font-bold text-white">{t('common:gift_sets')}</Text>
                <Text className={`text-xs text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common:gift_sets_desc')}</Text>
                <TouchableOpacity className="mt-2" onPress={() => navigation.navigate('Shop', { activeCategory: 'gift-sets' })}>
                  <Text className="text-xs font-bold uppercase tracking-wider text-primary underline">{t('common:shop_gifts')}</Text>
                </TouchableOpacity>
              </View>
              <View className="relative z-10 h-24 w-24">
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjByiage4rvCg5RzBixD9GZ2zjL2M3mcxYzXubmI8QPTi_XC5Pv9LsCEB453Qlv4qKf__CbDIlUB_0XmgRJswZy0zko4_9VDy_yH2XCGuwmMc0MA8hy0fLovjqHlZ5LR59gkgIgGpXbEJu74jDehx-Kzhs1p8Ksf-4t87u6RvFAAgKhAFvzQ9qtIiiFAS_DUFI5tob_jYNUFWvAmuSvBUeOk9vHrqRk-IkxlHRkWNXsvPu8mvQFor6QVLzKIyNpnKuZSxn2wlsuB64' }}
                  className="h-full w-full rounded-lg"
                  style={{ transform: [{ rotate: isRTL ? '-3deg' : '3deg' }] }}
                />
              </View>
            </View>
          </View>

        </ScrollView>
        {/* Cart Modal */}
        <Modal
          visible={isCartVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCartVisible(false)}
        >
          <View className={`flex-1 bg-black/60 ${isRTL ? 'items-start' : 'items-end'}`}>
            <View className={`h-full bg-background-dark shadow-2xl ${isDesktop ? 'w-96' : 'w-full'}`}>
              <SafeAreaView className="flex-1">
                {/* Modal Header */}
                <View className={`flex-row items-center justify-between p-6 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <View className={`flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MaterialIcons name="shopping-bag" size={24} color="#f4c025" />
                    <Text className="text-xl font-bold text-white">{t('checkout:cart_title')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsCartVisible(false)} className="p-2 rounded-full bg-white/5">
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Items List */}
                <ScrollView className="flex-1 px-6 py-4">
                  {lastOrder ? (
                    <View className="flex-1 items-center justify-center py-20">
                      <View className="h-20 w-20 rounded-full bg-green-500/10 items-center justify-center mb-6 border border-green-500/20">
                        <MaterialIcons name="check-circle" size={48} color="#22c55e" />
                      </View>
                      <Text className="text-2xl font-bold text-white mb-2">{t('checkout:order_confirmed')}</Text>
                      <Text className={`text-gray-400 text-center mb-8 px-4`}>{t('checkout:order_success_message', { orderRef: lastOrder })}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setLastOrder(null);
                          setIsCartVisible(false);
                        }}
                        className="bg-primary px-8 py-3 rounded-xl shadow-lg"
                      >
                        <Text className="text-black font-bold">{t('checkout:continue_shopping')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : cart.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                      <MaterialIcons name="shopping-basket" size={64} color="#1f1d18" />
                        <Text className="text-gray-500 mt-4 text-center">{t('checkout:cart_empty')}</Text>
                      <TouchableOpacity 
                        onPress={() => setIsCartVisible(false)}
                        className="mt-6 bg-white/5 px-6 py-3 rounded-lg border border-white/5"
                      >
                          <Text className="text-primary font-bold">{t('checkout:start_shopping')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    cart.map((item, idx) => (
                      <View key={`${item.id}-${item.selectedSize}-${idx}`} className={`flex-row gap-4 mb-6 pb-6 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Image source={{ uri: item.image_url }} className="h-20 w-16 rounded-md bg-surface-dark" />
                        <View className="flex-1">
                          <Text className={`text-white font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                            {i18n.language === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name)}
                          </Text>
                          <Text className={`text-gray-500 text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {i18n.language === 'ar' ? (item.subtitle_ar || item.subtitle) : (item.subtitle_en || item.subtitle)} • {item.selectedSize}
                          </Text>
                          <View className={`flex-row items-center justify-between mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Text className="text-white font-medium">{formatCurrency(Number((item.size_options || []).find((s: any) => s.size === item.selectedSize)?.price || item.price || 0), i18n.language)}</Text>
                            <View className={`flex-row items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <TouchableOpacity onPress={() => removeFromCart(item.id as string, (item.selectedSize || '') as string)}>
                                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                              </TouchableOpacity>
                              <View className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                <Text className="text-white text-xs font-bold">x{item.quantity}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Footer */}
                {cart.length > 0 && !lastOrder && (
                  <View className="p-6 bg-surface-dark border-t border-white/5">
                    <View className={`flex-row items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Text className="text-gray-400 font-medium">{t('checkout:subtotal')}</Text>
                      <Text className="text-2xl font-bold text-white">{formatCurrency(cartTotal, i18n.language)}</Text>
                    </View>
                    <TouchableOpacity 
                      disabled={isCheckingOut}
                      className={`w-full ${isCheckingOut ? 'bg-primary/50' : 'bg-primary'} h-14 rounded-xl items-center justify-center shadow-lg ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                      onPress={handleCheckout}
                    >
                      {isCheckingOut ? (
                        <ActivityIndicator color="black" />
                      ) : (
                          <Text className="text-black font-bold text-lg">{t('checkout:place_order')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </SafeAreaView>
            </View>
          </View>
        </Modal>

        <Modal visible={isFilterModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsFilterModalOpen(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-background-dark border-t border-white/10 rounded-t-3xl h-[85%]" style={isDesktop ? { width: 400, alignSelf: isRTL ? 'flex-start' : 'flex-end', height: '100%', borderRadius: 0, borderLeftWidth: isRTL ? 0 : 1, borderRightWidth: isRTL ? 1 : 0 } : {}}>
              <View className={`flex-row items-center justify-between p-6 pb-4 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Text className={`text-xl font-bold text-white tracking-widest uppercase ${isRTL ? 'text-right' : 'text-left'}`}>{t('shop:filters')}</Text>
                <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} className="p-2 -mr-2">
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <ScrollView className="flex-1 px-6 py-4">

                {/* Sort Options */}
                <Text className={`text-xs font-bold tracking-widest uppercase text-white/50 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('shop:sort_by')}</Text>
                <View className={`flex-row flex-wrap gap-2 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {[
                    { label: t('shop:newest'), value: 'newest' },
                    { label: t('shop:price_asc'), value: 'price_asc' },
                    { label: t('shop:price_desc'), value: 'price_desc' },
                    { label: t('shop:most_popular'), value: 'most_popular' }
                  ].map(sort => (
                    <TouchableOpacity
                      key={sort.value}
                      onPress={() => setDraftFilters(prev => ({ ...prev, sortBy: sort.value as any }))}
                      className={`px-4 py-2 rounded-full border ${draftFilters.sortBy === sort.value ? 'bg-primary border-primary' : 'bg-surface-dark border-white/10'}`}
                    >
                      <Text className={`text-xs font-bold ${draftFilters.sortBy === sort.value ? 'text-black' : 'text-white/70'}`}>{sort.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Gender Targets */}
                <Text className={`text-xs font-bold tracking-widest uppercase text-white/50 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('shop:gender_target')}</Text>
                <View className={`flex-row flex-wrap gap-2 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {[
                    { label: t('shop:unisex'), value: 'unisex' },
                    { label: t('shop:women'), value: 'women' },
                    { label: t('shop:men'), value: 'men' }
                  ].map(gender => (
                    <TouchableOpacity
                      key={gender.value}
                      onPress={() => setDraftFilters(prev => ({ ...prev, genderTargets: prev.genderTargets?.includes(gender.value) ? [] : [gender.value] }))}
                      className={`px-4 py-2 rounded-full border ${draftFilters.genderTargets?.includes(gender.value) ? 'bg-primary border-primary' : 'bg-surface-dark border-white/10'}`}
                    >
                      <Text className={`text-xs font-bold ${draftFilters.genderTargets?.includes(gender.value) ? 'text-black' : 'text-white/70'}`}>{gender.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Price Range */}
                <Text className={`text-xs font-bold tracking-widest uppercase text-white/50 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('shop:price_range')}</Text>
                <View className={`flex-row items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TextInput
                    placeholder={t('shop:min')}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    value={draftFilters.minPrice ? String(draftFilters.minPrice) : ''}
                    onChangeText={(val) => setDraftFilters(prev => ({ ...prev, minPrice: val ? Number(val) : undefined }))}
                    className={`flex-1 bg-surface-dark border border-white/10 rounded-lg px-4 py-3 text-white text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                  <Text className="text-white/30">-</Text>
                  <TextInput
                    placeholder={t('shop:max')}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    value={draftFilters.maxPrice ? String(draftFilters.maxPrice) : ''}
                    onChangeText={(val) => setDraftFilters(prev => ({ ...prev, maxPrice: val ? Number(val) : undefined }))}
                    className={`flex-1 bg-surface-dark border border-white/10 rounded-lg px-4 py-3 text-white text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </View>

                {/* In Stock */}
                <View className={`flex-row items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-sm font-bold tracking-widest uppercase text-white">{t('shop:in_stock_only')}</Text>
                  <Switch
                    value={!!draftFilters.inStockOnly}
                    onValueChange={(val) => setDraftFilters(prev => ({ ...prev, inStockOnly: val }))}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#f4c025' }}
                    thumbColor={draftFilters.inStockOnly ? '#000' : '#fff'}
                  />
                </View>

              </ScrollView>

              <View className={`p-6 border-t border-white/5 flex-row gap-4 bg-background-dark ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TouchableOpacity onPress={clearFilters} className="flex-1 items-center justify-center py-4">
                  <Text className="text-white/60 font-bold uppercase tracking-widest text-xs">{t('shop:clear_all')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyFilters} className="flex-1 bg-primary items-center justify-center py-4 rounded-full shadow-lg">
                  <Text className="text-black font-bold uppercase tracking-widest text-xs">{t('shop:apply_filters')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}
