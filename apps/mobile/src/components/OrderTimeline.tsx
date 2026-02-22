import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { OrderStatus } from "@lessence/core";
import { useTranslation } from "react-i18next";

type TimelineStep = {
  status: OrderStatus;
  labelKey: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const STEPS: TimelineStep[] = [
  {
    status: "pending",
    labelKey: "orders:timeline.pending",
    icon: "shopping-bag",
  },
  { status: "paid", labelKey: "orders:timeline.paid", icon: "payments" },
  {
    status: "processing",
    labelKey: "orders:timeline.processing",
    icon: "sync",
  },
  {
    status: "shipped",
    labelKey: "orders:timeline.shipped",
    icon: "local-shipping",
  },
  { status: "delivered", labelKey: "orders:timeline.delivered", icon: "home" },
];

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  history?: { status: OrderStatus; created_at: string }[];
}

export default function OrderTimeline({
  currentStatus,
  history = [],
}: OrderTimelineProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language;
  const isCancelled = currentStatus === "cancelled";
  const isRefunded = currentStatus === "refunded";

  const historyMap = history.reduce(
    (acc, curr) => {
      acc[curr.status] = curr.created_at;
      return acc;
    },
    {} as Record<string, string>,
  );

  const getStepStatus = (stepStatus: OrderStatus, index: number) => {
    if (isCancelled || isRefunded) {
      if (stepStatus === currentStatus) return "active";
      return "disabled";
    }

    const currentIdx = STEPS.findIndex((s) => s.status === currentStatus);
    if (index < currentIdx) return "completed";
    if (index === currentIdx) return "active";
    return "upcoming";
  };

  const progress =
    Math.max(
      0,
      STEPS.findIndex((s) => s.status === currentStatus) / (STEPS.length - 1),
    ) * 68;

  return (
    <View className="py-6">
      <View
        className={`flex-row justify-between items-start relative px-2 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        {/* Line */}
        <View
          className="absolute top-5 left-8 right-8 h-[2px] bg-white/5"
          pointerEvents="none"
        />

        {/* Progress Line */}
        {!isCancelled && !isRefunded && (
          <View
            className="absolute top-5 h-[2px] bg-primary"
            style={[
              isRTL ? { right: 32 } : { left: 32 },
              { width: `${progress}%` },
            ]}
            pointerEvents="none"
          />
        )}

        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step.status, index);
          const date = historyMap[step.status];

          return (
            <View key={step.status} className="items-center flex-1">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                  stepStatus === "completed"
                    ? "bg-primary border-primary"
                    : stepStatus === "active"
                      ? "bg-background-dark border-primary"
                      : "bg-surface-dark border-white/10"
                }`}
              >
                {stepStatus === "completed" ? (
                  <MaterialIcons name="check" size={18} color="#000" />
                ) : (
                  <MaterialIcons
                    name={step.icon}
                    size={16}
                    color={
                      stepStatus === "active"
                        ? "#f4c025"
                        : "rgba(255,255,255,0.2)"
                    }
                  />
                )}
              </View>
              <Text
                className={`text-[8px] font-bold uppercase tracking-widest mt-2 text-center ${
                  stepStatus === "upcoming" ? "text-white/20" : "text-white"
                }`}
              >
                {t(step.labelKey)}
              </Text>
              {date && (
                <Text className="text-[6px] text-white/30 mt-0.5">
                  {new Date(date).toLocaleDateString(locale)}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Special status badge */}
      {(isCancelled || isRefunded) && (
        <View className="mt-4 self-center bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full flex-row items-center">
          <MaterialIcons
            name={isCancelled ? "cancel" : "undo"}
            size={12}
            color={isCancelled ? "#fb7185" : "#9ca3af"}
            style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }}
          />
          <Text
            className={`text-[10px] font-bold uppercase tracking-widest ${isCancelled ? "text-red-400" : "text-gray-400"}`}
          >
            {t("orders:order_number", { number: "" }).replace("#", "").trim()}{" "}
            {t(`orders:statuses.${currentStatus}`)}
          </Text>
        </View>
      )}
    </View>
  );
}
