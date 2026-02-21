import { useState, useCallback, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '@lessence/core';

export function useAdminUsers(supabase: SupabaseClient) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createUser = async (email: string, password?: string, fullName?: string, role: 'user' | 'admin' = 'user') => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'create', userData: { email, password, full_name: fullName, role } }
      });
      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'delete', userId }
      });
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'update', userId, updates }
      });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
    return updateUser(userId, { role });
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
    createUser,
    deleteUser,
    updateUser,
    updateUserRole,
  };
}
