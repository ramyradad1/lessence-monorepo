-- Performance Optimization Migration

-- 1. Create missing indexes for better performance, pagination and sorting
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON public.visitor_events(session_id);

-- 2. Restrict Realtime Publication
-- Drop the realtime publication if it exists to reset
DROP PUBLICATION IF EXISTS supabase_realtime;
-- Recreate it safely
CREATE PUBLICATION supabase_realtime;
-- Add only tables that need realtime updates to avoid unnecessary load
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Enhance Admin Dashboard Metrics RPC
-- This prevents clients from having to SELECT * from orders by doing all KPI arithmetic directly on Postgres.
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sales DECIMAL;
    v_total_orders INT;
    v_new_orders INT;
    v_unique_customers INT;
    v_visitor_count INT;
    v_recent_sales JSONB;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_sales FROM public.orders WHERE status IN ('paid', 'processing', 'shipped', 'delivered');
    SELECT COUNT(*) INTO v_total_orders FROM public.orders WHERE status != 'cancelled';
    SELECT COUNT(*) INTO v_new_orders FROM public.orders WHERE status IN ('pending', 'paid');
    
    SELECT COUNT(DISTINCT user_id) INTO v_unique_customers FROM public.orders WHERE user_id IS NOT NULL;
    
    -- Count unique sessions from the last 30 days
    -- Using session_id instead of IP guarantees more accurate usage patterns
    SELECT COUNT(DISTINCT session_id) INTO v_visitor_count FROM public.visitor_events WHERE created_at >= NOW() - INTERVAL '30 days';
    
    -- Get sales for the last 7 days grouped by date
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date_trunc('day', created_at)::date,
            'sales', sum(total_amount)
        )
    ) INTO v_recent_sales
    FROM public.orders
    WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY date_trunc('day', created_at)::date
    ORDER BY date_trunc('day', created_at)::date;

    RETURN jsonb_build_object(
        'totalRevenue', v_total_sales,
        'orderCount', v_total_orders,
        'newOrdersCount', v_new_orders,
        'uniqueCustomers', v_unique_customers,
        'visitorCount', v_visitor_count,
        'chartData', COALESCE(v_recent_sales, '[]'::jsonb)
    );
END;
$$;
