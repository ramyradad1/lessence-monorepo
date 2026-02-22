import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session_id } = route.params || {};
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);

  const { t, i18n } = useTranslation('checkout');
  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    const handleSuccess = async () => {
      if (session_id) {
        clearCart();
      }
      setLoading(false);
    };

    handleSuccess();
  }, [session_id]);

  if (loading) {
     return (
        <View className="flex-1 items-center justify-center bg-background-dark">
            <ActivityIndicator size="large" color="#f4c025" />
        </View>
     );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View className="flex-1 items-center justify-center p-6">
        <View className="h-24 w-24 rounded-full bg-green-500/10 items-center justify-center mb-8 border border-green-500/20">
          <MaterialIcons name="check-circle" size={56} color="#22c55e" />
        </View>
        
        <Text className={`text-3xl font-bold text-white mb-3 text-center ${isRTL ? 'font-display' : ''}`}>
          {t('order_confirmed')}
        </Text>
        
        <Text className="text-gray-400 text-center mb-8 text-lg px-4 leading-relaxed">
          {t('thank_you_msg')}
        </Text>

        {session_id && (
          <Text className="text-xs text-gray-500 font-mono mb-12 text-center">
            {t('order_ref')} {session_id.split('_')[1] || session_id}
            </Text>
        )}

        <View className="w-full gap-4">
            <TouchableOpacity 
            onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
            className="w-full bg-surface-dark border border-white/10 px-8 py-4 rounded-xl shadow-lg"
            >
            <Text className="text-white font-bold text-center text-lg">{t('view_history')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            className="w-full bg-primary px-8 py-4 rounded-xl shadow-lg"
            >
            <Text className="text-black font-bold text-center text-lg">{t('continue_shopping')}</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
