import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth, useLoyalty } from '@lessence/supabase';
import { supabase } from '../lib/supabase';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const { loyaltyAccount, redeemPoints, isRedeeming } = useLoyalty(supabase, user?.id);
  
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
        Alert.alert('Missing Info', 'Please fill in all required address fields.');
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
            throw new Error(errorObj.error || 'Error initiating checkout');
          } catch (e) {
            throw new Error(body);
          }
        }
          throw new Error(response.error.message || 'Error initiating checkout');
      }

      const data = response.data;
      
      if (data?.success && data?.orderId) {
        navigation.navigate('CheckoutSuccess', { sessionId: data.orderId });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Checkout Error', err.message || 'An unexpected error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponError('Please enter a coupon code.');
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
            throw new Error(errorObj.error || 'Invalid coupon.');
          } catch (e) {
            throw new Error(body);
          }
        }
        throw new Error('Failed to validate coupon.');
      }

      const data = response.data;
      if (data?.success) {
        setDiscountAmount(data.discountAmount);
        setDiscountType(data.discountType);
        setCouponError(null);
      } else {
        throw new Error('Invalid coupon response.');
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
      setLoyaltyError('Enter a valid amount of points.');
      return;
    }

    if (points > (loyaltyAccount?.points_balance || 0)) {
      setLoyaltyError('Insufficient points balance.');
      return;
    }

    setLoyaltyError(null);
    try {
      const result = await redeemPoints(points);
      if (result.success) {
        setLoyaltyDiscount(prev => prev + result.discountAmount);
        setPointsToRedeem('');
        Alert.alert('Success', `Redeemed ${points} points for $${result.discountAmount.toFixed(2)} discount!`);
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
        <Text className="text-xl font-light text-white mt-6 mb-8 text-center">Your Cart is Empty</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-primary px-8 py-3 rounded-xl shadow-lg"
        >
          <Text className="text-black font-bold text-center">Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className="flex-row items-center px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-white ml-2">Checkout</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Contact Info */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Contact</Text>
          <TextInput
            placeholder="Email Address *"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.email}
            onChangeText={(text) => setAddress({...address, email: text})}
            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Shipping Address */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Shipping Address</Text>
          <TextInput
            placeholder="Full Name *"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.fullName}
            onChangeText={(text) => setAddress({...address, fullName: text})}
            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3"
          />
          <TextInput
            placeholder="Address Line 1 *"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.line1}
            onChangeText={(text) => setAddress({...address, line1: text})}
            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3"
          />
          <TextInput
            placeholder="Address Line 2 (Optional)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={address.line2}
            onChangeText={(text) => setAddress({...address, line2: text})}
            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white mb-3"
          />
          <View className="flex-row gap-3 mb-3">
             <TextInput
                placeholder="City *"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.city}
                onChangeText={(text) => setAddress({...address, city: text})}
                className="flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white"
             />
             <TextInput
                placeholder="State *"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.state}
                onChangeText={(text) => setAddress({...address, state: text})}
                className="flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white"
             />
          </View>
          <View className="flex-row gap-3">
             <TextInput
                placeholder="ZIP Code *"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.postal_code}
                onChangeText={(text) => setAddress({...address, postal_code: text})}
                className="flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white"
             />
             <TextInput
                placeholder="Country *"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address.country}
                onChangeText={(text) => setAddress({...address, country: text})}
                className="flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white"
             />
          </View>
        </View>

        {/* Gift Options */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => {
              setIsGift(!isGift);
              if (isGift) {
                setGiftWrap(false);
                setGiftMessage('');
              }
            }}
          >
            <Text className="text-lg font-bold text-white">This order is a gift</Text>
            <View className={`w-6 h-6 rounded-md border items-center justify-center ${isGift ? 'bg-[#f4c025] border-[#f4c025]' : 'bg-transparent border-white/10'}`}>
              {isGift && <MaterialIcons name="check" size={16} color="black" />}
            </View>
          </TouchableOpacity>

          {isGift && (
            <View className="mt-4 pt-4 border-t border-white/10">
              <TouchableOpacity
                className="flex-row items-center mb-4"
                onPress={() => setGiftWrap(!giftWrap)}
              >
                <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${giftWrap ? 'bg-[#f4c025] border-[#f4c025]' : 'bg-transparent border-white/10'}`}>
                  {giftWrap && <MaterialIcons name="check" size={14} color="black" />}
                </View>
                <Text className="text-white/80">Add elegant gift wrapping (Complimentary)</Text>
              </TouchableOpacity>

              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white/80">Gift Message (Optional)</Text>
                  <Text className={`text-xs ${giftMessage.length > 250 ? 'text-red-400' : 'text-white/40'}`}>
                    {giftMessage.length}/250
                  </Text>
                </View>
                <TextInput
                  placeholder="Write a personalized message for the recipient..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={giftMessage}
                  onChangeText={(text) => setGiftMessage(text.substring(0, 250))}
                  multiline
                  numberOfLines={4}
                  className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white min-h-[100px]"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Order Summary</Text>
          
          <View className="mb-4">
            {cart.map((item, idx) => {
              let sizePrice = item.price;
              if (item.variant) {
                sizePrice = item.variant.price;
              } else if (item.size_options && item.selectedSize) {
                sizePrice = item.size_options.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || item.price;
              }
              const key = item.variant_id ? `${item.id}-${item.variant_id}-${idx}` : `${item.id}-${item.selectedSize}-${idx}`;
              return (
                <View key={key} className="flex-row justify-between mb-2">
                  <Text className="text-gray-300 flex-1 pr-4" numberOfLines={1}>
                    {item.quantity}x {item.name} ({item.variant_id ? `${item.variant?.size_ml}ml ${item.variant?.concentration}` : item.selectedSize})
                  </Text>
                  <Text className="text-white font-medium pl-2">${(sizePrice * item.quantity).toFixed(2)}</Text>
                </View>
              );
            })}
          </View>

          <View className="mb-4">
            <View className="flex-row">
              <TextInput
                placeholder="Coupon Code"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  if (discountAmount > 0) {
                    setDiscountAmount(0);
                    setDiscountType(null);
                  }
                }}
                className="flex-1 bg-background-dark border border-white/10 rounded-l-xl px-4 py-3 text-white"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode}
                className="bg-white/10 px-6 justify-center items-center rounded-r-xl border border-l-0 border-white/10"
              >
                {isApplyingCoupon ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-xs uppercase">Apply</Text>
                )}
              </TouchableOpacity>
            </View>
            {couponError && (
              <Text className="text-red-400 text-xs mt-2 ml-1">{couponError}</Text>
            )}
            {discountAmount > 0 && !couponError && (
              <Text className="text-emerald-400 text-xs mt-2 ml-1">Discount applied successfully!</Text>
            )}
            {discountType === 'free_shipping' && !couponError && (
              <Text className="text-emerald-400 text-xs mt-2 ml-1">Free shipping applied!</Text>
            )}
          </View>

          {/* Loyalty Points Redemption */}
          {loyaltyAccount && loyaltyAccount.points_balance > 0 && (
            <View className="mb-4 pt-4 border-t border-white/5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white font-medium">Loyalty Points</Text>
                <Text className="text-primary text-xs font-bold">Balance: {loyaltyAccount.points_balance}</Text>
              </View>
              <View className="flex-row">
                <TextInput
                  placeholder="Points to use"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={pointsToRedeem}
                  onChangeText={setPointsToRedeem}
                  className="flex-1 bg-background-dark border border-white/10 rounded-l-xl px-4 py-3 text-white"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={handleRedeemPoints}
                  disabled={isRedeeming || !pointsToRedeem}
                  className="bg-primary/20 px-6 justify-center items-center rounded-r-xl border border-l-0 border-white/10"
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#f4c025" />
                  ) : (
                    <Text className="text-primary font-bold text-xs uppercase">Redeem</Text>
                  )}
                </TouchableOpacity>
              </View>
              {loyaltyError && (
                <Text className="text-red-400 text-xs mt-2 ml-1">{loyaltyError}</Text>
              )}
              {loyaltyDiscount > 0 && (
                <Text className="text-emerald-400 text-xs mt-2 ml-1">Points discount applied!</Text>
              )}
            </View>
          )}

          <View className="flex-col gap-2 pt-4 border-t border-white/10 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs uppercase tracking-wider">Subtotal</Text>
              <Text className="text-white">${originalSubtotal.toFixed(2)}</Text>
            </View>
            {discountAmount > 0 && (
              <View className="flex-row justify-between items-center">
                <Text className="text-emerald-400/80 text-xs uppercase tracking-wider">Coupon Discount</Text>
                <Text className="text-emerald-400/80">-${discountAmount.toFixed(2)}</Text>
              </View>
            )}
            {loyaltyDiscount > 0 && (
              <View className="flex-row justify-between items-center">
                <Text className="text-primary/80 text-xs uppercase tracking-wider">Points Discount</Text>
                <Text className="text-primary/80">-${loyaltyDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-400 text-xs uppercase tracking-wider">Shipping</Text>
              <Text className={discountType === 'free_shipping' ? "text-emerald-400 font-bold" : "text-gray-500 italic text-xs"}>
                {discountType === 'free_shipping' ? 'FREE' : 'Calculated next step'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between pt-4 border-t border-white/10">
              <Text className="text-white font-medium">Total</Text>
              <Text className="text-2xl font-bold text-primary">${Math.max(0, orderTotal).toFixed(2)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Footer */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background-dark/95 border-t border-white/5">
        <TouchableOpacity 
          disabled={loading}
          onPress={handleCheckout}
          className={`w-full ${loading ? 'bg-primary/50' : 'bg-primary'} py-4 rounded-xl items-center shadow-lg flex-row justify-center gap-2`}
        >
          {loading ? (
            <ActivityIndicator color="black" size="small" />
          ) : (
            <>
              <Text className="text-black font-bold text-lg">Place Order (Cash on Delivery)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
