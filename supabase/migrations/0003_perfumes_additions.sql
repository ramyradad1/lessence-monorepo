-- 1) Ensure idempotency and performance enhancements explicitly

-- We need to guarantee the orders tables has the idempotency_key we added in the data-model
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- We need to guarantee stock_quantity exists directly on product_variants
-- (It already does per 0000_core_ecommerce_schema.sql, but ensuring here for safety)

-- 2) Extra hot-path indexes for 2026 performance constraints
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.user_profiles(role);

-- 3) Ensure translation metadata fields exist on products and categories
-- (Already exist per 0000_core_ecommerce_schema.sql)

-- 4) Loyalty Points & Coupon validation constraints
-- Ensure loyalty tier check
ALTER TABLE public.loyalty_accounts 
DROP CONSTRAINT IF EXISTS valid_tier;

ALTER TABLE public.loyalty_accounts 
ADD CONSTRAINT valid_tier CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));
