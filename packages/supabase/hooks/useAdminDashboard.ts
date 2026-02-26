import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order } from '@lessence/core';

export type DashboardKpis = {
  totalRevenue: number;
  orderCount: number;
  newOrdersCount: number;
  uniqueCustomers: number;
  visitorCount: number;
  revenueTrend: number;
  orderTrend: number;
  customerTrend: number;
  visitorTrend: number;
};

export type ChartDataPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

export type OrderStatusBreakdown = Record<string, number>;

export type TopProduct = {
  name: string;
  revenue: number;
  quantity: number;
};

export function useAdminDashboard(supabase: SupabaseClient, period: string = '30d') {
  const [kpis, setKpis] = useState<DashboardKpis>({
    totalRevenue: 0,
    orderCount: 0,
    newOrdersCount: 0,
    uniqueCustomers: 0,
    visitorCount: 0,
    revenueTrend: 0,
    orderTrend: 0,
    customerTrend: 0,
    visitorTrend: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrderStatusBreakdown>({});
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch KPIs via enhanced RPC
      const { data: metricsData, error: metricsError } = await supabase.rpc(
        'get_admin_dashboard_metrics_v2',
        { p_period: period }
      );

      if (!metricsError && metricsData) {
        setKpis({
          totalRevenue: Number(metricsData.totalRevenue) || 0,
          orderCount: Number(metricsData.orderCount) || 0,
          newOrdersCount: 0,
          uniqueCustomers: Number(metricsData.uniqueCustomers) || 0,
          visitorCount: Number(metricsData.visitorCount) || 0,
          revenueTrend: Number(metricsData.revenueTrend) || 0,
          orderTrend: Number(metricsData.orderTrend) || 0,
          customerTrend: Number(metricsData.customerTrend) || 0,
          visitorTrend: Number(metricsData.visitorTrend) || 0,
        });

        // Parse chart data
        const rawChartData = Array.isArray(metricsData.chartData) ? metricsData.chartData : [];
        const days: ChartDataPoint[] = rawChartData.map((raw: any) => ({
          date: raw.date,
          label: new Date(raw.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Number(raw.revenue) || 0,
          orders: Number(raw.orders) || 0,
        }));
        setChartData(days);

        // Orders by status
        setOrdersByStatus(metricsData.ordersByStatus || {});

        // Top products
        const tp = Array.isArray(metricsData.topProducts) ? metricsData.topProducts : [];
        setTopProducts(tp.map((p: any) => ({
          name: p.name || 'Unknown',
          revenue: Number(p.revenue) || 0,
          quantity: Number(p.quantity) || 0,
        })));
      }

      // 2. Fetch Recent Orders (just 10)
      const { data: orders } = await supabase
        .from('orders')
        .select('id, user_id, order_number, status, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const recent = (orders || []).map(o => ({
        ...o,
        total: Number(o.total_amount || 0),
      }));
      setRecentOrders(recent as Order[]);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { kpis, chartData, ordersByStatus, topProducts, recentOrders, loading, refetch: fetchDashboard };
}
