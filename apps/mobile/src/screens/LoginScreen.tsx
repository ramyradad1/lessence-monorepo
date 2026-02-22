import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";

import { useAuth } from "@lessence/supabase";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen({
  onLoginSuccess,
}: {
  onLoginSuccess?: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { signIn, signUp, isLoading } = useAuth();

  const { t, i18n } = useTranslation("auth");
  const isRTL = i18n.dir() === "rtl";

  const handleSubmit = async () => {
    setErrorMsg("");
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setErrorMsg(error.message);
      else onLoginSuccess?.();
    } else {
      const { error } = await signUp(email, fullName, password);
      if (error) setErrorMsg(error.message);
      else onLoginSuccess?.();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background-dark"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View className="absolute top-0 right-0 z-10">
          <TouchableOpacity
            className="p-3 bg-white/5 border border-white/10 rounded-full"
            onPress={async () => {
              const nextLng = i18n.language === "ar" ? "en" : "ar";
              await i18n.changeLanguage(nextLng);
              Alert.alert(
                nextLng === "ar" ? "إعادة التشغيل مطلوبة" : "Restart Required",
                nextLng === "ar"
                  ? "يجب إعادة تشغيل التطبيق لتطبيق تغييرات التخطيط."
                  : "The app needs to restart to apply layout changes.",
                [{ text: nextLng === "ar" ? "حسناً" : "OK" }],
              );
            }}
          >
            <MaterialIcons name="language" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-10">
          <Image
            source={require("../../assets/logo.png")}
            className="w-48 h-24"
            resizeMode="contain"
          />


          <Text className="text-white/40 text-[10px] tracking-[2px] uppercase text-center">
            {isLogin ? t("welcome_back") : t("discover_collection")}
          </Text>
        </View>

        {errorMsg !== "" && (
          <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-6">
            <Text className="text-red-400 text-xs text-center">{errorMsg}</Text>
          </View>
        )}

        <View className="space-y-4 mb-6">
          {!isLogin && (
            <TextInput
              placeholder={t("full_name").toUpperCase()}
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={fullName}
              onChangeText={setFullName}
              className={`w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs tracking-[1px] text-white ${isRTL ? "text-right" : "text-left"}`}
              textAlign={isRTL ? "right" : "left"}
            />
          )}

          <TextInput
            placeholder={t("email").toUpperCase()}
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className={`w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs tracking-[1px] text-white ${isRTL ? "text-right" : "text-left"}`}
            textAlign={isRTL ? "right" : "left"}
          />

          <TextInput
            placeholder={t("password").toUpperCase()}
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className={`w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs tracking-[1px] text-white ${isRTL ? "text-right" : "text-left"}`}
            textAlign={isRTL ? "right" : "left"}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className={`w-full bg-primary py-4 rounded-full items-center ${isLoading ? "opacity-50" : ""}`}
        >
          <Text className="text-black font-bold uppercase tracking-[2px] text-xs">
            {isLoading
              ? t("authenticating")
              : isLogin
                ? t("sign_in")
                : t("create_account")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsLogin(!isLogin);
            setErrorMsg("");
          }}
          className="mt-8 self-center"
        >
          <Text className="text-white/40 text-[10px] tracking-[1px] uppercase text-center">
            {isLogin ? t("need_account") : t("sign_in_msg")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
