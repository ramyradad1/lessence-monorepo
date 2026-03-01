"use client";

import { useState, useCallback, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { AdminNotification } from '@lessence/core';

export function useAdminNotifications(supabase: SupabaseClient) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return { success: true };
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return { success: true };

      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, [supabase, notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
