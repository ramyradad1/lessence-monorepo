-- Migration: Advanced Promos Schema

-- 1. Modify the `coupons` table to support new rules
-- First, drop the existing check constraint on discount_type
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;

-- Add new constraints and fields
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS min_order_amount numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_order_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS per_user_limit integer,
  ADD CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping'));

-- Fix discount_amount constraint (free_shipping might have amount 0)
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_amount_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_amount_check CHECK (discount_amount >= 0);

-- 2. Create `coupon_redemptions` table to track usage per user
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid REFERENCES public.coupons ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,     -- Can be NULL for guest checkout if we ever support guest coupons
  order_id uuid REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" 
ON public.coupon_redemptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert redemptions" 
ON public.coupon_redemptions FOR INSERT 
WITH CHECK (true); -- Usually called securely via Edge Functions

CREATE POLICY "Admins can manage all redemptions" 
ON public.coupon_redemptions FOR ALL 
USING (is_admin());
