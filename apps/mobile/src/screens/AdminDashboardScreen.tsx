import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useOrders } from "../hooks/useOrders";
import { Order, formatCurrency } from "@lessence/core";
import { useTranslation } from "react-i18next";

function OrderItem({
  order,
  onUpdateStatus,
  t,
  isRTL,
  locale,
}: {
  order: Order;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  t: any;
  isRTL: boolean;
  locale: string;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const statusColors: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    pending: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      label: t("admin:pending"),
    },
    shipped: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      label: t("admin:shipped"),
    },
    delivered: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      label: t("admin:delivered"),
    },
  };
  const s = statusColors[order.status] || statusColors.pending;

  const handleUpdate = async (status: Order["status"]) => {
    setIsUpdating(true);
    await onUpdateStatus(order.id, status);
    setIsUpdating(false);
  };

  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("AdminOrderDetail", { orderId: order.id })
      }
      className={`flex-row items-center justify-between rounded-xl bg-surface-dark border border-surface-lighter p-4 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <View
        className={`flex-row items-center gap-4 flex-1 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <View className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-lighter">
          <MaterialIcons name="inventory-2" size={20} color="#cbd5e1" />
        </View>
        <View className="flex-1">
          <Text
            className={`text-sm font-bold text-white ${isRTL ? "text-right" : "text-left"}`}
          >
            {order.customer_name}
          </Text>
          <Text
            className={`text-xs text-slate-500 mt-1 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("admin:order")} {order.order_number}
          </Text>
        </View>
      </View>

      <View
        className={`flex-row items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        {/* Actions for Pending/Shipped */}
        {order.status !== "delivered" && (
          <View
            className={`flex-row items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {order.status === "pending" && (
              <TouchableOpacity
                disabled={isUpdating}
                onPress={() => handleUpdate("shipped")}
                className="bg-primary/20 p-2 rounded-lg border border-primary/20"
              >
                <Text className="text-[10px] font-bold text-primary">
                  {t("admin:ship")}
                </Text>
              </TouchableOpacity>
            )}
            {order.status === "shipped" && (
              <TouchableOpacity
                disabled={isUpdating}
                onPress={() => handleUpdate("delivered")}
                className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/20"
              >
                <Text className="text-[10px] font-bold text-blue-400">
                  {t("admin:deliver")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View
          className={`flex-col items-end gap-1 ${isRTL ? "items-start" : "items-end"}`}
        >
          <View
            className={`rounded-full ${s.bg} px-2.5 py-1 border border-white/5`}
          >
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color="#f4c025"
                style={{ transform: [{ scale: 0.6 }] }}
              />
            ) : (
              <Text className={`text-[10px] font-bold ${s.text}`}>
                {s.label}
              </Text>
            )}
          </View>
          <Text className="text-xs font-bold text-white">
            {formatCurrency(order.total_amount || 0, locale)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function KpiCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  trend,
  trendUp,
  sparkColor,
  sparkPath,
  isRTL,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  sparkColor: string;
  sparkPath: string;
  isRTL: boolean;
}) {
  return (
    <View
      className={`flex-col gap-3 rounded-xl bg-surface-dark p-5 border border-surface-lighter shadow-lg mr-4 w-[200px] ${isRTL ? "ml-4 mr-0" : "mr-4 ml-0"}`}
    >
      <View
        className={`flex-row justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <View className={`rounded-full ${iconBg} p-2`}>
          <MaterialIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View
          className={`flex-row items-center gap-1 ${trendUp ? "bg-green-500/10" : "bg-red-500/10"} px-2 py-0.5 rounded-full ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <MaterialIcons
            name={trendUp ? "trending-up" : "trending-down"}
            size={14}
            color={trendUp ? "#22c55e" : "#ef4444"}
          />
          <Text
            className={`text-xs font-medium ${trendUp ? "text-green-500" : "text-red-500"}`}
          >
            {trend}
          </Text>
        </View>
      </View>
      <View>
        <Text
          className={`text-sm font-medium text-slate-400 ${isRTL ? "text-right" : "text-left"}`}
        >
          {label}
        </Text>
        <Text
          className={`text-2xl font-bold text-white mt-1 ${isRTL ? "text-right" : "text-left"}`}
        >
          {value}
        </Text>
      </View>
      <View className="h-8 w-full mt-2">
        <Svg
          height="100%"
          width="100%"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
        >
          {sparkColor === "#f4c025" && (
            <Defs>
              <LinearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#f4c025" stopOpacity={0.2} />
                <Stop offset="1" stopColor="#f4c025" stopOpacity={0} />
              </LinearGradient>
            </Defs>
          )}
          <Path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="2" />
          {sparkColor === "#f4c025" && (
            <Path
              d={sparkPath + " V 20 H 0 Z"}
              fill="url(#gradientSales)"
              stroke="none"
            />
          )}
        </Svg>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { t, i18n } = useTranslation(["admin", "common"]);
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language;

  const { orders, loading, updateOrderStatus } = useOrders();

  // 1. Calculate KPIs from real data
  const totalRevenue = orders.reduce(
    (acc, o) => acc + (o.total_amount || 0),
    0,
  );
  const activeOrders = orders.filter((o) => o.status !== "delivered").length;
  const uniqueCustomers = new Set(orders.map((o) => o.customer_name)).size;

  // 2. Prepare Chart Data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map((date) => {
    const dayTotal = orders
      .filter((o) => o.created_at.startsWith(date))
      .reduce((acc, o) => acc + (o.total_amount || 0), 0);
    return dayTotal;
  });

  // Simple SVG path generator for the chart
  const maxVal = Math.max(...chartData, 100);
  const chartPath = chartData
    .map((val, i) => {
      const x = (i / 6) * 350;
      const y = 150 - (val / maxVal) * 140;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const kpis = [
    {
      icon: "attach-money",
      iconColor: "#f4c025",
      iconBg: "bg-primary/10",
      label: t("admin:total_sales"),
      value: formatCurrency(totalRevenue, locale),
      trend: "+12%",
      trendUp: true,
      sparkColor: "#f4c025",
      sparkPath: "M0 15 Q 10 18, 20 12 T 40 10 T 60 14 T 80 5 L 100 8",
    },
    {
      icon: "shopping-bag",
      iconColor: "#60a5fa",
      iconBg: "bg-blue-500/10",
      label: t("admin:active_orders_kpi"),
      value: activeOrders.toString(),
      trend: "Fresh",
      trendUp: true,
      sparkColor: "#60a5fa",
      sparkPath: "M0 8 Q 15 5, 30 12 T 50 15 T 70 8 T 90 12 L 100 10",
    },
    {
      icon: "visibility",
      iconColor: "#a855f7",
      iconBg: "bg-purple-500/10",
      label: t("admin:customers"),
      value: uniqueCustomers.toString(),
      trend: "+5%",
      trendUp: true,
      sparkColor: "#a78bfa",
      sparkPath: "M0 18 Q 20 15, 40 5 T 60 12 T 80 8 L 100 2",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <View
        className="flex-1 w-full mx-auto"
        style={isDesktop ? { maxWidth: 1200 } : undefined}
      >
        {/* Header */}
        <View
          className={`flex-row items-center justify-between p-5 bg-background-dark/95 border-b border-surface-lighter z-20 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <View
            className={`flex-row items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <View className="relative">
              <View className="h-10 w-10 rounded-full border border-surface-lighter overflow-hidden bg-surface-dark">
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCu-2fcSzsc_Ex4qn3S-ZO7TdJiN2Ed-SWbNePNrPfXWfP2pO0ORxICA-VJ5bG9YKyhcw-Z6Qnw1P_KUqQNNTnizCvWkLCm62PWkN3oju88Gsyyhky2UFlrhUU7hRBrU7DB6Bhq0SsZezCxsH0zojNVMAtyOyOgNjfbVDeuOG0Po2T812xA25X7S2u4og0h2UsN27SqQawHNSpVOB2KQQFlwnyu_TBapWRFsFKuMmvy0NhV2hb00dS8QBngAXL9g9Nz6x-LhJ0QSv22",
                  }}
                  className="w-full h-full"
                />
              </View>
              <View
                className={`absolute bottom-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background-dark ${isRTL ? "left-0" : "right-0"}`}
              />
            </View>
            <View>
              <Text
                className={`text-xs font-medium text-slate-400 ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("admin:welcome_back")}
              </Text>
              <Text
                className={`text-lg font-bold leading-tight text-white ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("admin:admin")}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-dark">
            <MaterialIcons name="notifications" size={20} color="white" />
            <View
              className={`absolute top-2 h-2 w-2 rounded-full bg-primary ${isRTL ? "left-2.5" : "right-2.5"}`}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* KPI Cards */}
          {isDesktop ? (
            <View
              className={`flex-row gap-4 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {kpis.map((kpi, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <KpiCard {...kpi} isRTL={isRTL} />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 8,
                paddingRight: isRTL ? 0 : 16,
                paddingLeft: isRTL ? 16 : 0,
              }}
              className="-mx-4 px-4 w-screen max-w-full"
              style={isRTL ? { flexDirection: "row-reverse" } : {}}
            >
              {kpis.map((kpi, i) => (
                <KpiCard key={i} {...kpi} isRTL={isRTL} />
              ))}
            </ScrollView>
          )}

          {/* Revenue Chart */}
          <View className="mt-6">
            <View
              className={`flex-row items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Text className="text-lg font-bold text-white">
                {t("admin:sales_revenue")}
              </Text>
              <TouchableOpacity className="bg-primary/10 px-3 py-1.5 rounded-lg">
                <Text className="text-xs font-medium text-primary">
                  {t("admin:last_7_days")}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="rounded-xl bg-surface-dark border border-surface-lighter p-5 shadow-lg">
              <View
                className={`mb-6 flex-col gap-1 ${isRTL ? "items-end" : "items-start"}`}
              >
                <Text className="text-3xl font-bold text-white">
                  {formatCurrency(totalRevenue, locale)}
                </Text>
                <View
                  className={`flex-row items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Text className="text-sm text-slate-400">
                    {t("admin:total_revenue")}
                  </Text>
                  <Text className="text-xs font-bold text-green-500">
                    +10.4%
                  </Text>
                </View>
              </View>

              <View className="relative h-48 w-full">
                <View className="absolute inset-0 flex-col justify-between">
                  {["50k", "30k", "10k", "0"].map((label, idx) => (
                    <View
                      key={idx}
                      className={`border-b border-surface-lighter/50 w-full pb-1 ${isRTL ? "items-end" : "items-start"}`}
                    >
                      <Text className="text-xs text-slate-600 font-medium">
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="absolute inset-0 pt-4" style={{ zIndex: 10 }}>
                  <Svg
                    height="100%"
                    width="100%"
                    viewBox="0 0 350 150"
                    preserveAspectRatio="none"
                  >
                    <Defs>
                      <LinearGradient
                        id="chartGradientMain"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop
                          offset="0"
                          stopColor="#f4c025"
                          stopOpacity={0.3}
                        />
                        <Stop offset="1" stopColor="#f4c025" stopOpacity={0} />
                      </LinearGradient>
                    </Defs>
                    <Path
                      d={chartPath}
                      fill="none"
                      stroke="#f4c025"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <Path
                      d={`${chartPath} V 150 H 0 Z`}
                      fill="url(#chartGradientMain)"
                      stroke="none"
                    />
                  </Svg>
                </View>
              </View>

              <View
                className={`mt-4 flex-row justify-between px-1 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <Text
                      key={day}
                      className="text-xs font-medium text-slate-500"
                    >
                      {day}
                    </Text>
                  ),
                )}
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-4 mt-6">
            <Text
              className={`text-lg font-bold text-white mb-4 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("admin:quick_actions")}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AdminReviews")}
              className={`flex-row items-center justify-between bg-surface-dark border border-surface-lighter p-4 rounded-xl mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <View
                className={`flex-row items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                  <MaterialIcons name="star" size={20} color="#f4c025" />
                </View>
                <View>
                  <Text
                    className={`text-white font-bold ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("admin:manage_reviews")}
                  </Text>
                  <Text
                    className={`text-white/40 text-xs ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t(
                      "admin:manage_reviews_desc",
                      "Monitor and moderate reviews",
                    )}
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("AdminCustomers")}
              className={`flex-row items-center justify-between bg-surface-dark border border-surface-lighter p-4 rounded-xl mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <View
                className={`flex-row items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View className="h-10 w-10 rounded-full bg-blue-500/10 items-center justify-center">
                  <MaterialIcons name="people" size={20} color="#3b82f6" />
                </View>
                <View>
                  <Text
                    className={`text-white font-bold ${isRTL ? "text-right" : "text-left"}`}
                  >
                    Customers
                  </Text>
                  <Text
                    className={`text-white/40 text-xs ${isRTL ? "text-right" : "text-left"}`}
                  >
                    View customer profiles & orders
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("AdminReturns")}
              className={`flex-row items-center justify-between bg-surface-dark border border-surface-lighter p-4 rounded-xl ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <View
                className={`flex-row items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View className="h-10 w-10 rounded-full bg-indigo-500/10 items-center justify-center">
                  <MaterialIcons name="inventory" size={20} color="#6366f1" />
                </View>
                <View>
                  <Text
                    className={`text-white font-bold ${isRTL ? "text-right" : "text-left"}`}
                  >
                    Returns
                  </Text>
                  <Text
                    className={`text-white/40 text-xs ${isRTL ? "text-right" : "text-left"}`}
                  >
                    Manage return requests
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          </View>

          {/* Recent Orders */}
          <View className="pb-4 mt-4">
            <View
              className={`flex-row items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Text className="text-lg font-bold text-white">
                {t("admin:recent_orders")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("AdminOrders")}
              >
                <Text className="text-sm font-medium text-primary">
                  {t("admin:view_all")}
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#f4c025" />
            ) : (
              <View className="flex-col">
                {orders.map((order) => (
                  <OrderItem
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                    t={t}
                    isRTL={isRTL}
                    locale={locale}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
