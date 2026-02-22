import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useNotificationPreferences } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { preferences, loading, updatePreferences } = useNotificationPreferences(supabase, user?.id);

  const togglePreference = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  if (loading && !preferences) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      {/* Header */}
      <View className={`flex-row items-center px-4 py-4 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className={isRTL ? 'ml-3' : 'mr-3'}>
          <MaterialIcons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color="white" />
        </TouchableOpacity>
        <Text className={`text-xl font-bold tracking-[0.2em] text-white uppercase flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('preferences')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <Text className={`text-white/40 text-[10px] uppercase tracking-widest font-bold mb-4 ml-2 ${isRTL ? 'text-right mr-2' : ''}`}>
          {t('push_notifications')}
        </Text>
        
        <View className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden mb-8">
          <PreferenceItem 
            title={t('enable_push')}
            description={t('enable_push_desc')}
            value={preferences?.push_enabled ?? false}
            onToggle={(val) => togglePreference('push_enabled', val)}
            icon="notifications-active"
            isRTL={isRTL}
          />
        </View>

        <Text className={`text-white/40 text-[10px] uppercase tracking-widest font-bold mb-4 ml-2 ${isRTL ? 'text-right mr-2' : ''}`}>
          {t('alert_categories')}
        </Text>

        <View className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden mb-8">
          <PreferenceItem 
            title={t('order_updates')}
            description={t('order_updates_desc')}
            value={preferences?.order_updates ?? false}
            onToggle={(val) => togglePreference('order_updates', val)}
            icon="local-shipping"
            disabled={!preferences?.push_enabled}
            isRTL={isRTL}
          />
          <View className="h-[1px] bg-white/5 mx-4" />
          <PreferenceItem 
            title={t('back_in_stock')}
            description={t('back_in_stock_desc')}
            value={preferences?.back_in_stock ?? false}
            onToggle={(val) => togglePreference('back_in_stock', val)}
            icon="inventory"
            disabled={!preferences?.push_enabled}
            isRTL={isRTL}
          />
          <View className="h-[1px] bg-white/5 mx-4" />
          <PreferenceItem 
            title={t('price_drops')}
            description={t('price_drops_desc')}
            value={preferences?.price_drop ?? false}
            onToggle={(val) => togglePreference('price_drop', val)}
            icon="trending-down"
            disabled={!preferences?.push_enabled}
            isRTL={isRTL}
          />
          <View className="h-[1px] bg-white/5 mx-4" />
          <PreferenceItem 
            title={t('promotions')}
            description={t('promotions_desc')}
            value={preferences?.promotions ?? false}
            onToggle={(val) => togglePreference('promotions', val)}
            icon="local-offer"
            disabled={!preferences?.push_enabled}
            isRTL={isRTL}
          />
        </View>

        <View className="mt-4 px-2">
          <Text className="text-white/20 text-[10px] text-center italic">
            {t('granular_note')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceItem({ 
  title, 
  description, 
  value, 
  onToggle, 
  icon,
  disabled = false,
  isRTL
}: { 
  title: string; 
  description: string; 
  value: boolean; 
  onToggle: (val: boolean) => void;
  icon: string;
  disabled?: boolean;
    isRTL: boolean;
}) {
  return (
    <View className={`flex-row items-center p-5 ${disabled ? 'opacity-40' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}>
      <View className={`w-10 h-10 rounded-full bg-white/5 items-center justify-center ${isRTL ? 'ml-4' : 'mr-4'}`}>
        <MaterialIcons name={icon as any} size={20} color={value ? "#f4c025" : "rgba(255,255,255,0.4)"} />
      </View>
      <View className="flex-1">
        <Text className={`text-white font-display text-base mb-0.5 ${isRTL ? 'text-right' : 'text-left'}`}>{title}</Text>
        <Text className={`text-white/40 text-[10px] leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>{description}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#2C2C2C', true: '#f4c025' }}
        thumbColor={value ? '#FFFFFF' : '#999999'}
        ios_backgroundColor="#2C2C2C"
        disabled={disabled}
      />
    </View>
  );
}
