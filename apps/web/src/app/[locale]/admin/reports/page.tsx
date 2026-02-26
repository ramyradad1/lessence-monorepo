'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  useAdminReports, 
  useCategories,
  OrdersSummary,
} from '@lessence/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from 'recharts';

type ReportRow = {
  report_date?: string;
  revenue?: number;
  orders_count?: number;
  product_name?: string;
  total_quantity?: number;
  total_revenue?: number;
  category_name?: string;
  customer_name?: string;
  email?: string;
  order_count?: number;
  total_spend?: number;
  [key: string]: string | number | null | undefined;
};

type ReportType = 'sales' | 'products' | 'categories' | 'orders' | 'customers';

const REPORT_TYPES: { id: ReportType; label: string; icon: string }[] = [
  { id: 'sales', label: 'Sales Report', icon: '💰' },
  { id: 'products', label: 'Best Sellers', icon: '🧴' },
  { id: 'categories', label: 'Top Categories', icon: '📁' },
  { id: 'orders', label: 'Orders Summary', icon: '📦' },
  { id: 'customers', label: 'Top Customers', icon: '👥' },
];

const CHART_COLORS = ['#f4c025', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#06b6d4', '#ec4899'];

interface PayloadItem {
  color: string;
  name: string;
  value: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#2a2520] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-fg-muted mb-1">{label}</p>
      {/* eslint-disable-next-line react/forbid-dom-props */}
      {payload.map((p: PayloadItem, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'Orders' ? `EGP ${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { categories } = useCategories(supabase);
  const { 
    loading, 
    getSalesReport, 
    getBestSellingProducts, 
    getBestCategories, 
    getOrdersSummary, 
    getTopCustomers 
  } = useAdminReports(supabase);

  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    categoryId: '',
  });

  const [reportData, setReportData] = useState<ReportRow[] | null>(null);
  const [summaryData, setSummaryData] = useState<OrdersSummary | null>(null);

  const fetchReport = async () => {
    const filterParams = {
      startDate: new Date(filters.startDate).toISOString(),
      endDate: new Date(filters.endDate + 'T23:59:59').toISOString(),
      status: filters.status || undefined,
      categoryId: filters.categoryId || undefined,
    };

    let data: unknown = null;
    switch (activeReport) {
      case 'sales':
        data = await getSalesReport(filterParams);
        break;
      case 'products':
        data = await getBestSellingProducts(filterParams);
        break;
      case 'categories':
        data = await getBestCategories(filterParams);
        break;
      case 'orders':
        data = await getOrdersSummary(filterParams);
        break;
      case 'customers':
        data = await getTopCustomers(filterParams);
        break;
    }
    setReportData(Array.isArray(data) ? (data as ReportRow[]) : null);
    if (activeReport === 'orders') {
      setSummaryData((data as OrdersSummary) || null);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport, filters]);

  const exportToCSV = () => {
    if (!reportData && activeReport !== 'orders') return;

    let csvContent = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataToExport: Record<string, any>[] = reportData || [];
    
    if (activeReport === 'orders' && summaryData) {
      dataToExport = [
        { Metric: 'Total Revenue', Value: summaryData.total_revenue },
        { Metric: 'Order Count', Value: summaryData.order_count },
        { Metric: 'Avg Order Value', Value: summaryData.avg_order_value },
        ...Object.entries(summaryData.status_breakdown).map(([status, count]) => ({
          Metric: `Status: ${status}`,
          Value: count
        }))
      ];
    }

    if (dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]);
    csvContent += headers.join(",") + "\n";

    dataToExport.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvContent += values.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeReport}_report_${filters.startDate}_to_${filters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data for visualizations
  const salesChartData = activeReport === 'sales' && reportData ? reportData.map(r => ({
    date: r.report_date ? new Date(r.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    revenue: Number(r.revenue ?? 0),
    orders: Number(r.orders_count ?? 0),
  })) : [];

  const productsChartData = activeReport === 'products' && reportData ? reportData.slice(0, 10).map(r => ({
    name: (r.product_name || 'Unknown').length > 20 ? (r.product_name || 'Unknown').slice(0, 18) + '…' : (r.product_name || 'Unknown'),
    revenue: Number(r.total_revenue ?? 0),
    quantity: Number(r.total_quantity ?? 0),
  })) : [];

  const categoriesChartData = activeReport === 'categories' && reportData ? reportData.map(r => ({
    name: r.category_name || 'Unknown',
    value: Number(r.total_revenue ?? 0),
  })) : [];

  const statusPieData = activeReport === 'orders' && summaryData?.status_breakdown
    ? Object.entries(summaryData.status_breakdown).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Reports</h1>
          <p className="text-fg-muted text-sm mt-1">Analyze your store performance and export data</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={loading || (!reportData && activeReport !== 'orders')}
          className="bg-[#f4c025] hover:bg-[#d4a015] disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 text-sm justify-center"
        >
          <span>📥</span> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label htmlFor="report-start-date" className="text-xs font-semibold text-fg-faint uppercase tracking-wider">Start Date</label>
            <input
              id="report-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="report-end-date" className="text-xs font-semibold text-fg-faint uppercase tracking-wider">End Date</label>
            <input
              id="report-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="report-status" className="text-xs font-semibold text-fg-faint uppercase tracking-wider">Status</label>
            <select
              id="report-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="report-category" className="text-xs font-semibold text-fg-faint uppercase tracking-wider">Category</label>
            <select
              id="report-category"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {REPORT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveReport(type.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeReport === type.id
                ? 'bg-[#f4c025] text-black'
              : 'bg-[#1e1b16] text-fg-muted hover:text-white border border-white/5'
            }`}
          >
            <span>{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
            <p className="text-fg-faint text-sm animate-pulse">Generating report...</p>
          </div>
        ) : (
            <div className="p-6 space-y-8">
              {/* === INLINE CHARTS === */}
              {activeReport === 'sales' && salesChartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Area Chart */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">Revenue Trend</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesChartData}>
                          <defs>
                            <linearGradient id="salesRevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f4c025" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f4c025" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `EGP ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f4c025" strokeWidth={2} fill="url(#salesRevGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Orders Bar Chart */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">Daily Orders</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'products' && productsChartData.length > 0 && (
                <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">Top Products by Revenue</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productsChartData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `EGP ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} width={150} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#f4c025" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeReport === 'categories' && categoriesChartData.length > 0 && (
                <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">Category Revenue Distribution</h3>
                  <div className="flex items-center gap-8">
                    <div className="w-56 h-56 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoriesChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={0}>
                            {categoriesChartData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          {/* eslint-disable-next-line react/forbid-dom-props */}
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`EGP ${Number(value).toLocaleString()}`, 'Revenue']}
                            contentStyle={{ background: '#2a2520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {categoriesChartData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-sm text-fg-muted">{d.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">EGP {d.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'orders' && summaryData && statusPieData.length > 0 && (
                <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                      <p className="text-xs font-semibold text-fg-faint uppercase tracking-wider mb-2">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">EGP {summaryData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                      <p className="text-xs font-semibold text-fg-faint uppercase tracking-wider mb-2">Total Orders</p>
                    <p className="text-3xl font-bold text-white">{summaryData.order_count}</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                      <p className="text-xs font-semibold text-fg-faint uppercase tracking-wider mb-2">Avg Order Value</p>
                      <p className="text-3xl font-bold text-white">EGP {summaryData.avg_order_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wider mb-4">Status Distribution</h3>
                    <div className="flex items-center gap-8">
                      <div className="w-48 h-48 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" strokeWidth={0}>
                              {statusPieData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            {/* eslint-disable-next-line react/forbid-dom-props */}
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
                        {statusPieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line react/forbid-dom-props */}
                              <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-sm text-fg-muted">{d.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-white">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === DATA TABLE (below charts) === */}
              {activeReport !== 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      {activeReport === 'sales' && (
                        <>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Date</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Revenue</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Orders</th>
                        </>
                      )}
                      {activeReport === 'products' && (
                        <>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Product</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Qty Sold</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Total Revenue</th>
                        </>
                      )}
                      {activeReport === 'categories' && (
                        <>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Category</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Qty Sold</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Total Revenue</th>
                        </>
                      )}
                      {activeReport === 'customers' && (
                        <>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Customer</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Email</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Orders</th>
                            <th className="pb-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Total Spend</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {!reportData || reportData.length === 0 ? (
                      <tr>
                          <td colSpan={10} className="py-12 text-center text-fg-faint italic">No data found for this period</td>
                      </tr>
                    ) : (
                      reportData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          {activeReport === 'sales' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.report_date ? new Date(row.report_date).toLocaleDateString() : '-'}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">EGP {Number(row.revenue ?? 0).toLocaleString()}</td>
                              <td className="py-4 text-right text-sm text-fg-muted">{Number(row.orders_count ?? 0)}</td>
                            </>
                          )}
                          {activeReport === 'products' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.product_name || '-'}</td>
                              <td className="py-4 text-right text-sm text-fg-muted">{Number(row.total_quantity ?? 0)}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">EGP {Number(row.total_revenue ?? 0).toLocaleString()}</td>
                            </>
                          )}
                          {activeReport === 'categories' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.category_name || '-'}</td>
                              <td className="py-4 text-right text-sm text-fg-muted">{Number(row.total_quantity ?? 0)}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">EGP {Number(row.total_revenue ?? 0).toLocaleString()}</td>
                            </>
                          )}
                          {activeReport === 'customers' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.customer_name || '-'}</td>
                              <td className="py-4 text-sm text-fg-muted">{row.email || '-'}</td>
                              <td className="py-4 text-right text-sm text-fg-muted">{Number(row.order_count ?? 0)}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">EGP {Number(row.total_spend ?? 0).toLocaleString()}</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
