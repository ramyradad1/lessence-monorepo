import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useOrders } from "@lessence/supabase";
import { supabase } from "../lib/supabase";
import { Order, formatCurrency } from "@lessence/core";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F49E0B",
  paid: "#10B981",
  processing: "#3B82F6",
  shipped: "#6366F1",
  delivered: "#22C55E",
  cancelled: "#EF4444",
  refunded: "#6B7280",
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { orders, loading, fetchOrders } = useOrders(supabase);
  const [refreshing, setRefreshing] = useState(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
    >
      <View
        style={[styles.orderHeader, isRTL && { flexDirection: "row-reverse" }]}
      >
        <View style={isRTL && { alignItems: "flex-end" }}>
          <Text style={styles.orderNumber}>
            {t("orders:order_number", {
              number: item.order_number || item.id.slice(0, 8),
            })}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString(locale)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                (STATUS_COLORS[item.status] || STATUS_COLORS.pending) + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[item.status] || STATUS_COLORS.pending },
            ]}
          >
            {t(`orders:statuses.${item.status}`).toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={[styles.orderFooter, isRTL && { flexDirection: "row-reverse" }]}
      >
        <Text style={styles.itemCount}>{t("orders:order_total")}</Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(item.total_amount, locale)}
        </Text>
      </View>

      <View
        style={[styles.viewDetails, isRTL && { flexDirection: "row-reverse" }]}
      >
        <Text style={styles.viewDetailsText}>{t("orders:view_details")}</Text>
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={12}
          color="#f4c025"
        />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={28}
            color="#FFF"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("orders:order_history")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f4c025"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color="rgba(255,255,255,0.1)"
            />
            <Text style={styles.emptyText}>{t("orders:no_orders")}</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.shopButtonText}>
                {t("orders:start_shopping").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181611",
  },
  centered: {
    flex: 1,
    backgroundColor: "#181611",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumber: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 4,
  },
  orderDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  itemCount: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  totalAmount: {
    color: "#f4c025",
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4,
  },
  viewDetailsText: {
    color: "#f4c025",
    fontSize: 10,
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  shopButton: {
    backgroundColor: "#f4c025",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  shopButtonText: {
    color: "#000",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 1,
  },
});
