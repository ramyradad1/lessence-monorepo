import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAdminReturnRequests } from "@lessence/supabase";
import {
  ReturnRequest,
  ReturnRequestStatus,
  ReturnRequestItem,
} from "@lessence/core";

const STATUS_ICONS: Record<ReturnRequestStatus, string> = {
  requested: "schedule",
  approved: "check-circle",
  received: "inventory",
  refunded: "account-balance",
  rejected: "cancel",
};

const STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  received: "Received",
  refunded: "Refunded",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<ReturnRequestStatus, string> = {
  requested: "rgba(245,158,11,1)", // amber-500
  approved: "rgba(59,130,246,1)", // blue-500
  received: "rgba(99,102,241,1)", // indigo-500
  refunded: "rgba(16,185,129,1)", // emerald-500
  rejected: "rgba(244,63,94,1)", // rose-500
};

export default function AdminReturnDetailScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const returnId = route.params?.returnId;

  const {
    fetchRequestDetail,
    updateRequestStatus,
    loading: updatingStatus,
  } = useAdminReturnRequests(supabase);

  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchRequestDetail(returnId);
      setRequest(data);
      setAdminNotes(data.admin_notes || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (returnId) {
      load();
    }
  }, [returnId]);

  const handleUpdateStatus = (newStatus: ReturnRequestStatus) => {
    Alert.alert(
      "Confirm Status Update",
      `Are you sure you want to change the status to ${STATUS_LABELS[newStatus]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await updateRequestStatus(returnId, newStatus, adminNotes);
              const updated = await fetchRequestDetail(returnId);
              setRequest(updated);
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to update status.");
            }
          },
        },
      ],
    );
  };

  const handleSaveNotes = async () => {
    if (!request) return;
    try {
      await updateRequestStatus(returnId, request.status, adminNotes);
      Alert.alert("Success", "Notes saved successfully");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save notes.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark justify-center items-center">
        <ActivityIndicator size="large" color="#f4c025" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-background-dark justify-center items-center">
        <Text className="text-white/40">Return request not found</Text>
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
          Return Request
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
          {/* Header info */}
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
            <View
              className={`flex-row items-center gap-4 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center border"
                style={{
                  borderColor: STATUS_COLORS[request.status],
                  backgroundColor: `${STATUS_COLORS[request.status].replace(/,1\)$/, ",0.1)")}`,
                }}
              >
                <MaterialIcons
                  name={STATUS_ICONS[request.status] as any}
                  size={24}
                  color={STATUS_COLORS[request.status]}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-xl font-bold text-white mb-1 tracking-tight ${isRTL ? "text-right" : "text-left"}`}
                >
                  {STATUS_LABELS[request.status]}
                </Text>
                <Text
                  className={`text-white/40 text-xs font-mono ${isRTL ? "text-right" : "text-left"}`}
                >
                  {request.id}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2 mt-2">
              <TouchableOpacity
                className="px-3 py-2 bg-white/5 rounded-lg border border-white/10"
                onPress={() => handleUpdateStatus("approved")}
                disabled={
                  request.status === "approved" ||
                  request.status === "refunded" ||
                  request.status === "rejected"
                }
              >
                <Text className="text-xs font-bold text-white uppercase tracking-widest">
                  Approve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-2 bg-white/5 rounded-lg border border-white/10"
                onPress={() => handleUpdateStatus("received")}
                disabled={request.status !== "approved"}
              >
                <Text className="text-xs font-bold text-white uppercase tracking-widest">
                  Receive
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                onPress={() => handleUpdateStatus("refunded")}
                disabled={request.status !== "received"}
              >
                <Text className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Refund
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-2 bg-rose-500/10 rounded-lg border border-rose-500/20"
                onPress={() => handleUpdateStatus("rejected")}
                disabled={
                  request.status === "refunded" || request.status === "rejected"
                }
              >
                <Text className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                  Reject
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer & Order */}
          <Text
            className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-3 ${isRTL ? "text-right" : "text-left"}`}
          >
            Information
          </Text>
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
            <View className="mb-4">
              <Text
                className={`text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                Customer
              </Text>
              <Text
                className={`text-sm font-bold text-white mb-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                {request.customer_name || "Anonymous"}
              </Text>
              <Text
                className={`text-xs text-white/50 ${isRTL ? "text-right" : "text-left"}`}
              >
                {request.customer_email}
              </Text>
            </View>

            <View className="mb-4">
              <Text
                className={`text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                Order
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AdminOrderDetail", {
                    orderId: request.order_id,
                  })
                }
              >
                <Text
                  className={`text-sm font-bold text-primary mb-1 ${isRTL ? "text-right" : "text-left"}`}
                >
                  #{request.order_number}
                </Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text
                className={`text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                Requested On
              </Text>
              <Text
                className={`text-sm text-white/70 ${isRTL ? "text-right" : "text-left"}`}
              >
                {new Date(request.created_at).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Reason & Comments */}
          <Text
            className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-3 ${isRTL ? "text-right" : "text-left"}`}
          >
            Reason & Details
          </Text>
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
            <Text
              className={`text-base font-semibold text-white mb-3 ${isRTL ? "text-right" : "text-left"}`}
            >
              {request.reason}
            </Text>
            {request.comment && (
              <View className="bg-black/20 border border-white/5 rounded-xl p-4">
                <Text
                  className={`text-sm text-white/80 italic leading-relaxed ${isRTL ? "text-right" : "text-left"}`}
                >
                  "{request.comment}"
                </Text>
              </View>
            )}
          </View>

          {/* Items */}
          <Text
            className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-3 ${isRTL ? "text-right" : "text-left"}`}
          >
            Returned Items
          </Text>
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
            {request.items?.map((item: ReturnRequestItem) => (
              <View
                key={item.id}
                className={`flex-row items-center py-2 ${request.items && request.items.length > 1 ? "border-b border-white/5" : ""} ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View
                  className={`w-12 h-12 bg-white/5 rounded-xl items-center justify-center ${isRTL ? "ml-3" : "mr-3"}`}
                >
                  <MaterialIcons
                    name="inventory-2"
                    size={24}
                    color="rgba(255,255,255,0.4)"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold text-white mb-1 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {item.product_name}
                  </Text>
                  <Text
                    className={`text-xs text-white/50 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {item.selected_size} • Qty {item.quantity}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-primary">
                  ${((item.price || 0) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Evidence */}
          {request.media_urls && request.media_urls.length > 0 && (
            <>
              <Text
                className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-3 ${isRTL ? "text-right" : "text-left"}`}
              >
                Photo Evidence
              </Text>
              <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6 flex-row flex-wrap gap-3">
                {request.media_urls.map((url, index) => (
                  <View
                    key={index}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-white/10"
                  >
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Admin Notes */}
          <Text
            className={`text-sm font-semibold text-white/40 uppercase tracking-wider mb-3 ${isRTL ? "text-right" : "text-left"}`}
          >
            Internal Notes
          </Text>
          <View className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
            <TextInput
              value={adminNotes}
              onChangeText={setAdminNotes}
              placeholder="Private notes..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              className={`bg-black/30 border border-white/10 rounded-xl p-4 text-white text-sm min-h-[100px] mb-4 text-top leading-relaxed ${isRTL ? "text-right" : "text-left"}`}
            />
            <TouchableOpacity
              onPress={handleSaveNotes}
              disabled={updatingStatus}
              className={`w-full py-3 bg-white/5 border border-white/10 rounded-xl items-center ${updatingStatus ? "opacity-50" : ""}`}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-xs font-bold text-white uppercase tracking-widest">
                  Save Notes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
