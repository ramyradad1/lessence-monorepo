import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function AboutScreen() {
  const { t, i18n } = useTranslation(["common"]);
  const isRTL = i18n.dir() === "rtl";
  const navigation = useNavigation<any>();

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
          {t("common:about", "About Us")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-10">
          <Text className="text-4xl font-display text-white mb-10 uppercase tracking-widest text-center">
            Our Story
          </Text>

          <Text className="text-white/70 leading-8 text-base text-center font-light mb-8">
            Born from a passion for the rarest essences, L'Essence is more than
            a perfume house. It is a sanctuary for scent-seekers and a tribute
            to the art of fine perfumery.
          </Text>

          <View className="h-[1px] w-16 bg-primary/30 my-8" />

          <Text className="text-white/70 leading-8 text-base text-center font-light mb-12">
            Every fragrance in our collection is a chapter of a story untold,
            crafted with precision and a commitment to timeless elegance.
          </Text>

          <Text className="italic text-primary/80 font-display text-xl text-center">
            "Elegance is the only beauty that never fades."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
