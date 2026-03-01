"use client";

import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

// Replace with your actual VAPID public key
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPushNotifications(supabase: SupabaseClient, userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported || !userId) return;

    setIsLoading(true);
    try {
      // Request permission
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        throw new Error('Permission not granted for Notification');
      }

      // Register or get the existing ServiceWorker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to Push Messages
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save the subscription to Supabase as an FCM token (using the same array for both)
      const tokenString = JSON.stringify(subscription);
      
      const { error } = await supabase.rpc('register_fcm_token', {
        token: tokenString
      });

      if (error) {
        console.error('Error saving push subscription:', error);
      } else {
        console.log('Push subscription saved successfully');
      }

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isLoading,
    subscribeToPush
  };
}
