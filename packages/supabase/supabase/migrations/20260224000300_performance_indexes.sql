-- Add missing indexes based on Supabase Performance Advisor 'unindexed_foreign_keys' warnings
DO $$
DECLARE
    idx_record RECORD;
BEGIN
    FOR idx_record IN (
        SELECT t_name, c_name FROM (VALUES
            ('addresses', 'user_id'),
            ('admin_audit_logs', 'admin_id'),
            ('back_in_stock_subscriptions', 'variant_id'),
            ('bundle_items', 'bundle_id'),
            ('bundle_items', 'product_id'),
            ('bundle_items', 'variant_id'),
            ('cart_items', 'cart_id'),
            ('cart_items', 'product_id'),
            ('cart_items', 'variant_id'),
            ('carts', 'user_id'),
            ('coupon_redemptions', 'coupon_id'),
            ('coupon_redemptions', 'order_id'),
            ('coupon_redemptions', 'user_id'),
            ('loyalty_accounts', 'user_id'),
            ('loyalty_transactions', 'account_id'),
            ('loyalty_transactions', 'order_id'),
            ('notifications', 'user_id'),
            ('order_items', 'order_id'),
            ('order_items', 'product_id'),
            ('order_items', 'variant_id'),
            ('orders', 'user_id'),
            ('orders', 'coupon_id'),
            ('product_variants', 'product_id'),
            ('return_requests', 'order_id'),
            ('guest_favorites', 'product_id'),
            ('guest_cart_items', 'guest_cart_id'),
            ('guest_cart_items', 'product_id')
        ) AS v(t_name, c_name)
    )
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = idx_record.t_name AND column_name = idx_record.c_name) THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_%s ON public.%I(%I)', idx_record.t_name, idx_record.c_name, idx_record.t_name, idx_record.c_name);
        END IF;
    END LOOP;
END $$;

-- Drop unused indexes based on Supabase Performance Advisor 'unused_index' warnings
DROP INDEX IF EXISTS public.idx_price_history_product;
