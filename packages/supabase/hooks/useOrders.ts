"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order } from '@lessence/core';

export function useOrders(supabase: SupabaseClient) {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      return { orderId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    },
  });

  const fetchOrderDetail = async (orderId: string) => {
    // We used to fetch manually, but it's better to provide a way to use a separate useQuery for details
    // For backward compatibility with the existing hook interface:
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          product:products (name, image_url)
        ),
        address:addresses (*),
        status_history:order_status_history (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Fetch order detail error:', error);
      return null;
    }

    return {
      ...order,
      status_history: (order.status_history || []).sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    } as Order;
  };

  return { 
    orders, 
    loading: loadingOrders, 
    fetchOrders: () => queryClient.invalidateQueries({ queryKey: ['orders'] }), 
    fetchOrderDetail, 
    updateOrderStatus: (orderId: string, status: Order['status']) => updateStatusMutation.mutateAsync({ orderId, status })
  };
}
