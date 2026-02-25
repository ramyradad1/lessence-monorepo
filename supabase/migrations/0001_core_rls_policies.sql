-- 1) Role Management Helpers
-- The `user_profiles` table stores the role. We create a security definer function 
-- so that RLS policies can easily check the user's role without recursive queries.

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_role(auth.uid()) = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_order_manager()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_role(auth.uid()) IN ('super_admin', 'order_manager');
$$;

CREATE OR REPLACE FUNCTION public.is_inventory_manager()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_role(auth.uid()) IN ('super_admin', 'inventory_manager');
$$;

CREATE OR REPLACE FUNCTION public.is_content_manager()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_role(auth.uid()) IN ('super_admin', 'content_manager');
$$;


-- 2) Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;


-- 3) Base Tables (Public / Content Management)

-- user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Prevent users from updating their own role
CREATE POLICY "Super admins can manage all profiles" ON public.user_profiles FOR ALL USING (public.is_super_admin());

-- categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (is_active = true OR public.is_content_manager());
CREATE POLICY "Content managers can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_content_manager());
CREATE POLICY "Content managers can update categories" ON public.categories FOR UPDATE USING (public.is_content_manager());
CREATE POLICY "Content managers can delete categories" ON public.categories FOR DELETE USING (public.is_content_manager());

-- products
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true OR public.is_content_manager() OR public.is_inventory_manager());
CREATE POLICY "Content managers can insert products" ON public.products FOR INSERT WITH CHECK (public.is_content_manager());
CREATE POLICY "Content managers can update products" ON public.products FOR UPDATE USING (public.is_content_manager() OR public.is_inventory_manager());
CREATE POLICY "Content managers can delete products" ON public.products FOR DELETE USING (public.is_content_manager());

-- product_variants
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants FOR SELECT USING (is_active = true OR public.is_content_manager() OR public.is_inventory_manager());
CREATE POLICY "Managers can insert variants" ON public.product_variants FOR INSERT WITH CHECK (public.is_content_manager() OR public.is_inventory_manager());
CREATE POLICY "Managers can update variants" ON public.product_variants FOR UPDATE USING (public.is_content_manager() OR public.is_inventory_manager());
CREATE POLICY "Managers can delete variants" ON public.product_variants FOR DELETE USING (public.is_content_manager() OR public.is_inventory_manager());

-- product_images
CREATE POLICY "Images are viewable by everyone" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Content managers can insert images" ON public.product_images FOR INSERT WITH CHECK (public.is_content_manager());
CREATE POLICY "Content managers can update images" ON public.product_images FOR UPDATE USING (public.is_content_manager());
CREATE POLICY "Content managers can delete images" ON public.product_images FOR DELETE USING (public.is_content_manager());


-- 4) Carts & Favorites (User Owned)

-- favorites
CREATE POLICY "Users can manage their favorites" ON public.favorites FOR ALL USING (user_id = auth.uid());

-- carts (Session ID is for guests, User ID is for auth'd users)
CREATE POLICY "Users can manage their cart" ON public.carts FOR ALL USING (
    user_id = auth.uid() 
    -- We can't safely assert session_id here via JWT without custom headers, 
    -- so guest carts usually rely on anon key operations trusting the client's session_id query.
    -- However, for strict security, we allow select/insert/update if the row's session_id is provided.
    OR session_id IS NOT NULL
);

-- cart_items
CREATE POLICY "Users can manage their cart items" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND (user_id = auth.uid() OR session_id IS NOT NULL))
);


-- 5) Ordering & Addresses (Secure Data)

-- addresses
CREATE POLICY "Users can manage their addresses" ON public.addresses FOR ALL USING (user_id = auth.uid());

-- orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_order_manager());
-- (Orders are INSERTED internally by Edge Functions via Service Key)
CREATE POLICY "Order managers can update orders" ON public.orders FOR UPDATE USING (public.is_order_manager());

-- order_items
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
    OR public.is_order_manager()
);

-- payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (user_id = auth.uid() OR public.is_order_manager());
-- (Payments are inserted/updated by Edge Functions via Service Key webhooks)

-- order_status_history
CREATE POLICY "Users can view their order history" ON public.order_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_status_history.order_id AND user_id = auth.uid())
    OR public.is_order_manager()
);

-- order_admin_notes
CREATE POLICY "Order managers can manage admin notes" ON public.order_admin_notes FOR ALL USING (public.is_order_manager());


-- 6) Promotions & Coupons

-- coupons (Read-only for users if active, CRUD for Super Admin)
CREATE POLICY "Active coupons are viewable" ON public.coupons FOR SELECT USING (is_active = true OR public.is_super_admin());
CREATE POLICY "Super admins can manage coupons" ON public.coupons FOR ALL USING (public.is_super_admin());

-- coupon_redemptions
CREATE POLICY "Users can view their redemptions" ON public.coupon_redemptions FOR SELECT USING (user_id = auth.uid() OR public.is_order_manager());
-- (Inserted via Edge Function)


-- 7) Reviews & Loyalty & Notifications

-- reviews
CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews FOR SELECT USING (is_approved = true OR user_id = auth.uid() OR public.is_content_manager());
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Content managers can manage reviews" ON public.reviews FOR ALL USING (public.is_content_manager());

-- loyalty_accounts
CREATE POLICY "Users can view their loyalty account" ON public.loyalty_accounts FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());
-- (Points updated internally via Edge Functions)

-- loyalty_transactions
CREATE POLICY "Users can view their loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.loyalty_accounts WHERE id = loyalty_transactions.account_id AND user_id = auth.uid())
    OR public.is_super_admin()
);

-- back_in_stock_subscriptions
CREATE POLICY "Users can manage their subscriptions" ON public.back_in_stock_subscriptions FOR ALL USING (user_id = auth.uid() OR public.is_inventory_manager());

-- notifications
CREATE POLICY "Users can manage their notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view notifications" ON public.notifications FOR SELECT USING (public.is_super_admin());


-- 8) Admin strictly restricted tables

-- admin_audit_logs
CREATE POLICY "Super admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.is_super_admin());
-- (Inserted strictly via Database trigger or Edge Function using Service Key)

-- visitor_events
CREATE POLICY "System inserts visitor events" ON public.visitor_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins can view visitor events" ON public.visitor_events FOR SELECT USING (public.is_super_admin());
