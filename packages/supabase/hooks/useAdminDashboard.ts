import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order } from '@lessence/core';

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
      // 1. Fetch KPIs and chartData via RPC
      const { data: metricsData, error: metricsError } = await supabase.rpc('get_admin_dashboard_metrics');
      
      if (!metricsError && metricsData) {
        setKpis({
          totalRevenue: Number(metricsData.totalRevenue) || 0,
          orderCount: Number(metricsData.orderCount) || 0,
          newOrdersCount: Number(metricsData.newOrdersCount) || 0,
          uniqueCustomers: Number(metricsData.uniqueCustomers) || 0,
          visitorCount: Number(metricsData.visitorCount) || 0,
        });

        // Parse chart data and map to day labels
        const rawChartData = Array.isArray(metricsData.chartData) ? metricsData.chartData : [];
        const days: ChartDataPoint[] = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Fill last 7 days even if no sales
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          const existingData = rawChartData.find((raw: any) => raw.date === dateStr);
          days.push({ 
            date: dateStr, 
            label: dayNames[d.getDay()], 
            revenue: existingData ? Number(existingData.sales) : 0 
          });
        }
        setChartData(days);
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
  }, [supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { kpis, chartData, recentOrders, loading, refetch: fetchDashboard };
}
