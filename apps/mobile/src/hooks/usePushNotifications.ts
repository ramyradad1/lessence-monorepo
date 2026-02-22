import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { SupabaseClient } from "@supabase/supabase-js";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications(
  supabase: SupabaseClient,
  userId?: string,
) {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(
    undefined,
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (userId) {
      registerForPushNotificationsAsync().then((token) => {
        setExpoPushToken(token);
        if (token) {
          saveTokenToSupabase(token);
        }
      });
    }

    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification: Notifications.Notification) => {
          setNotification(notification);
        },
      );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          console.log("Notification response received:", response);
        },
      );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);

  async function saveTokenToSupabase(token: string) {
    if (!userId) return;

    try {
      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: userId,
          token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "token",
        },
      );

      if (error) {
        console.error("Error saving push token to Supabase:", error);
      }
    } catch (err) {
      console.error("Unexpected error saving push token:", err);
    }
  }

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "web") {
      return undefined;
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return undefined;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          console.warn(
            "Project ID not found in expo config. Push notifications might not work in production.",
          );
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;
      } catch (e) {
        console.warn("Error getting expo push token:", e);
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  return {
    expoPushToken,
    notification,
  };
}
