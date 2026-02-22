import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth, useNotifications } from '@lessence/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LoginScreen from './LoginScreen';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
  const { user, profile, isLoading, signOut } = useAuth();
  const { unreadCount } = useNotifications(supabase, user?.id);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  if (!user || !profile) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text className={`font-display text-3xl text-white mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('profile:my_account')}
        </Text>
        
        <View className="bg-surface-dark border border-white/5 rounded-2xl p-6 items-center mb-6">
          <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="person" size={32} color="#f4c025" />
          </View>
          <Text className="text-lg font-display text-white mb-1">{profile.full_name || t('profile:valued_client')}</Text>
          <Text className="text-white/40 text-xs tracking-widest mb-6">{profile.email}</Text>
          
          <TouchableOpacity 
            onPress={() => signOut()}
            className={`flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <MaterialIcons name="logout" size={14} color="#f4c025" style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
            <Text className="text-white/60 text-[10px] uppercase tracking-widest font-bold">{t('profile:log_out')}</Text>
          </TouchableOpacity>
        </View>

        {['super_admin', 'order_manager', 'inventory_manager', 'content_manager', 'admin'].includes(profile.role) && (
          <View className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
            <View className={`flex-row items-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MaterialIcons name="admin-panel-settings" size={18} color="#f4c025" />
              <Text className={`text-white font-bold text-xs uppercase tracking-widest ${isRTL ? 'mr-2' : 'ml-2'}`}>
                {t('profile:administrator')}
              </Text>
            </View>
            <Text className={`text-white/40 text-xs mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('profile:admin_dashboard_desc')}
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("AdminDashboard")}
              className="bg-primary py-3 rounded-full items-center"
            >
              <Text className="text-black font-bold uppercase tracking-widest text-[10px]">
                {t('profile:admin_dashboard_btn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selector */}
        <View className="bg-surface-dark border border-white/5 rounded-2xl p-6 mb-6">
          <View className={`flex-row items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MaterialIcons name="language" size={20} color="rgba(255,255,255,0.6)" />
            <Text className={`text-white font-display text-lg ${isRTL ? 'mr-3' : 'ml-3'}`}>{t('profile:language')}</Text>
          </View>
          <View className={`flex-row gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity
              onPress={() => i18n.changeLanguage('en')}
              className={`flex-1 py-3 rounded-xl items-center border ${i18n.language === 'en' ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}
            >
              <Text className={`font-bold ${i18n.language === 'en' ? 'text-black' : 'text-white'}`}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => i18n.changeLanguage('ar')}
              className={`flex-1 py-3 rounded-xl items-center border ${i18n.language === 'ar' ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}
            >
              <Text className={`font-bold ${i18n.language === 'ar' ? 'text-black' : 'text-white'}`}>العربية</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="space-y-4 mb-10">
          {/* Notifications */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className={`bg-surface-dark border border-white/5 rounded-2xl p-6 flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MaterialIcons name="notifications-none" size={20} color="rgba(255,255,255,0.6)" />
              <Text className={`text-white font-display text-lg ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {t('profile:notifications')}
              </Text>
            </View>
            <View className={`flex-row items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {unreadCount > 0 && (
                <View className="bg-primary px-2 py-0.5 rounded-full">
                  <Text className="text-black text-[10px] font-bold">
                    {t('profile:new_count', { count: unreadCount })}
                  </Text>
                </View>
              )}
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color="rgba(255,255,255,0.3)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationPreferences')}
            className={`bg-surface-dark border border-white/5 rounded-2xl p-6 flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MaterialIcons name="settings" size={20} color="rgba(255,255,255,0.6)" />
              <Text className={`text-white font-display text-lg ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {t('profile:notification_settings')}
              </Text>
            </View>
            <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>


          {/* Order History */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Orders')}
            className="bg-surface-dark border border-white/5 rounded-2xl p-6"
          >
            <View className={`flex-row items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MaterialIcons name="local-mall" size={20} color="rgba(255,255,255,0.6)" />
                <Text className={`text-white font-display text-lg ${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {t('profile:order_history')}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color="rgba(255,255,255,0.3)" />
            </View>
            <Text className={`text-white/40 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('profile:order_history_desc')}
            </Text>
          </TouchableOpacity>

          <View className="bg-surface-dark border border-white/5 rounded-2xl p-6">
            <View className={`flex-row items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MaterialIcons name="location-on" size={20} color="rgba(255,255,255,0.6)" />
              <Text className={`text-white font-display text-lg ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {t('profile:saved_addresses')}
              </Text>
            </View>
            <Text className={`text-white/40 text-xs mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('profile:addresses_empty')}
            </Text>
            <TouchableOpacity className="border border-white/20 py-2 rounded-full items-center">
              <Text className="text-white uppercase tracking-widest text-[10px]">
                {t('profile:add_new_address')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
