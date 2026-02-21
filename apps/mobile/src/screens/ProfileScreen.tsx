import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth, useNotifications } from '@lessence/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LoginScreen from './LoginScreen';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
  const { user, profile, isLoading, signOut } = useAuth();
  const { unreadCount } = useNotifications(supabase, user?.id);

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
        <Text className="font-display text-3xl text-white mb-8">My Account</Text>
        
        <View className="bg-surface-dark border border-white/5 rounded-2xl p-6 items-center mb-6">
          <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="person" size={32} color="#f4c025" />
          </View>
          <Text className="text-lg font-display text-white mb-1">{profile.full_name || "Valued Client"}</Text>
          <Text className="text-white/40 text-xs tracking-widest mb-6">{profile.email}</Text>
          
          <TouchableOpacity 
            onPress={() => signOut()}
            className="flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10"
          >
            <MaterialIcons name="logout" size={14} color="#f4c025" style={{ marginRight: 8 }} />
            <Text className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {profile.role === 'admin' && (
          <View className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="admin-panel-settings" size={18} color="#f4c025" />
              <Text className="text-white font-bold text-xs uppercase tracking-widest ml-2">Administrator</Text>
            </View>
            <Text className="text-white/40 text-xs mb-4">You have access to the dashboard.</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("AdminDashboard")}
              className="bg-primary py-3 rounded-full items-center"
            >
              <Text className="text-black font-bold uppercase tracking-widest text-[10px]">Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="space-y-4 mb-10">
          {/* Notifications */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="notifications-none" size={20} color="rgba(255,255,255,0.6)" />
              <Text className="text-white font-display text-lg ml-3">Notifications</Text>
            </View>
            <View className="flex-row items-center gap-3">
              {unreadCount > 0 && (
                <View className="bg-primary px-2 py-0.5 rounded-full">
                  <Text className="text-black text-[10px] font-bold">{unreadCount} new</Text>
                </View>
              )}
              <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationPreferences')}
            className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="settings" size={20} color="rgba(255,255,255,0.6)" />
              <Text className="text-white font-display text-lg ml-3">Notification Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>


          {/* Order History */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Orders')}
            className="bg-surface-dark border border-white/5 rounded-2xl p-6"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <MaterialIcons name="local-mall" size={20} color="rgba(255,255,255,0.6)" />
                <Text className="text-white font-display text-lg ml-3">Order History</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
            </View>
            <Text className="text-white/40 text-xs">View and track your previous purchases.</Text>
          </TouchableOpacity>

          <View className="bg-surface-dark border border-white/5 rounded-2xl p-6">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="location-on" size={20} color="rgba(255,255,255,0.6)" />
              <Text className="text-white font-display text-lg ml-3">Saved Addresses</Text>
            </View>
            <Text className="text-white/40 text-xs mb-4">No addresses saved yet.</Text>
            <TouchableOpacity className="border border-white/20 py-2 rounded-full items-center">
              <Text className="text-white uppercase tracking-widest text-[10px]">Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
