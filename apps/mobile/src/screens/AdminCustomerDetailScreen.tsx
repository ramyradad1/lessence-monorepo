import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAdminCustomers, CustomerDetail } from "@lessence/supabase";

export default function AdminCustomerDetailScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const customerId = route.params?.customerId;

  const { fetchCustomerDetail, addNote, deleteNote } =
    useAdminCustomers(supabase);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const loadCustomer = async () => {
    setLoading(true);
    const data = await fetchCustomerDetail(customerId);
    setCustomer(data);
    setLoading(false);
  };

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    const { success, error } = await addNote(customerId, newNote.trim());
    if (success) {
      setNewNote("");
      await loadCustomer();
    } else {
      console.error(error);
    }
    setSubmittingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const { success, error } = await deleteNote(noteId);
    if (success) {
      await loadCustomer();
    } else {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark justify-center items-center">
        <ActivityIndicator size="large" color="#f4c025" />
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark justify-center items-center">
        <Text className="text-white/40">Customer not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View
        className={`flex-row items-center p-4 border-b border-white/5 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`p-2 rounded-full bg-white/5 ${isRTL ? "ml-4" : "mr-4"}`}
        >
          <MaterialIcons
            name={isRTL ? "chevron-right" : "chevron-left"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text className="text-xl font-display text-white uppercase tracking-widest flex-1 text-center pr-12">
          {t("common:customer_details", "Customer Details")}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Header */}
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-6 mb-6">
            <View
              className={`flex-row items-center mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <View
                className={`w-16 h-16 rounded-full bg-primary/10 items-center justify-center ${isRTL ? "ml-4" : "mr-4"}`}
              >
                <MaterialIcons name="person" size={32} color="#f4c025" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-2xl font-bold text-white mb-1 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {customer.full_name || "Anonymous Customer"}
                </Text>
                <View
                  className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <MaterialIcons
                    name="email"
                    size={14}
                    color="rgba(255,255,255,0.4)"
                  />
                  <Text
                    className={`text-sm text-white/50 pl-2 ${isRTL ? "pr-2 pl-0" : ""}`}
                  >
                    {customer.email}
                  </Text>
                </View>
                {customer.phone && (
                  <View
                    className={`flex-row items-center mt-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <MaterialIcons
                      name="phone"
                      size={14}
                      color="rgba(255,255,255,0.4)"
                    />
                    <Text
                      className={`text-sm text-white/50 pl-2 ${isRTL ? "pr-2 pl-0" : ""}`}
                    >
                      {customer.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-primary/10 rounded-xl px-4 py-3 items-center">
                <Text className="text-xl font-bold text-primary mb-1">
                  {customer.total_orders}
                </Text>
                <Text className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                  Orders
                </Text>
              </View>
              <View className="flex-1 bg-primary/10 rounded-xl px-4 py-3 items-center">
                <Text className="text-xl font-bold text-primary mb-1">
                  ${Number(customer.total_spend || 0).toFixed(2)}
                </Text>
                <Text className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                  Total Spend
                </Text>
              </View>
            </View>
          </View>

          {/* Orders Section */}
          <Text
            className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 mt-2 ${isRTL ? "text-right" : "text-left"}`}
          >
            Order History
          </Text>
          {customer.orders.length === 0 ? (
            <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6 items-center">
              <Text className="text-white/20 text-sm">No orders yet</Text>
            </View>
          ) : (
            customer.orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() =>
                  navigation.navigate("AdminOrderDetail", { orderId: order.id })
                }
                className="bg-surface-dark border border-white/5 rounded-2xl p-4 mb-3"
              >
                <View
                  className={`flex-row justify-between items-center mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Text className="text-white font-medium">
                    {order.order_number}
                  </Text>
                  <Text className="text-primary font-bold">
                    ${Number(order.total_amount).toFixed(2)}
                  </Text>
                </View>
                <View
                  className={`flex-row justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Text className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-0.5 border border-white/10 rounded-full">
                    {order.status}
                  </Text>
                  <Text className="text-xs text-white/30">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Admin Notes */}
          <Text
            className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 mt-6 ${isRTL ? "text-right" : "text-left"}`}
          >
            Admin Notes
          </Text>
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
            <View
              className={`flex-row mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Add a note..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                className={`flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm ${isRTL ? "text-right mr-0 ml-2" : "text-left ml-0 mr-2"}`}
              />
              <TouchableOpacity
                onPress={handleAddNote}
                disabled={submittingNote || !newNote.trim()}
                className={`bg-primary p-3 rounded-xl justify-center items-center ${submittingNote || !newNote.trim() ? "opacity-50" : ""}`}
              >
                {submittingNote ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <MaterialIcons name="send" size={20} color="black" />
                )}
              </TouchableOpacity>
            </View>

            {customer.notes.length === 0 ? (
              <Text className="text-white/20 text-sm text-center">
                No notes yet
              </Text>
            ) : (
              <View className="gap-3">
                {customer.notes.map((note) => (
                  <View
                    key={note.id}
                    className="bg-black/20 rounded-xl p-4 border border-white/5"
                  >
                    <Text
                      className={`text-sm text-white/80 leading-relaxed ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {note.note}
                    </Text>
                    <View
                      className={`flex-row items-center justify-between mt-3 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <Text className="text-[10px] text-white/30 uppercase tracking-wider">
                        {note.admin_name || "Admin"} •{" "}
                        {new Date(note.created_at).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={16}
                          color="rgba(248,113,113,0.8)"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
