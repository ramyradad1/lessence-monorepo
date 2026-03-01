"use client";

import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export type SalesReportData = {
  report_date: string;
  revenue: number;
  orders_count: number;
};

export type BestSellingProduct = {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
};

export type BestCategory = {
  category_id: string;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
};

export type OrdersSummary = {
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  status_breakdown: Record<string, number>;
};

export type TopCustomer = {
  user_id: string;
  customer_name: string;
  email: string;
  order_count: number;
  total_spend: number;
};

export type ReportFilters = {
  startDate: string;
  endDate: string;
  status?: string;
  categoryId?: string;
};

export function useAdminReports(supabase: SupabaseClient) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSalesReport = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_sales_report', {
        start_date: filters.startDate,
        end_date: filters.endDate,
        status_filter: filters.status || null,
        category_filter: filters.categoryId || null,
      });

      if (rpcError) throw rpcError;
      return data as SalesReportData[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const getBestSellingProducts = useCallback(async (filters: ReportFilters, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_best_selling_products', {
        start_date: filters.startDate,
        end_date: filters.endDate,
        limit_count: limit,
        status_filter: filters.status || null,
        category_filter: filters.categoryId || null,
      });

      if (rpcError) throw rpcError;
      return data as BestSellingProduct[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const getBestCategories = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_best_categories', {
        start_date: filters.startDate,
        end_date: filters.endDate,
        status_filter: filters.status || null,
      });

      if (rpcError) throw rpcError;
      return data as BestCategory[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const getOrdersSummary = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_orders_summary', {
        start_date: filters.startDate,
        end_date: filters.endDate,
        category_filter: filters.categoryId || null,
      });

      if (rpcError) throw rpcError;
      return (data?.[0] || {
        total_revenue: 0,
        order_count: 0,
        avg_order_value: 0,
        status_breakdown: {},
      }) as OrdersSummary;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const getTopCustomers = useCallback(async (filters: ReportFilters, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_top_customers', {
        start_date: filters.startDate,
        end_date: filters.endDate,
        limit_count: limit,
        status_filter: filters.status || null,
      });

      if (rpcError) throw rpcError;
      return data as TopCustomer[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    loading,
    error,
    getSalesReport,
    getBestSellingProducts,
    getBestCategories,
    getOrdersSummary,
    getTopCustomers,
  };
}
