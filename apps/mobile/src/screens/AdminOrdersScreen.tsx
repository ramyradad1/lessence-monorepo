import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAdminOrders } from "@lessence/supabase";
import { OrderStatus } from "@lessence/core";

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const STATUS_COLORS: Record<string, string> = {
  pending: "rgba(245,158,11,1)", // orange-400
  paid: "rgba(52,211,153,1)", // emerald-400
  processing: "rgba(96,165,250,1)", // blue-400
  shipped: "rgba(129,140,248,1)", // indigo-400
  delivered: "rgba(74,222,128,1)", // green-400
  cancelled: "rgba(248,113,113,1)", // red-400
  refunded: "rgba(156,163,175,1)", // gray-400
};

export default function AdminOrdersScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { orders, loading, totalCount, fetchOrders, updateOrderStatus } =
    useAdminOrders(supabase);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        page: 1,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchOrders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    Alert.alert("Update Status", `Change order status to ${newStatus}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setUpdatingId(orderId);
          const {
            data: { user },
          } = await supabase.auth.getUser();
          await updateOrderStatus(orderId, newStatus, user?.id);
          setUpdatingId(null);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("AdminOrderDetail", { orderId: item.id })
      }
      className="bg-surface-dark border border-white/5 rounded-2xl p-4 mb-3"
    >
      <View
        className={`flex-row justify-between items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <View
          className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <MaterialIcons
            name="receipt-long"
            size={20}
            color="rgba(255,255,255,0.4)"
          />
          <Text
            className={`font-bold text-white text-base pl-2 ${isRTL ? "pr-2 pl-0" : ""}`}
          >
            #{item.order_number}
          </Text>
        </View>
        <Text className="text-primary font-bold text-base">
          ${(item.total || item.total_amount || 0).toFixed(2)}
        </Text>
      </View>

      <View
        className={`flex-row justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <View className="flex-col">
          <Text
            className={`text-xs text-white/40 mb-1 ${isRTL ? "text-right" : "text-left"}`}
          >
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : "-"}
          </Text>
        </View>

        <View
          className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
        >
          {updatingId === item.id && (
            <ActivityIndicator
              size="small"
              color="#f4c025"
              style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
            />
          )}
          <TouchableOpacity
            onPress={() => {
              // Present simple action sheet in a real app, here we loop through statuses for simplicity in demo
              const currentIndex = ALL_STATUSES.indexOf(item.status);
              const nextStatus =
                ALL_STATUSES[(currentIndex + 1) % ALL_STATUSES.length];
              handleStatusChange(item.id, nextStatus);
            }}
            className="border px-3 py-1 rounded-full items-center justify-center flex-row"
            style={{
              borderColor:
                `${STATUS_COLORS[item.status] || STATUS_COLORS.pending}`.replace(
                  "1)",
                  "0.2)",
                ),
              backgroundColor:
                `${STATUS_COLORS[item.status] || STATUS_COLORS.pending}`.replace(
                  "1)",
                  "0.1)",
                ),
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-widest pl-1"
              style={{
                color: STATUS_COLORS[item.status] || STATUS_COLORS.pending,
              }}
            >
              {item.status}
            </Text>
            <MaterialIcons
              name="arrow-drop-down"
              size={14}
              color={STATUS_COLORS[item.status] || STATUS_COLORS.pending}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View
        className={`flex-row items-center p-4 border-b border-white/5 justify-between ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <View
          className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
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
          <View>
            <Text
              className={`text-xl font-display text-white uppercase tracking-widest ${isRTL ? "text-right" : "text-left"}`}
            >
              Orders
            </Text>
            <Text
              className={`text-white/40 text-xs ${isRTL ? "text-right" : "text-left"}`}
            >
              {totalCount} Total
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowStatusFilter(!showStatusFilter)}
          className={`p-2 rounded-full ${statusFilter ? "bg-primary/20" : "bg-white/5"}`}
        >
          <MaterialIcons
            name="filter-list"
            size={24}
            color={statusFilter ? "#f4c025" : "white"}
          />
        </TouchableOpacity>
      </View>

      <View className="p-4 flex-1">
        <View
          className={`flex-row items-center bg-surface-dark border border-white/10 rounded-xl px-4 py-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <MaterialIcons
            name="search"
            size={20}
            color="rgba(255,255,255,0.4)"
          />
          <TextInput
            placeholder="Search by order number..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={search}
            onChangeText={setSearch}
            className={`flex-1 text-white text-sm ${isRTL ? "mr-3 text-right" : "ml-3 text-left"} py-2`}
          />
        </View>

        {showStatusFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6 max-h-10"
          >
            <TouchableOpacity
              onPress={() => setStatusFilter("")}
              className={`px-4 py-2 rounded-full border ${statusFilter === "" ? "border-primary bg-primary/20" : "border-white/10 bg-surface-dark"} mr-2`}
            >
              <Text
                className={`text-xs ${statusFilter === "" ? "text-primary font-bold" : "text-white"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            {ALL_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full border ${statusFilter === status ? "border-primary bg-primary/20" : "border-white/10 bg-surface-dark"} mr-2`}
              >
                <Text
                  className={`text-xs capitalize ${statusFilter === status ? "text-primary font-bold" : "text-white"}`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#f4c025" />
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="py-12 items-center">
                <MaterialIcons
                  name="receipt-long"
                  size={48}
                  color="rgba(255,255,255,0.1)"
                />
                <Text className="text-white/40 mt-4 font-medium">
                  No orders found
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
