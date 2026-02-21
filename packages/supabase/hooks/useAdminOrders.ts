import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, OrderItem, Payment, AdminAuditLog, OrderStatusHistory, OrderAdminNote } from '@lessence/core';

export type OrderFilter = {
  status?: OrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type OrderDetail = Order & {
  items: OrderItem[];
  payment?: Payment;
  address?: {
    full_name: string;
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  audit_logs?: AdminAuditLog[];
};

export function useAdminOrders(supabase: SupabaseClient) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async (filter?: OrderFilter) => {
    setLoading(true);
    try {
      const page = filter?.page || 1;
      const pageSize = filter?.pageSize || 25;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.search) {
        query = query.ilike('order_number', `%${filter.search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // Enrich with profile info for customer name
      const enriched = (data || []).map(o => ({
        ...o,
        total: Number(o.total_amount || 0),
      }));

      setOrders(enriched as Order[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchOrderDetail = useCallback(async (orderId: string): Promise<OrderDetail | null> => {
    try {
      // Order
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error || !order) return null;

      // Items
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      // Payment
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .limit(1);

      // Address
      let address = null;
      if (order.shipping_address_id) {
        const { data: addr } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', order.shipping_address_id)
          .single();
        address = addr;
      }

      // Audit logs
      const { data: logs } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('table_name', 'orders')
        .eq('record_id', orderId)
        .order('created_at', { ascending: false });

      // Status history
      const { data: statusHistory } = await supabase
        .from('order_status_history')
        .select('*, profiles(full_name)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      // Admin notes
      const { data: adminNotes } = await supabase
        .from('order_admin_notes')
        .select('*, profiles(full_name)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      // Customer profile
      let customerName = '';
      let customerEmail = '';
      if (order.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', order.user_id)
          .single();
        customerName = profile?.full_name || '';
        customerEmail = profile?.email || '';
      }

      return {
        ...order,
        total: Number(order.total_amount || 0),
        customer_name: customerName,
        customer_email: customerEmail,
        items: items || [],
        payment: payments?.[0] || undefined,
        address: address || undefined,
        audit_logs: logs || [],
        status_history: (statusHistory || []).map(h => ({
          ...h,
          changed_by_name: (h.profiles as any)?.full_name
        })),
        admin_notes: (adminNotes || []).map(n => ({
          ...n,
          admin_name: (n.profiles as any)?.full_name
        })),
      } as OrderDetail;
    } catch (err) {
      console.error('Fetch order detail error:', err);
      return null;
    }
  }, [supabase]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, adminId?: string) => {
    try {
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      const oldStatus = currentOrder?.status;

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Create audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: adminId || null,
        action: 'status_change',
        table_name: 'orders',
        record_id: orderId,
        changes: { from: oldStatus, to: newStatus },
      });

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      return { success: true };
    } catch (err: any) {
      console.error('Update status error:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const addOrderNote = useCallback(async (orderId: string, note: string, adminId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_admin_notes')
        .insert({
          order_id: orderId,
          admin_id: adminId,
          note
        })
        .select('*, profiles(full_name)')
        .single();

      if (error) throw error;

      return {
        success: true,
        note: {
          ...data,
          admin_name: (data.profiles as any)?.full_name
        } as OrderAdminNote
      };
    } catch (err: any) {
      console.error('Add order note error:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, totalCount, fetchOrders, fetchOrderDetail, updateOrderStatus, addOrderNote };
}
