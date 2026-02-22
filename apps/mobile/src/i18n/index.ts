import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { translations } from "@lessence/core";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "user-language";

const languageDetector: any = {
  type: "languageDetector",
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      const deviceLanguage = Localization.getLocales()[0].languageCode ?? "en";
      callback(deviceLanguage);
    } catch (error) {
      console.log("Error fetching language", error);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);

      // Handle RTL
      const isRTL = lng === "ar";
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        // Note: In some Expo versions/platforms, a restart might be needed for full RTL effect
      }
    } catch (error) {
      console.log("Error saving language", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: translations,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    defaultNS: "common",
    ns: [
      "common",
      "auth",
      "profile",
      "checkout",
      "orders",
      "notifications",
      "shop",
      "admin",
      "product",
      "validation",
      "cart",
    ],
    react: {
      useSuspense: false,
    },
  });

export default i18n;
