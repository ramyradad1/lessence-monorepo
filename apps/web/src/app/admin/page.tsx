'use client';

import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminDashboard, useAdminNotifications } from '@lessence/supabase';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function AdminDashboard() {
  const { kpis, chartData, recentOrders, loading: dashboardLoading } = useAdminDashboard(supabase);
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead } = useAdminNotifications(supabase);

  const loading = dashboardLoading || notificationsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build SVG chart path
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);
  const chartPath = chartData.map((d, i) => {
    const x = (i / Math.max(chartData.length - 1, 1)) * 100;
    const y = 100 - (d.revenue / maxRevenue) * 90;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const kpiCards = [
    { label: 'Total Revenue', value: `$${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', trend: '+12%', up: true },
    { label: 'Total Orders', value: kpis.orderCount.toString(), icon: '📦', trend: kpis.newOrdersCount + ' new', up: true },
    { label: 'Customers', value: kpis.uniqueCustomers.toString(), icon: '👥', trend: '+5%', up: true },
    { label: 'Visitors', value: kpis.visitorCount.toLocaleString(), icon: '👁️', trend: '30d', up: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Overview of your store performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.up ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {card.trend}
              </span>
            </div>
            <p className="text-sm text-white/40 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Revenue</h2>
            <p className="text-sm text-white/30">Last 7 days</p>
          </div>
          <span className="text-2xl font-bold text-white">${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="relative h-48 w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4c025" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f4c025" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chartData.length > 0 && (
              <>
                <path d={chartPath} fill="none" stroke="#f4c025" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                <path d={`${chartPath} L 100 100 L 0 100 Z`} fill="url(#chartFill)" />
              </>
            )}
          </svg>
        </div>

        <div className="flex justify-between mt-3 px-1">
          {chartData.map((d, i) => (
            <span key={i} className="text-xs text-white/30 font-medium">{d.label}</span>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[#f4c025] font-medium hover:underline">View All →</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Order</th>
                <th className="pb-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Status</th>
                <th className="pb-3 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Total</th>
                <th className="pb-3 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-white/20">No orders yet</td></tr>
              )}
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-white hover:text-[#f4c025] transition-colors">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm font-semibold text-white">${(order.total || order.total_amount || 0).toFixed(2)}</td>
                  <td className="py-3 text-right text-xs text-white/30">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Inventory Alerts</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-sm">No inventory alerts</div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${notification.is_read
                    ? 'bg-white/[0.02] border-white/5'
                    : 'bg-red-500/5 border-red-500/20'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 text-sm">⚠️</span>
                    <span className={`text-sm font-medium ${notification.is_read ? 'text-white/60' : 'text-white'}`}>
                      {notification.message}
                    </span>
                  </div>
                  <div className="text-xs text-white/30 ml-6">
                    {new Date(notification.created_at || '').toLocaleString()}
                  </div>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-[#f4c025] hover:underline whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
