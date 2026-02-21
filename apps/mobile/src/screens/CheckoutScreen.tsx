import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '@lessence/supabase';
import { supabase } from '../lib/supabase';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  
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
        }
      });

      if (response.error) {
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

        {/* Order Summary */}
        <View className="bg-surface-dark p-4 rounded-2xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Order Summary</Text>
          
          <View className="mb-4">
             {cart.map((item, idx) => (
                <View key={`${item.id}-${item.selectedSize}-${idx}`} className="flex-row justify-between mb-2">
                   <Text className="text-gray-300 flex-1 pr-4" numberOfLines={1}>
                     {item.quantity}x {item.name} ({item.selectedSize})
                   </Text>
                   <Text className="text-white font-medium pl-2">${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
             ))}
          </View>

          <View className="flex-row mb-4">
             <TextInput
                placeholder="Coupon Code"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={couponCode}
                onChangeText={setCouponCode}
                className="flex-1 bg-background-dark border border-white/10 rounded-l-xl px-4 py-3 text-white"
                autoCapitalize="characters"
             />
             <TouchableOpacity className="bg-white/10 px-6 justify-center items-center rounded-r-xl border border-l-0 border-white/10">
                <Text className="text-white font-bold text-xs uppercase">Apply</Text>
             </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between pt-4 border-t border-white/10">
             <Text className="text-gray-400 font-medium">Total</Text>
             <Text className="text-2xl font-bold text-primary">${cartTotal.toFixed(2)}</Text>
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
