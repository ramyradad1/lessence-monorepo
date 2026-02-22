import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAdminOrders, OrderDetail } from '@lessence/supabase';
import { OrderStatus, OrderAdminNote } from '@lessence/core';
import { supabase } from '../lib/supabase';
import OrderTimeline from '../components/OrderTimeline';
import { useTranslation } from 'react-i18next';

export default function AdminOrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { fetchOrderDetail, updateOrderStatus, addOrderNote } = useAdminOrders(supabase);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRTL = i18n.dir() === 'rtl';
  const locale = i18n.language;

  const load = async () => {
    const data = await fetchOrderDetail(orderId);
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const handleStatusChange = async (status: OrderStatus) => {
    setIsUpdatingStatus(true);
    const { data: { user } } = await supabase.auth.getUser();
    await updateOrderStatus(orderId, status, user?.id);
    await load();
    setIsUpdatingStatus(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !order) return;
    setIsAddingNote(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const result = await addOrderNote(orderId, newNote, user.id);
      if (result.success) {
        setNewNote('');
        await load();
      }
    }
    setIsAddingNote(false);
  };

  if (loading || !order) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className={`flex-row items-center justify-between px-6 py-4 border-b border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name={isRTL ? "chevron-right" : "chevron-left"} size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-display text-white">{t('admin:manage_order')}</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="mb-8">
            <Text className={`text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('admin:order')} #{order.id.slice(0, 12)}
            </Text>
            <Text className={`text-white font-bold text-lg mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{order.customer_name || t('admin:anonymous_user')}</Text>
            
            {/* Status Picker (Simulated as row of chips) */}
            <Text className={`text-white/40 text-[10px] uppercase font-bold tracking-widest mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin:change_status')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className={`flex-row ${isRTL ? 'flex-row-reverse' : ''}`}
              style={isRTL ? { flexDirection: 'row-reverse' } : {}}
            >
              {ALL_STATUSES.map(status => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleStatusChange(status)}
                  disabled={isUpdatingStatus}
                  className={`px-4 py-2 rounded-full border ${isRTL ? 'ml-2' : 'mr-2'} ${order.status === status ? 'bg-primary border-primary' : 'bg-surface-dark border-white/10'}`}
                >
                  <Text className={`text-[10px] font-bold uppercase tracking-widest ${order.status === status ? 'text-black' : 'text-white/60'}`}>
                    {t(`admin:${status}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Timeline */}
          <View className="bg-surface-dark border border-white/5 rounded-3xl p-6 mb-8">
            <Text className={`text-white font-bold uppercase tracking-widest text-[10px] mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin:live_timeline')}</Text>
            <OrderTimeline currentStatus={order.status} history={order.status_history} />
          </View>

          {/* Admin Notes */}
          <View className="mb-8">
            <Text className={`text-white font-bold uppercase tracking-widest text-[10px] mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin:internal_notes')}</Text>
            
            <View className="bg-surface-dark border border-white/5 rounded-3xl p-5 mb-4">
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder={t('admin:add_note_placeholder')}
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                numberOfLines={3}
                className={`text-white text-sm mb-4 min-h-[80px] ${isRTL ? 'text-right' : 'text-left'}`}
                textAlignVertical="top"
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity
                onPress={handleAddNote}
                disabled={isAddingNote || !newNote.trim()}
                className="bg-primary py-3 rounded-xl items-center shadow-lg"
              >
                {isAddingNote ? <ActivityIndicator size="small" color="black" /> : <Text className="text-black font-bold uppercase tracking-widest text-[10px]">{t('admin:add_note_btn')}</Text>}
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              {order.admin_notes?.map((note: OrderAdminNote) => (
                <View key={note.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <View className={`flex-row justify-between items-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Text className="text-[#f4c025] font-bold text-[10px] uppercase tracking-widest">{note.admin_name || t('admin:admin')}</Text>
                    <Text className="text-white/20 text-[8px]">{new Date(note.created_at).toLocaleString(locale)}</Text>
                  </View>
                  <Text className={`text-white/80 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{note.note}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
