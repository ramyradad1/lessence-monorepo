import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useNotifications } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { Notification } from '@lessence/core';
import LoginScreen from './LoginScreen';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (id: string) => void;
}) {
  const drop = item.old_price - item.new_price;
  const dropPct = Math.round((drop / item.old_price) * 100);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(item.id)}
      className={`mx-4 mb-3 rounded-2xl border overflow-hidden ${
        item.is_read
          ? 'bg-surface-dark border-white/5'
          : 'bg-primary/5 border-primary/20'
      }`}
    >
      <View className="flex-row items-start p-4 gap-3">
        {/* Icon */}
        <View className="w-10 h-10 rounded-full bg-green-500/15 items-center justify-center flex-shrink-0 mt-0.5">
          <MaterialIcons name="trending-down" size={18} color="#4ade80" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm flex-1 mr-2 ${
                item.is_read ? 'text-white/75' : 'text-white font-bold'
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.is_read && (
              <View className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </View>

          <Text className="text-xs text-white/50 mt-1 leading-snug" numberOfLines={2}>
            {item.body}
          </Text>

          {/* Pricing row */}
          <View className="flex-row items-center mt-2 gap-2">
            <Text className="text-sm font-bold text-green-400">
              ${item.new_price.toFixed(2)}
            </Text>
            <Text className="text-xs text-white/30 line-through">
              ${item.old_price.toFixed(2)}
            </Text>
            <View className="bg-green-500/15 px-1.5 py-0.5 rounded-full">
              <Text className="text-[10px] text-green-400 font-bold">
                -{dropPct}%
              </Text>
            </View>
            <Text className="text-[10px] text-white/30 ml-auto">
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications(supabase, user?.id);

  if (!user && !authLoading) return <LoginScreen />;

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <MaterialIcons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold tracking-[0.2em] text-white uppercase flex-1">
          Notifications
        </Text>
        {unreadCount > 0 && (
          <View className="flex-row items-center gap-3">
            <View className="bg-primary px-2 py-0.5 rounded-full">
              <Text className="text-black text-[10px] font-bold">{unreadCount} new</Text>
            </View>
            <TouchableOpacity onPress={markAllRead}>
              <MaterialIcons name="done-all" size={22} color="#f4c025" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading || authLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f4c025" size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons
            name="notifications-none"
            size={64}
            color="rgba(255,255,255,0.07)"
          />
          <Text className="text-white/60 font-display text-xl mt-6 mb-2">
            All caught up!
          </Text>
          <Text className="text-white/30 text-xs text-center">
            You'll be notified here when prices drop on items in your Favorites.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={markRead} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
