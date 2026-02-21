'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  useAdminReports, 
  useCategories,
  SalesReportData,
  BestSellingProduct,
  BestCategory,
  OrdersSummary,
  TopCustomer
} from '@lessence/supabase';
import { OrderStatus } from '@lessence/core';

type ReportType = 'sales' | 'products' | 'categories' | 'orders' | 'customers';

const REPORT_TYPES: { id: ReportType; label: string; icon: string }[] = [
  { id: 'sales', label: 'Sales Report', icon: '💰' },
  { id: 'products', label: 'Best Sellers', icon: '🧴' },
  { id: 'categories', label: 'Top Categories', icon: '📁' },
  { id: 'orders', label: 'Orders Summary', icon: '📦' },
  { id: 'customers', label: 'Top Customers', icon: '👥' },
];

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

  const [reportData, setReportData] = useState<any[] | null>(null);
  const [summaryData, setSummaryData] = useState<OrdersSummary | null>(null);

  const fetchReport = async () => {
    const filterParams = {
      startDate: new Date(filters.startDate).toISOString(),
      endDate: new Date(filters.endDate + 'T23:59:59').toISOString(),
      status: filters.status || undefined,
      categoryId: filters.categoryId || undefined,
    };

    let data: any = null;
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
    setReportData(Array.isArray(data) ? data : null);
    if (activeReport === 'orders') {
      setSummaryData(data);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, filters]);

  const exportToCSV = () => {
    if (!reportData && activeReport !== 'orders') return;

    let csvContent = "";
    let dataToExport = reportData || [];
    
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Reports</h1>
          <p className="text-white/40 text-sm mt-1">Analyze your store performance and export data</p>
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
            <label htmlFor="report-start-date" className="text-xs font-semibold text-white/30 uppercase tracking-wider">Start Date</label>
            <input
              id="report-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="report-end-date" className="text-xs font-semibold text-white/30 uppercase tracking-wider">End Date</label>
            <input
              id="report-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="report-status" className="text-xs font-semibold text-white/30 uppercase tracking-wider">Status</label>
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
            <label htmlFor="report-category" className="text-xs font-semibold text-white/30 uppercase tracking-wider">Category</label>
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
                : 'bg-[#1e1b16] text-white/60 hover:text-white border border-white/5'
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
            <p className="text-white/30 text-sm animate-pulse">Generating report...</p>
          </div>
        ) : (
          <div className="p-6">
            {activeReport === 'orders' && summaryData ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">${summaryData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Total Orders</p>
                    <p className="text-3xl font-bold text-white">{summaryData.order_count}</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Avg Order Value</p>
                    <p className="text-3xl font-bold text-white">${summaryData.avg_order_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Status Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {Object.entries(summaryData.status_breakdown || {}).map(([status, count]) => (
                      <div key={status} className="bg-black/10 border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-[10px] font-bold uppercase text-white/20 mb-1">{status}</p>
                        <p className="text-xl font-bold text-white">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      {activeReport === 'sales' && (
                        <>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Date</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Revenue</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Orders</th>
                        </>
                      )}
                      {activeReport === 'products' && (
                        <>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Product</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Qty Sold</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Total Revenue</th>
                        </>
                      )}
                      {activeReport === 'categories' && (
                        <>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Category</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Qty Sold</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Total Revenue</th>
                        </>
                      )}
                      {activeReport === 'customers' && (
                        <>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Customer</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Email</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Orders</th>
                          <th className="pb-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Total Spend</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {!reportData || reportData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-white/20 italic">No data found for this period</td>
                      </tr>
                    ) : (
                      reportData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          {activeReport === 'sales' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{new Date(row.report_date).toLocaleDateString()}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">${row.revenue.toLocaleString()}</td>
                              <td className="py-4 text-right text-sm text-white/50">{row.orders_count}</td>
                            </>
                          )}
                          {activeReport === 'products' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.product_name}</td>
                              <td className="py-4 text-right text-sm text-white/50">{row.total_quantity}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">${row.total_revenue.toLocaleString()}</td>
                            </>
                          )}
                          {activeReport === 'categories' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.category_name}</td>
                              <td className="py-4 text-right text-sm text-white/50">{row.total_quantity}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">${row.total_revenue.toLocaleString()}</td>
                            </>
                          )}
                          {activeReport === 'customers' && (
                            <>
                              <td className="py-4 text-sm font-medium text-white">{row.customer_name}</td>
                              <td className="py-4 text-sm text-white/40">{row.email}</td>
                              <td className="py-4 text-right text-sm text-white/50">{row.order_count}</td>
                              <td className="py-4 text-right text-sm font-bold text-[#f4c025]">${row.total_spend.toLocaleString()}</td>
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
