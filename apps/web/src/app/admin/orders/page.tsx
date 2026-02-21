'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminOrders } from '@lessence/supabase';
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

export default function AdminOrdersPage() {
  const { orders, loading, totalCount, fetchOrders, updateOrderStatus } = useAdminOrders(supabase);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders({ search: search || undefined, status: statusFilter || undefined, page });
  }, [search, statusFilter, page, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const { data: { user } } = await supabase.auth.getUser();
    await updateOrderStatus(orderId, newStatus, user?.id);
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-1">{totalCount} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by order number..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-[#1e1b16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(1); }}
          title="Filter by status"
          className="bg-[#1e1b16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-white/20">No orders found</td></tr>
                )}
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-white hover:text-[#f4c025]">{order.order_number}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-white">${(order.total || order.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-xs text-white/30">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        title="Update order status"
                        className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-[#1e1b16]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 25 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm text-white/40 hover:text-white disabled:opacity-30 px-3 py-1.5 bg-white/5 rounded-lg"
          >
            ← Prev
          </button>
          <span className="text-sm text-white/40">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 25 >= totalCount}
            className="text-sm text-white/40 hover:text-white disabled:opacity-30 px-3 py-1.5 bg-white/5 rounded-lg"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
