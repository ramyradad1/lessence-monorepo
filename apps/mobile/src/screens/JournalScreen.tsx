import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function JournalScreen() {
  const { t, i18n } = useTranslation(["common"]);
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();

  const articles = [1, 2, 3];

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
        <Text className="text-xl font-display text-white uppercase tracking-widest">
          {t("common:journal", "Journal")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className={`text-4xl font-display text-white mb-8 uppercase tracking-widest ${isRTL ? "text-right" : "text-center"}`}
        >
          Journal
        </Text>

        <View className="flex-col gap-6">
          {articles.map((i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden"
            >
              <View className="h-48 bg-white/5" />
              <View className="p-6">
                <Text
                  className={`text-[10px] text-primary uppercase tracking-widest mb-3 font-bold ${isRTL ? "text-right" : "text-left"}`}
                >
                  Olfactory Notes
                </Text>
                <Text
                  className={`text-lg font-medium text-white mb-3 ${isRTL ? "text-right" : "text-left"}`}
                >
                  The Art of Layering
                </Text>
                <Text
                  className={`text-white/40 text-xs leading-5 mb-4 ${isRTL ? "text-right" : "text-left"}`}
                >
                  Discover the hidden secrets of mixing rare essences to create
                  your own signature trail...
                </Text>
                <Text
                  className={`text-[10px] text-white/20 uppercase tracking-widest font-bold ${isRTL ? "text-right" : "text-left"}`}
                >
                  Coming Spring 2024
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
