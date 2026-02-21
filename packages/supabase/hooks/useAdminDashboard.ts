import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderItem } from '@lessence/core';

export type DashboardKpis = {
  totalRevenue: number;
  orderCount: number;
  newOrdersCount: number;
  uniqueCustomers: number;
  visitorCount: number;
};

export type ChartDataPoint = {
  date: string;
  label: string;
  revenue: number;
};

export function useAdminDashboard(supabase: SupabaseClient) {
  const [kpis, setKpis] = useState<DashboardKpis>({
    totalRevenue: 0,
    orderCount: 0,
    newOrdersCount: 0,
    uniqueCustomers: 0,
    visitorCount: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all orders for KPIs
      const { data: orders } = await supabase
        .from('orders')
        .select('id, user_id, order_number, status, total_amount, created_at')
        .order('created_at', { ascending: false });

      const allOrders = orders || [];

      // KPIs
      const totalRevenue = allOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
      const orderCount = allOrders.length;
      const newOrdersCount = allOrders.filter(o => o.status === 'pending' || o.status === 'paid').length;
      const uniqueCustomers = new Set(allOrders.map(o => o.user_id).filter(Boolean)).size;

      // Visitor count from visitor_events (unique sessions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: visitorCount } = await supabase
        .from('visitor_events')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      setKpis({
        totalRevenue,
        orderCount,
        newOrdersCount,
        uniqueCustomers,
        visitorCount: visitorCount || 0,
      });

      // Last 7 days chart data
      const days: ChartDataPoint[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayRevenue = allOrders
          .filter(o => o.created_at?.startsWith(dateStr))
          .reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
        days.push({ date: dateStr, label: dayNames[d.getDay()], revenue: dayRevenue });
      }
      setChartData(days);

      // Recent orders (first 10)
      const recent = allOrders.slice(0, 10).map(o => ({
        ...o,
        total: Number(o.total_amount || 0),
      }));
      setRecentOrders(recent as Order[]);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { kpis, chartData, recentOrders, loading, refetch: fetchDashboard };
}
