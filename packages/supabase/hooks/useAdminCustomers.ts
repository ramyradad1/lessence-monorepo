import { useState, useCallback, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { CustomerAggregate, AdminNote, Order, Address } from '@lessence/core';

export type CustomerFilter = {
  search?: string;
  sortBy?: 'total_spend' | 'total_orders' | 'created_at' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type CustomerDetail = CustomerAggregate & {
  orders: Order[];
  addresses: Address[];
  notes: AdminNote[];
};

export function useAdminCustomers(supabase: SupabaseClient) {
  const [customers, setCustomers] = useState<CustomerAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = useCallback(async (filter?: CustomerFilter) => {
    setLoading(true);
    try {
      const page = filter?.page || 1;
      const pageSize = filter?.pageSize || 25;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const sortBy = filter?.sortBy || 'created_at';
      const sortOrder = filter?.sortOrder || 'desc';

      let query = supabase
        .from('customer_aggregates')
        .select('*', { count: 'exact' })
        .eq('role', 'user')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (filter?.search) {
        query = query.or(`full_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setCustomers((data || []) as CustomerAggregate[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchCustomerDetail = useCallback(async (customerId: string): Promise<CustomerDetail | null> => {
    try {
      // Customer aggregate
      const { data: customer, error } = await supabase
        .from('customer_aggregates')
        .select('*')
        .eq('id', customerId)
        .single();
      if (error || !customer) return null;

      // Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      // Addresses
      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', customerId)
        .order('is_default', { ascending: false });

      // Admin notes with admin profile name
      const { data: notes } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Enrich notes with admin names
      const enrichedNotes: AdminNote[] = [];
      if (notes && notes.length > 0) {
        const adminIds = Array.from(new Set(notes.map((n: any) => n.admin_id)));
        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', adminIds);

        const adminMap = new Map((adminProfiles || []).map((p: any) => [p.id, p.full_name]));
        for (const n of notes) {
          enrichedNotes.push({
            ...n,
            admin_name: adminMap.get(n.admin_id) || 'Admin',
          });
        }
      }

      return {
        ...(customer as CustomerAggregate),
        orders: (orders || []) as Order[],
        addresses: (addresses || []) as Address[],
        notes: enrichedNotes,
      };
    } catch (err) {
      console.error('Fetch customer detail error:', err);
      return null;
    }
  }, [supabase]);

  const addNote = useCallback(async (customerId: string, note: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_notes')
        .insert({ customer_id: customerId, admin_id: user.id, note });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const deleteNote = useCallback(async (noteId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [supabase]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    totalCount,
    fetchCustomers,
    fetchCustomerDetail,
    addNote,
    deleteNote,
  };
}
