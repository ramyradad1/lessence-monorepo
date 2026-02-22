import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, SafeAreaView, Alert, I18nManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth, useLoyalty } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@lessence/core';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const { loyaltyAccount, redeemPoints, isRedeeming } = useLoyalty(supabase, user?.id);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const locale = i18n.language;
  
  const [loading, setLoading] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isGift, setIsGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  const originalSubtotal = cartTotal;
  const orderTotal = originalSubtotal - discountAmount - loyaltyDiscount;
  
  const [address, setAddress] = useState({
    email: user?.email || '',
    fullName: user?.user_metadata?.full_name || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!address.email || !address.fullName || !address.line1 || !address.city || !address.state || !address.postal_code || !address.country) {
      Alert.alert(t('common:error'), t('checkout:error_initiating_checkout'));
        return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-cod-order', {
        body: {
          cartItems: cart,
          address,
          couponCode: couponCode || undefined,
          isGift,
          giftWrap,
          giftMessage: giftMessage.trim() || undefined
        }
      });

      if (response.error) {
        if (response.error.context && response.error.context.length > 0) {
          const body = await response.error.context.text();
          try {
            const errorObj = JSON.parse(body);
            throw new Error(errorObj.error || t('checkout:error_initiating_checkout'));
          } catch (e) {
            throw new Error(body);
          }
        }
        throw new Error(response.error.message || t('checkout:error_initiating_checkout'));
      }

      const data = response.data;
      
      if (data?.success && data?.orderId) {
        navigation.navigate('OrderConfirmation', { sessionId: data.orderId });
      } else {
        throw new Error(data?.error || t('checkout:error_creating_order'));
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('common:error'), err.message || t('checkout:error_unexpected'));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponError(t('checkout:invalid_coupon'));
      setDiscountAmount(0);
      setDiscountType(null);
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};

      if (session && session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await supabase.functions.invoke('apply-coupon', {
        body: {
          couponCode,
          cartItems: cart
        },
        headers
      });

      if (response.error) {
        if (response.error.context && response.error.context.length > 0) {
          const body = await response.error.context.text();
          try {
            const errorObj = JSON.parse(body);
            throw new Error(errorObj.error || t('checkout:invalid_coupon'));
          } catch (e) {
            throw new Error(body);
          }
        }
        throw new Error(t('checkout:failed_coupon'));
      }

      const data = response.data;
      if (data?.success) {
        setDiscountAmount(data.discountAmount);
        setDiscountType(data.discountType);
        setCouponError(null);
      } else {
        throw new Error(t('checkout:invalid_coupon'));
      }

    } catch (err: any) {
      setCouponError(err.message);
      setDiscountAmount(0);
      setDiscountType(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRedeemPoints = async () => {
    const points = parseInt(pointsToRedeem);
    if (isNaN(points) || points <= 0) {
      setLoyaltyError(t('checkout:invalid_points'));
      return;
    }

    if (points > (loyaltyAccount?.points_balance || 0)) {
      setLoyaltyError(t('checkout:insufficient_points'));
      return;
    }

    setLoyaltyError(null);
    try {
      const result = await redeemPoints(points);
      if (result.success) {
        setLoyaltyDiscount(prev => prev + result.discountAmount);
        setPointsToRedeem('');
        Alert.alert(t('common:success'), t('checkout:redeem_success_msg', { points, discount: formatCurrency(result.discountAmount, locale) }));
      }
    } catch (err: any) {
      setLoyaltyError(err.message);
    }
  };

  if (!cart) {
    return (
      <View className="flex-1 items-center justify-center bg-background-dark">
        <ActivityIndicator size="large" color="#f4c025" />
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background-dark px-4">
        <MaterialIcons name="shopping-basket" size={64} color="rgba(255,255,255,0.1)" />
        <Text className="text-xl font-light text-white mt-6 mb-8 text-center">{t('checkout:cart_empty')}</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-primary px-8 py-3 rounded-xl shadow-lg"
        >
          <Text className="text-black font-bold text-center">{t('checkout:continue_shopping')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className={`flex-row items-center px-4 py-4 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <MaterialIcons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
        </TouchableOpacity>
        <Text className={`flex-1 text-xl font-bold text-white ${isRTL ? 'mr-2 text-right' : 'ml-2'}`}>{t('checkout:checkout')}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Contact Info */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className={`text-lg font-bold text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('checkout:contact_info')}</Text>
          <TextInput
            placeholder={`${t('checkout:email')} *`}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.email}
            onChangeText={(text) => setAddress({...address, email: text})}
            className={`w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3 ${isRTL ? 'text-right' : 'text-left'}`}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Shipping Address */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className={`text-lg font-bold text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('checkout:shipping_address')}</Text>
          <TextInput
            placeholder={`${t('checkout:full_name')} *`}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.fullName}
            onChangeText={(text) => setAddress({...address, fullName: text})}
            className={`w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3 ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <TextInput
            placeholder={`${t('checkout:address_line_1')} *`}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.line1}
            onChangeText={(text) => setAddress({...address, line1: text})}
            className={`w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3 ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <TextInput
            placeholder={t('checkout:address_line_2')}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.line2}
            onChangeText={(text) => setAddress({...address, line2: text})}
            className={`w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3 ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <View className={`flex-row gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
             <TextInput
              placeholder={`${t('checkout:city')} *`}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.city}
                onChangeText={(text) => setAddress({...address, city: text})}
              className={`flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white ${isRTL ? 'text-right' : 'text-left'}`}
             />
             <TextInput
              placeholder={`${t('checkout:governorate')} *`}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.state}
                onChangeText={(text) => setAddress({...address, state: text})}
              className={`flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white ${isRTL ? 'text-right' : 'text-left'}`}
             />
          </View>
          <View className={`flex-row gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
             <TextInput
              placeholder={`${t('checkout:zip_code')} *`}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.postal_code}
                onChangeText={(text) => setAddress({...address, postal_code: text})}
              className={`flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white ${isRTL ? 'text-right' : 'text-left'}`}
             />
             <TextInput
              placeholder={`${t('checkout:country')} *`}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.country}
                onChangeText={(text) => setAddress({...address, country: text})}
              className={`flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white ${isRTL ? 'text-right' : 'text-left'}`}
             />
          </View>
        </View>

        {/* Gift Options */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <TouchableOpacity
            className={`flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
            onPress={() => {
              setIsGift(!isGift);
              if (!isGift) {
                setGiftWrap(false);
                setGiftMessage('');
              }
            }}
          >
            <Text className="text-lg font-bold text-white">{t('checkout:is_gift')}</Text>
            <View className={`w-6 h-6 rounded-md border items-center justify-center ${isGift ? 'bg-[#f4c025] border-[#f4c025]' : 'bg-transparent border-white/10'}`}>
              {isGift && <MaterialIcons name="check" size={16} color="black" />}
            </View>
          </TouchableOpacity>

          {isGift && (
            <View className="mt-4 pt-4 border-t border-white/10">
              <TouchableOpacity
                className={`flex-row items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
                onPress={() => setGiftWrap(!giftWrap)}
              >
                <View className={`w-5 h-5 rounded border items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'} ${giftWrap ? 'bg-[#f4c025] border-[#f4c025]' : 'bg-transparent border-white/10'}`}>
                  {giftWrap && <MaterialIcons name="check" size={14} color="black" />}
                </View>
                <Text className="text-white/80">{t('checkout:gift_wrap')}</Text>
              </TouchableOpacity>

              <View>
                <View className={`flex-row justify-between items-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-white/80">{t('checkout:gift_message')}</Text>
                  <Text className={`text-xs ${giftMessage.length > 250 ? 'text-red-400' : 'text-white/40'}`}>
                    {giftMessage.length}/250
                  </Text>
                </View>
                <TextInput
                  placeholder={t('checkout:gift_message_placeholder')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={giftMessage}
                  onChangeText={(text) => setGiftMessage(text.substring(0, 250))}
                  multiline
                  numberOfLines={4}
                  className={`w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white min-h-[100px] ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className={`text-lg font-bold text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('checkout:order_summary')}</Text>
          
          <View className="mb-4">
            {cart.map((item, idx) => {
              let sizePrice = item.price;
              if (item.variant) {
                sizePrice = item.variant.price;
              } else if (item.size_options && item.selectedSize) {
                sizePrice = item.size_options.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || item.price;
              }
              sizePrice = sizePrice || 0;
              const key = item.variant_id ? `${item.id}-${item.variant_id}-${idx}` : `${item.id}-${item.selectedSize}-${idx}`;

              const localizedName = locale === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name);
              const variantInfo = item.variant_id
                ? `${item.variant?.size_ml}ml ${locale === 'ar' ? (item.variant?.concentration_ar || item.variant?.concentration) : item.variant?.concentration}`
                : item.selectedSize;

              return (
                <View key={key} className={`flex-row justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Text className={`text-gray-300 flex-1 ${isRTL ? 'text-right pl-4' : 'text-left pr-4'}`} numberOfLines={1}>
                    {item.quantity}x {localizedName} ({variantInfo})
                  </Text>
                  <Text className="text-white font-medium pl-2">{formatCurrency(sizePrice * item.quantity, locale)}</Text>
                </View>
              );
            })}
          </View>

          <View className="mb-4">
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TextInput
                placeholder={t('checkout:coupon_label')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  if (discountAmount > 0) {
                    setDiscountAmount(0);
                    setDiscountType(null);
                  }
                }}
                className={`flex-1 bg-background-dark border border-white/10 px-4 py-3 text-white ${isRTL ? 'rounded-r-xl text-right border-l-0' : 'rounded-l-xl border-r-0'}`}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode}
                className={`bg-white/10 px-6 justify-center items-center border border-white/10 ${isRTL ? 'rounded-l-xl' : 'rounded-r-xl'}`}
              >
                {isApplyingCoupon ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                    <Text className="text-white font-bold text-xs uppercase">{t('checkout:apply')}</Text>
                )}
              </TouchableOpacity>
            </View>
            {couponError && (
              <Text className={`text-red-400 text-xs mt-2 ${isRTL ? 'text-right mr-1' : 'ml-1'}`}>{couponError}</Text>
            )}
            {discountAmount > 0 && !couponError && (
              <Text className={`text-emerald-400 text-xs mt-2 ${isRTL ? 'text-right mr-1' : 'ml-1'}`}>{t('checkout:discount_success')}</Text>
            )}
            {discountType === 'free_shipping' && !couponError && (
              <Text className={`text-emerald-400 text-xs mt-2 ${isRTL ? 'text-right mr-1' : 'ml-1'}`}>{t('checkout:free_shipping_applied')}</Text>
            )}
          </View>

          {/* Loyalty Points Redemption */}
          {loyaltyAccount && loyaltyAccount.points_balance > 0 && (
            <View className="mb-4 pt-4 border-t border-white/5">
              <View className={`flex-row justify-between items-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Text className="text-white font-medium">{t('checkout:loyalty_points')}</Text>
                <Text className="text-primary text-xs font-bold">{t('checkout:points_balance', { points: loyaltyAccount.points_balance })}</Text>
              </View>
              <View className={`flex-row ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TextInput
                  placeholder={t('checkout:points_placeholder')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={pointsToRedeem}
                  onChangeText={setPointsToRedeem}
                  className={`flex-1 bg-background-dark border border-white/10 px-4 py-3 text-white ${isRTL ? 'rounded-r-xl text-right border-l-0' : 'rounded-l-xl border-r-0'}`}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={handleRedeemPoints}
                  disabled={isRedeeming || !pointsToRedeem}
                  className={`bg-primary/20 px-6 justify-center items-center border border-white/10 ${isRTL ? 'rounded-l-xl' : 'rounded-r-xl'}`}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#f4c025" />
                  ) : (
                      <Text className="text-primary font-bold text-xs uppercase">{t('checkout:redeem')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              {loyaltyError && (
                <Text className={`text-red-400 text-xs mt-2 ${isRTL ? 'text-right mr-1' : 'ml-1'}`}>{loyaltyError}</Text>
              )}
              {loyaltyDiscount > 0 && (
                <Text className={`text-emerald-400 text-xs mt-2 ${isRTL ? 'text-right mr-1' : 'ml-1'}`}>{t('checkout:points_applied')}</Text>
              )}
            </View>
          )}

          <View className="flex-col gap-2 pt-4 border-t border-white/10 mt-2">
            <View className={`flex-row justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Text className="text-gray-400 text-xs uppercase tracking-wider">{t('checkout:subtotal')}</Text>
              <Text className="text-white">{formatCurrency(originalSubtotal, locale)}</Text>
            </View>
            {discountAmount > 0 && (
              <View className={`flex-row justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Text className="text-emerald-400/80 text-xs uppercase tracking-wider">{t('checkout:discount')}</Text>
                <Text className="text-emerald-400/80">-{formatCurrency(discountAmount, locale)}</Text>
              </View>
            )}
            {loyaltyDiscount > 0 && (
              <View className={`flex-row justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Text className="text-primary/80 text-xs uppercase tracking-wider">{t('checkout:loyalty_points')}</Text>
                <Text className="text-primary/80">-{formatCurrency(loyaltyDiscount, locale)}</Text>
              </View>
            )}
            <View className={`flex-row justify-between items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Text className="text-gray-400 text-xs uppercase tracking-wider">{t('checkout:shipping')}</Text>
              <Text className={discountType === 'free_shipping' ? "text-emerald-400 font-bold" : "text-gray-500 italic text-xs"}>
                {discountType === 'free_shipping' ? t('checkout:free') : t('checkout:calculated_next_step')}
              </Text>
            </View>
            <View className={`flex-row items-center justify-between pt-4 border-t border-white/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Text className="text-white font-medium">{t('checkout:total')}</Text>
              <Text className="text-2xl font-bold text-primary">{formatCurrency(Math.max(0, orderTotal), locale)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Footer */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background-dark/95 border-t border-white/5">
        <TouchableOpacity 
          disabled={loading}
          onPress={handleCheckout}
          className={`w-full ${loading ? 'bg-primary/50' : 'bg-primary'} py-4 rounded-xl items-center shadow-lg flex-row justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="black" size="small" />
          ) : (
            <>
                <Text className="text-black font-bold text-lg">{t('checkout:place_order')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

