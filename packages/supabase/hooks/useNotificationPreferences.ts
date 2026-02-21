import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationPreferences } from '@lessence/core';

export function useNotificationPreferences(supabase: SupabaseClient, userId?: string) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setPreferences(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        setPreferences(data as NotificationPreferences);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return;
    
    // Optimistic update
    setPreferences(prev => prev ? { ...prev, ...updates } : null);

    const { error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      fetchPreferences();
    }
  }, [supabase, userId, fetchPreferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences
  };
}
