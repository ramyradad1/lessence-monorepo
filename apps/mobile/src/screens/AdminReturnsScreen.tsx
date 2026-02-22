import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAdminReturnRequests } from "@lessence/supabase";
import { ReturnRequest, ReturnRequestStatus } from "@lessence/core";

const STATUS_ICONS: Record<ReturnRequestStatus, string> = {
  requested: "schedule",
  approved: "check-circle",
  received: "inventory",
  refunded: "account-balance",
  rejected: "cancel",
};

const STATUS_COLORS: Record<ReturnRequestStatus, string> = {
  requested: "rgba(245,158,11,1)", // amber-500
  approved: "rgba(59,130,246,1)", // blue-500
  received: "rgba(99,102,241,1)", // indigo-500
  refunded: "rgba(16,185,129,1)", // emerald-500
  rejected: "rgba(244,63,94,1)", // rose-500
};

export default function AdminReturnsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");

  const { requests, loading } = useAdminReturnRequests(supabase);

  const filteredRequests = (requests || []).filter((request: ReturnRequest) => {
    const matchesSearch =
      request.id.toLowerCase().includes(search.toLowerCase()) ||
      (request.order_number?.toLowerCase() || "").includes(
        search.toLowerCase(),
      ) ||
      request.reason.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const renderItem = ({ item }: { item: ReturnRequest }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("AdminReturnDetail", { returnId: item.id })
      }
      className={`bg-surface-dark border border-white/5 rounded-2xl p-4 mb-3 ${isRTL ? "flex-row-reverse" : "flex-row"} items-center`}
    >
      <View className="flex-1">
        <View
          className={`flex-row justify-between items-center mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Text className="text-white font-medium text-sm">
            Order #{item.order_number || "N/A"}
          </Text>
          <Text className="text-xs text-white/40">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text
          className={`text-white/60 text-xs mb-3 ${isRTL ? "text-right" : "text-left"}`}
          numberOfLines={1}
        >
          {item.reason}
        </Text>

        <View
          className={`flex-row items-center border border-white/10 rounded-full px-3 py-1 self-start ${isRTL ? "flex-row-reverse self-end" : ""}`}
        >
          <MaterialIcons
            name={STATUS_ICONS[item.status] as any}
            size={14}
            color={STATUS_COLORS[item.status]}
          />
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${isRTL ? "mr-1" : "ml-1"}`}
            style={{ color: STATUS_COLORS[item.status] }}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <MaterialIcons
        name={isRTL ? "chevron-left" : "chevron-right"}
        size={24}
        color="rgba(255,255,255,0.2)"
        style={{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}
      />
    </TouchableOpacity>
  );

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
        <View className="flex-1">
          <Text
            className={`text-xl font-display text-white uppercase tracking-widest flex-row items-center ${isRTL ? "text-right" : "text-left"}`}
          >
            Return Requests
          </Text>
          <Text
            className={`text-white/40 text-xs ${isRTL ? "text-right" : "text-left"}`}
          >
            Manage customer returns
          </Text>
        </View>
      </View>

      <View className="p-4 flex-1">
        <View
          className={`flex-row items-center bg-surface-dark border border-white/10 rounded-xl px-4 py-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <MaterialIcons
            name="search"
            size={20}
            color="rgba(255,255,255,0.4)"
          />
          <TextInput
            placeholder="Search by ID, Order # or Reason..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={search}
            onChangeText={setSearch}
            className={`flex-1 text-white text-sm ${isRTL ? "mr-3 text-right" : "ml-3 text-left"} py-2`}
          />
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#f4c025" />
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="py-12 items-center">
                <MaterialIcons
                  name="restore"
                  size={48}
                  color="rgba(255,255,255,0.1)"
                />
                <Text className="text-white/40 mt-4 font-medium">
                  No return requests found
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
