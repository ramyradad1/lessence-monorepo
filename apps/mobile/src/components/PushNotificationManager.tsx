import React, { useEffect } from 'react';
import { useAuth } from '@lessence/supabase';
import { supabase } from '../lib/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const PushNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { expoPushToken, notification } = usePushNotifications(supabase, user?.id);

  useEffect(() => {
    if (expoPushToken) {
      console.log('Registered for push notifications with token:', expoPushToken);
    }
  }, [expoPushToken]);

  useEffect(() => {
    if (notification) {
      // You could show an in-app toast here if you wanted
      console.log('Received notification in foreground:', notification);
    }
  }, [notification]);

  return null; // This component doesn't render anything
};
