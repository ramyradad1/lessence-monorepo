import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Bundle, formatCurrency } from '@lessence/core';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth, useBundleBySlug } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function BundleDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const slug = route.params?.slug;
  const { bundle, loading, error } = useBundleBySlug(supabase, slug);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const locale = i18n.language;

  if (loading) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" />
      </View>
    );
  }

  if (error || !bundle) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center p-6">
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text className={`text-white text-lg font-bold mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('bundle_not_found')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 bg-white/5 px-6 py-3 rounded-xl">
          <Text className="text-primary font-bold">{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(bundle, undefined, undefined, true);
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className="flex-1 w-full mx-auto relative">
        {/* Top Navigation */}
        <View className={`absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between p-4 bg-background-dark/80 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="flex h-10 w-10 items-center justify-center rounded-full">
            <MaterialIcons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="flex h-10 w-10 items-center justify-center rounded-full" onPress={() => toggleFavorite(bundle.id)}>
            <MaterialIcons name={isFavorite(bundle.id) ? "favorite" : "favorite-border"} size={24} color={isFavorite(bundle.id) ? "#ef4444" : "white"} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 pt-16" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Main Image */}
          <View className="px-4 pb-6">
            <View className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm bg-slate-800">
              {bundle.image_url ? (
                <Image source={{ uri: bundle.image_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <MaterialIcons name="card-giftcard" size={64} color="rgba(255,255,255,0.1)" />
                </View>
              )}
              <View className={`absolute bottom-4 z-20 ${isRTL ? 'right-4' : 'left-4'}`}>
                <View className="bg-black/80 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold uppercase tracking-widest text-primary">{t('luxury_gift_set')}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="px-6 flex-col gap-6">
            {/* Header & Price */}
            <View className="flex-col gap-1">
              <View className={`flex-row justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                <View className="flex-1">
                  <Text className={`text-4xl font-normal text-white italic leading-tight ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Newsreader_400Regular_Italic' }}>
                    {bundle.name.split(' ')[0]}{' '}
                    <Text className="not-italic font-medium text-primary" style={{ fontFamily: 'Newsreader_400Regular' }}>
                      {bundle.name.split(' ').slice(1).join(' ') || ''}
                    </Text>
                  </Text>
                </View>
                <View className={`flex-col pt-2 ${isRTL ? 'items-start' : 'items-end'}`}>
                  <Text className="text-3xl font-medium text-white">{formatCurrency(bundle.price, locale)}</Text>
                </View>
              </View>
              <Text className={`text-slate-400 text-lg font-light italic mt-1 ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Newsreader_400Regular_Italic' }}>
                {t('exclusive_bundle')}
              </Text>
            </View>

            {/* Description */}
            <View>
              <Text className={`text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('about_this_set')}</Text>
              <Text className={`text-slate-300 leading-relaxed text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{bundle.description}</Text>
            </View>

            <View className="h-px bg-slate-800 w-full" />

            {/* Included Items */}
            <View>
              <Text className={`text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('included_in_set')}</Text>
              <View className="flex-col gap-3">
                {bundle.items?.map((item: any, idx: number) => (
                  <View key={item.id || idx} className={`flex-row items-center gap-4 bg-surface-dark border border-white/5 rounded-xl p-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Image source={{ uri: item.product?.image_url }} className="h-16 w-16 rounded-lg bg-slate-800" />
                    <View className="flex-1">
                      <Text className={`text-white font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{item.product?.name}</Text>
                      <Text className={`text-slate-400 text-xs mt-0.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {item.variant ? `${item.variant.size_ml}ml ${item.variant.concentration}` : t('standard_size')}
                      </Text>
                      <View className={`mt-2 bg-primary/10 px-2 py-0.5 rounded border border-primary/20 ${isRTL ? 'self-end' : 'self-start'}`}>
                        <Text className="text-primary text-[10px] font-bold uppercase tracking-tighter">
                          {t('qty')}: {item.quantity}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom CTA */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background-dark/95 border-t border-white/10 z-40">
          <TouchableOpacity 
            className={`w-full py-4 px-6 rounded-xl shadow-lg flex-row items-center justify-between ${isAdding ? 'bg-green-500' : 'bg-primary'} ${isRTL ? 'flex-row-reverse' : ''}`}
            disabled={isAdding}
            onPress={handleAddToCart}
          >
            <Text className="font-bold text-lg text-black">{isAdding ? t('added_to_bag') : t('add_set_to_bag')}</Text>
            <View className={`flex-row items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {!isAdding && <Text className="text-black/80 font-bold">{formatCurrency(bundle.price, locale)}</Text>}
              <MaterialIcons name={isAdding ? "check" : "shopping-bag"} size={20} color="black" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
