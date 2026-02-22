import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useOrders, useAuth } from "@lessence/supabase";
import { Order, OrderItem, formatCurrency } from "@lessence/core";
import { supabase } from "../lib/supabase";
import OrderTimeline from "../components/OrderTimeline";
import { useTranslation } from "react-i18next";

type DetailedOrder = Order & {
  items: (OrderItem & {
    product: {
      name: string;
      name_en?: string;
      name_ar?: string;
      image_url: string;
    };
  })[];
  address?: {
    full_name: string;
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
};

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const { fetchOrderDetail } = useOrders(supabase);
  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [returnRequest, setReturnRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language;

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrderDetail(orderId);
      setOrder(data as DetailedOrder);

      // Fetch return request if any
      const { data: returnData } = await supabase
        .from("return_requests")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (returnData) {
        setReturnRequest(returnData);
      }

      setLoading(false);
    };
    load();
  }, [orderId]);

  if (loading || !order) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View
        className={`flex-row items-center justify-between px-6 py-4 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name={isRTL ? "chevron-right" : "chevron-left"}
            size={28}
            color="white"
          />
        </TouchableOpacity>
        <Text className="text-xl font-display text-white">
          {t("orders:order_details")}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView
        className="flex-1 px-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View className={`mb-8 ${isRTL ? "items-end" : "items-start"}`}>
          <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">
            {t("orders:order_number", { number: order.id.slice(0, 12) })}
          </Text>
          <Text className="text-white/30 text-xs">
            {new Date(order.created_at).toLocaleString(locale)}
          </Text>
        </View>

        {/* Timeline */}
        <View className="bg-surface-dark border border-white/5 rounded-3xl p-6 mb-8">
          <View
            className={`flex-row items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Text className="text-white font-bold uppercase tracking-widest text-[10px]">
              {t("orders:status_progress")}
            </Text>
            {order.status === "delivered" && !returnRequest && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("NewReturn", { orderId: order.id })
                }
                className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <MaterialIcons name="rotate-left" size={14} color="#f4c025" />
                <Text
                  className={`text-primary text-[10px] font-bold uppercase tracking-widest ${isRTL ? "mr-1" : "ml-1"}`}
                >
                  {t("orders:return")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <OrderTimeline
            currentStatus={order.status}
            history={order.status_history}
          />
        </View>

        {/* Return Request Status if any */}
        {returnRequest && (
          <View
            className={`bg-primary/5 border border-primary/20 rounded-3xl p-6 mb-8 flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <View
              className={`flex-row items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center">
                <MaterialIcons name="rotate-left" size={18} color="#f4c025" />
              </View>
              <View className={isRTL ? "items-end" : "items-start"}>
                <Text className="text-white font-bold text-sm">
                  {t("orders:return_request")}
                </Text>
                <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">
                  {t(
                    `orders:statuses.${returnRequest.status}` ||
                      returnRequest.status,
                  )}
                </Text>
              </View>
            </View>
            <View className={isRTL ? "items-start" : "items-end"}>
              <Text className="text-white/20 text-[8px] uppercase tracking-widest">
                {t("orders:requested_on", { date: "" })}
              </Text>
              <Text className="text-white/60 text-[10px]">
                {new Date(returnRequest.created_at).toLocaleDateString(locale)}
              </Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View className="mb-8">
          <Text
            className={`text-white font-bold uppercase tracking-widest text-[10px] mb-4 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("orders:items")}
          </Text>
          <View className="space-y-4">
            {(order.items as any[])?.map((item, idx) => {
              const localizedName =
                locale === "ar"
                  ? item.product?.name_ar ||
                    item.product?.name ||
                    item.product_name
                  : item.product?.name_en ||
                    item.product?.name ||
                    item.product_name;
              return (
                <View
                  key={idx}
                  className={`flex-row items-center gap-4 bg-surface-dark/50 p-4 rounded-2xl border border-white/5 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Image
                    source={{
                      uri:
                        item.product?.image_url ||
                        "https://via.placeholder.com/150",
                    }}
                    className="w-14 h-14 rounded-lg bg-surface-dark"
                  />
                  <View
                    className={`flex-1 ${isRTL ? "items-end" : "items-start"}`}
                  >
                    <Text
                      className="text-white font-bold text-sm"
                      numberOfLines={1}
                    >
                      {localizedName}
                    </Text>
                    <Text className="text-white/40 text-[10px]">
                      {item.selected_size} • {t("common:qty")} {item.quantity}
                    </Text>
                  </View>
                  <Text className="text-white font-bold text-sm">
                    {formatCurrency(item.price * item.quantity, locale)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Shipping */}
        <View className="bg-surface-dark border border-white/5 rounded-3xl p-6 mb-8">
          <View
            className={`flex-row items-center mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <MaterialIcons name="local-shipping" size={16} color="#f4c025" />
            <Text
              className={`text-white font-bold uppercase tracking-widest text-[10px] ${isRTL ? "mr-2" : "ml-2"}`}
            >
              {t("orders:shipping_details")}
            </Text>
          </View>
          {order.address ? (
            <View className={isRTL ? "items-end" : "items-start"}>
              <Text className="text-white font-semibold mb-1">
                {order.address.full_name}
              </Text>
              <Text
                className={`text-white/60 text-xs leading-5 ${isRTL ? "text-right" : "text-left"}`}
              >
                {order.address.address_line1}
                {"\n"}
                {order.address.city}, {order.address.state}{" "}
                {order.address.postal_code}
                {"\n"}
                {order.address.country}
              </Text>
            </View>
          ) : (
            <Text
              className={`text-white/40 text-xs italic ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("orders:shipping_not_available")}
            </Text>
          )}
        </View>

        {/* Summary */}
        <View className="bg-primary/5 border border-primary/20 rounded-3xl p-6 mb-10">
          <Text
            className={`text-primary font-bold uppercase tracking-widest text-[10px] mb-4 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("orders:payment_summary")}
          </Text>
          <View className="space-y-2">
            <View
              className={`flex-row justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Text className="text-white/60 text-xs">{t("orders:total")}</Text>
              <Text className="text-white font-bold text-xl">
                {formatCurrency(order.total_amount, locale)}
              </Text>
            </View>
            <View
              className={`flex-row justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Text className="text-white/40 text-[10px] uppercase tracking-widest">
                {t("orders:status")}
              </Text>
              <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">
                {t(`orders:statuses.${order.status}`)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
