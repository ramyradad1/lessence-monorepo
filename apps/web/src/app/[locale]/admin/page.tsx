'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminDashboard, useAdminNotifications } from '@lessence/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const PIE_COLORS: Record<string, string> = {
  pending: '#f97316',
  paid: '#10b981',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

import { useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';

function TrendBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  const color = isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d={isUp ? 'M5 2L8 6H2L5 2Z' : 'M5 8L2 4H8L5 8Z'} fill="currentColor" />
      </svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#2a2520] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-fg-muted mb-1">{label}</p>
      {/* eslint-disable-next-line react/forbid-dom-props */}
      {payload.map((p: TooltipPayloadItem, i: number) => (
        <React.Fragment key={i}>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <p className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? `EGP ${Number(p.value).toLocaleString()}` : p.value}
          </p>
        </React.Fragment>
      ))}
    </div >
  );
};

export default function AdminDashboard() {
  const locale = useLocale();
  const [period, setPeriod] = useState('30d');
  const { kpis, chartData, ordersByStatus, topProducts, recentOrders, loading: dashboardLoading } = useAdminDashboard(supabase, period);
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead } = useAdminNotifications(supabase);

  const loading = dashboardLoading || notificationsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build pie data
  const pieData = Object.entries(ordersByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: PIE_COLORS[status] || '#6b7280',
  }));
  const totalStatusOrders = pieData.reduce((sum, d) => sum + d.value, 0);

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue, locale), icon: '💰', trend: kpis.revenueTrend },
    { label: 'Total Orders', value: kpis.orderCount.toString(), icon: '📦', trend: kpis.orderTrend },
    { label: 'Customers', value: kpis.uniqueCustomers.toString(), icon: '👥', trend: kpis.customerTrend },
    { label: 'Visitors', value: kpis.visitorCount.toLocaleString(), icon: '👁️', trend: kpis.visitorTrend },
  ];

  return (
    <div className="space-y-8">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-fg-muted text-sm mt-1">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-1 bg-[#1e1b16] border border-white/10 rounded-xl p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${period === opt.value
                ? 'bg-[#f4c025] text-black'
                : 'text-fg-muted hover:text-white'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards – Stitch Style with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const sparkPaths = [
            'M0 15 Q 10 18, 20 12 T 40 10 T 60 14 T 80 5 L 100 8',
            'M0 8 Q 15 5, 30 12 T 50 15 T 70 8 T 90 12 L 100 10',
            'M0 18 Q 20 15, 40 5 T 60 12 T 80 8 L 100 2',
            'M0 12 Q 15 8, 30 14 T 50 6 T 70 12 T 90 4 L 100 8',
          ];
          const iconColors = [
            { bg: 'bg-primary/10', text: 'text-primary', stroke: '#f4c025' },
            { bg: 'bg-blue-500/10', text: 'text-blue-400', stroke: '#60a5fa' },
            { bg: 'bg-purple-500/10', text: 'text-purple-400', stroke: '#a78bfa' },
            { bg: 'bg-emerald-500/10', text: 'text-emerald-400', stroke: '#34d399' },
          ];
          const iconNames = ['attach_money', 'shopping_bag', 'group', 'visibility'];
          const c = iconColors[i % iconColors.length];
          return (
            <div key={i} className="flex flex-col gap-3 rounded-xl bg-surface-muted p-5 border border-white/5 shadow-lg shadow-black/20">
              <div className="flex justify-between items-start">
                <div className={`rounded-full ${c.bg} p-2 ${c.text}`}>
                  <span className="material-symbols-outlined text-[20px]">{iconNames[i]}</span>
                </div>
                <TrendBadge value={card.trend} />
              </div>
              <div>
                <p className="text-sm font-medium text-fg-muted">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              {/* Sparkline SVG */}
              <div className="h-8 w-full">
                <svg className="h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 20">
                  <defs>
                    <linearGradient id={`sparkGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.stroke} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path d={sparkPaths[i % sparkPaths.length]} fill="none" stroke={c.stroke} strokeWidth="2" />
                  <path d={`${sparkPaths[i % sparkPaths.length]} V 20 H 0 Z`} fill={`url(#sparkGrad${i})`} stroke="none" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Area Chart */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Revenue Overview</h2>
            <p className="text-sm text-fg-faint">Last {PERIOD_OPTIONS.find(p => p.value === period)?.label?.toLowerCase()}</p>
          </div>
          <span className="text-2xl font-bold text-white">{formatCurrency(kpis.totalRevenue, locale)}</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4c025" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f4c025" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `EGP ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#f4c025"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders by Status & Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status Donut */}
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Orders by Status</h2>
          {totalStatusOrders === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-fg-faint text-[13px] gap-3">
              <Inbox className="w-8 h-8 text-white/10" strokeWidth={1.5} />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                      paddingAngle={4}
                      cornerRadius={4}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [value, 'Orders']}
                      contentStyle={{ background: '#2a2520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line react/forbid-dom-props */}
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-sm text-fg-muted">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-fg-faint text-[13px] gap-3">
              <Inbox className="w-8 h-8 text-white/10" strokeWidth={1.5} />
              <p>No product sales yet</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `EGP ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#f4c025" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders – Stitch Card Style */}
      <div className="bg-surface-muted/50 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">View All</Link>
        </div>

        <div className="flex flex-col gap-3">
          {recentOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-fg-faint text-[13px] gap-3">
              <Inbox className="w-8 h-8 text-white/10" strokeWidth={1.5} />
              <p>No recent orders</p>
            </div>
          )}
          {recentOrders.map(order => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl bg-surface-muted border border-white/5 p-4 hover:bg-white/[0.03] active:scale-[0.99] transition-all shadow-md shadow-black/10"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-lighter text-primary/80">
                  <Package className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{order.order_number}</h4>
                  <p className="text-xs text-fg-muted mt-1">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                  {order.status}
                </span>
                <span className="text-xs font-bold text-white">{formatCurrency((order.total || order.total_amount || 0), locale)}</span>
              </div>
            </Link>
          ))}
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
              className="text-sm text-fg-muted hover:text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-fg-faint text-[13px] gap-3">
              <Inbox className="w-8 h-8 text-white/10" strokeWidth={1.5} />
              <p>No inventory alerts</p>
            </div>
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
                    <span className={`text-sm font-medium ${notification.is_read ? 'text-fg-muted' : 'text-white'}`}>
                      {notification.message}
                    </span>
                  </div>
                  <div className="text-xs text-fg-faint ml-6">
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
