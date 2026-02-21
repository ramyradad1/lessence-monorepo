'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminOrders, OrderDetail } from '@lessence/supabase';
import { OrderStatus } from '@lessence/core';

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { fetchOrderDetail, updateOrderStatus } = useAdminOrders(supabase);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrderDetail(orderId);
      setOrder(data);
      setLoading(false);
    };
    load();
  }, [orderId, fetchOrderDetail]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();
    await updateOrderStatus(orderId, newStatus, user?.id);
    const updated = await fetchOrderDetail(orderId);
    setOrder(updated);
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-white/40 text-center py-12">Order not found</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.push('/admin/orders')} className="text-sm text-white/40 hover:text-white">← Back to Orders</button>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
          <p className="text-white/30 text-sm mt-1">{order.customer_name || 'Guest'} {order.customer_email ? `(${order.customer_email})` : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={order.status}
            disabled={updating}
            onChange={e => handleStatusChange(e.target.value as OrderStatus)}
            title="Update order status"
            className="bg-[#1e1b16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none disabled:opacity-50"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s} className="bg-[#1e1b16]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <span className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status]}`}>{order.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white font-medium">{item.product_name}</p>
                  <p className="text-xs text-white/30">{item.selected_size} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-white">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <span className="text-sm text-white/40">Total</span>
            <span className="text-lg font-bold text-[#f4c025]">${Number(order.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment & Address */}
        <div className="space-y-6">
          {order.payment && (
            <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Payment</h2>
              <p className="text-sm text-white"><span className="text-white/40">Provider:</span> {order.payment.provider}</p>
              <p className="text-sm text-white"><span className="text-white/40">Status:</span> {order.payment.status}</p>
              {order.payment.transaction_id && (
                <p className="text-xs text-white/20 mt-1 font-mono break-all">{order.payment.transaction_id}</p>
              )}
            </div>
          )}
          {order.address && (
            <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Shipping Address</h2>
              <p className="text-sm text-white">{order.address.full_name}</p>
              <p className="text-sm text-white/60">{order.address.address_line1}</p>
              <p className="text-sm text-white/60">{order.address.city}, {order.address.state} {order.address.postal_code}</p>
              <p className="text-sm text-white/60">{order.address.country}</p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      {order.audit_logs && order.audit_logs.length > 0 && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Status History</h2>
          <div className="space-y-2">
            {order.audit_logs.map(log => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">{log.action}:</span>
                  <span className="text-orange-400">{(log.changes as any)?.from}</span>
                  <span className="text-white/20">→</span>
                  <span className="text-green-400">{(log.changes as any)?.to}</span>
                </div>
                <span className="text-xs text-white/20">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
