import React, { useState, useEffect } from "react";
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
import { useAdminCustomers } from "@lessence/supabase";

export default function AdminCustomersScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");

  const { customers, loading, totalCount, fetchCustomers } =
    useAdminCustomers(supabase);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers({
        search: search || undefined,
        sortBy: "created_at",
        sortOrder: "desc",
        page: 1,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchCustomers]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("AdminCustomerDetail", { customerId: item.id })
      }
      className={`bg-surface-dark border border-white/5 rounded-2xl p-4 mb-3 flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <View
        className={`w-12 h-12 rounded-full bg-primary/10 items-center justify-center ${isRTL ? "ml-4" : "mr-4"}`}
      >
        <MaterialIcons name="person" size={24} color="#f4c025" />
      </View>

      <View className="flex-1">
        <Text
          className={`text-white font-medium text-base mb-1 ${isRTL ? "text-right" : "text-left"}`}
        >
          {item.full_name || "Anonymous Customer"}
        </Text>
        <Text
          className={`text-white/50 text-xs ${isRTL ? "text-right" : "text-left"}`}
        >
          {item.email}
        </Text>
      </View>

      <View className="items-end justify-center">
        <Text
          className={`text-primary font-bold text-sm ${isRTL ? "text-left" : "text-right"}`}
        >
          ${Number(item.total_spend || 0).toFixed(2)}
        </Text>
        <Text
          className={`text-white/40 text-[10px] uppercase tracking-wider ${isRTL ? "text-left" : "text-right"}`}
        >
          {item.total_orders} Orders
        </Text>
      </View>
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
            className={`text-xl font-display text-white uppercase tracking-widest ${isRTL ? "text-right" : "text-left"}`}
          >
            Customers
          </Text>
          <Text
            className={`text-white/40 text-xs ${isRTL ? "text-right" : "text-left"}`}
          >
            {totalCount} Total
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
            placeholder="Search by name or email..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={search}
            onChangeText={setSearch}
            className={`flex-1 text-white text-base ${isRTL ? "mr-3 text-right" : "ml-3 text-left"} py-2`}
          />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#f4c025" />
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="py-12 items-center">
                <Text className="text-white/40">No customers found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
