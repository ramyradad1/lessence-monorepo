-- Migration: 20260225171224_notification_system.sql
-- Notification and Alerts System implementation

-- 1) Initialize notification settings in store_settings
INSERT INTO public.store_settings (key, value)
VALUES (
  'notifications', 
  '{
    "email_enabled": true,
    "push_enabled": true,
    "low_stock_threshold": 5,
    "alerts": {
      "order_update": true,
      "back_in_stock": true,
      "low_stock_admin": true,
      "price_drop": false
    },
    "templates": {
      "back_in_stock": {
        "en": "Good news! {product_name} is back in stock.",
        "ar": "أخبار سارة! {product_name} متوفر الآن."
      },
      "order_shipped": {
        "en": "Your order {order_number} has been shipped.",
        "ar": "تم شحن طلبك {order_number}."
      }
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 2) notifications table (if it doesn't exist already)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_ar TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'order_update', 'promo', 'back_in_stock'
    data JSONB, -- additional payload if needed (e.g. { "product_id": "...", "order_id": "..." })
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark read)" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Admin full access notifications" 
    ON public.notifications FOR ALL 
    USING (public.is_admin());

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- 3) back_in_stock_subscriptions table (if it doesn't exist already)
CREATE TABLE IF NOT EXISTS public.back_in_stock_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT email_or_user_bis CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE TRIGGER update_bis_updated_at BEFORE UPDATE ON public.back_in_stock_subscriptions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- RLS for back_in_stock_subscriptions
ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own back-in-stock subscriptions" 
    ON public.back_in_stock_subscriptions FOR ALL 
    USING (auth.uid() = user_id);
    
-- Allow public insert if email is provided, but no select/update
CREATE POLICY "Public can insert email subscriptions" 
    ON public.back_in_stock_subscriptions FOR INSERT 
    WITH CHECK (email IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Admin full access back in stock" 
    ON public.back_in_stock_subscriptions FOR ALL 
    USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bis_product ON public.back_in_stock_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_bis_variant ON public.back_in_stock_subscriptions(variant_id);
CREATE INDEX IF NOT EXISTS idx_bis_status ON public.back_in_stock_subscriptions(status) WHERE status = 'pending';


-- 4) RPCs for Notification Logic

-- View/RPC for Low Stock Alerts
CREATE OR REPLACE FUNCTION public.get_low_stock_variants()
RETURNS TABLE (
    variant_id UUID,
    product_id UUID,
    sku TEXT,
    product_name_en TEXT,
    product_name_ar TEXT,
    size_ml INT,
    stock_quantity INT,
    threshold INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    global_threshold INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Extract global threshold from store_settings, default to 5
    SELECT COALESCE((value->>'low_stock_threshold')::INT, 5) INTO global_threshold 
    FROM public.store_settings 
    WHERE key = 'notifications';

    RETURN QUERY
    SELECT 
        v.id as variant_id,
        p.id as product_id,
        v.sku,
        p.name_en as product_name_en,
        p.name_ar as product_name_ar,
        v.size_ml,
        v.stock_quantity,
        COALESCE(v.low_stock_threshold, global_threshold) as threshold
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.is_active = true 
      AND p.is_active = true
      AND v.stock_quantity <= COALESCE(v.low_stock_threshold, global_threshold)
    ORDER BY v.stock_quantity ASC;
END;
$$;


-- RPC to create a localized notification
CREATE OR REPLACE FUNCTION public.create_localized_notification(
    p_user_id UUID,
    p_type TEXT,
    p_template_key TEXT,
    p_placeholders JSONB DEFAULT '{}'::jsonb,
    p_custom_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template_en TEXT;
    v_template_ar TEXT;
    v_body_en TEXT;
    v_body_ar TEXT;
    v_title_en TEXT;
    v_title_ar TEXT;
    v_key TEXT;
    v_val TEXT;
    v_notification_id UUID;
    v_enabled BOOLEAN;
BEGIN
    -- Check if notifications of this type are enabled in settings
    SELECT COALESCE((value->'alerts'->>p_type)::BOOLEAN, true) INTO v_enabled
    FROM public.store_settings 
    WHERE key = 'notifications';

    IF NOT v_enabled THEN
        RETURN NULL; -- Silent ignore if disabled in admin
    END IF;

    -- Fetch templates
    SELECT 
        COALESCE(value->'templates'->p_template_key->>'en', 'Notification') INTO v_template_en
    FROM public.store_settings WHERE key = 'notifications';
    
    SELECT 
        COALESCE(value->'templates'->p_template_key->>'ar', 'إشعار') INTO v_template_ar
    FROM public.store_settings WHERE key = 'notifications';

    -- Parse title and body (basic format assumption: Title | Body, or just body if no pipe)
    -- If no pipe, we use a generic title
    IF strpos(v_template_en, '|') > 0 THEN
        v_title_en := trim(split_part(v_template_en, '|', 1));
        v_body_en := trim(split_part(v_template_en, '|', 2));
    ELSE
        v_title_en := 'Update';
        v_body_en := v_template_en;
    END IF;

    IF strpos(v_template_ar, '|') > 0 THEN
        v_title_ar := trim(split_part(v_template_ar, '|', 1));
        v_body_ar := trim(split_part(v_template_ar, '|', 2));
    ELSE
        v_title_ar := 'تحديث';
        v_body_ar := v_template_ar;
    END IF;

    -- Replace placeholders
    FOR v_key, v_val IN SELECT key, value#>>'{}' FROM jsonb_each(p_placeholders)
    LOOP
        v_title_en := replace(v_title_en, '{' || v_key || '}', COALESCE(v_val, ''));
        v_body_en := replace(v_body_en, '{' || v_key || '}', COALESCE(v_val, ''));
        
        v_title_ar := replace(v_title_ar, '{' || v_key || '}', COALESCE(v_val, ''));
        v_body_ar := replace(v_body_ar, '{' || v_key || '}', COALESCE(v_val, ''));
    END LOOP;

    -- Insert notification
    INSERT INTO public.notifications (
        user_id, title_en, title_ar, body_en, body_ar, type, data
    ) VALUES (
        p_user_id, v_title_en, v_title_ar, v_body_en, v_body_ar, p_type, p_custom_data
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;


-- RPC to process back-in-stock subscriptions for a variant
CREATE OR REPLACE FUNCTION public.process_back_in_stock(p_variant_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock INT;
    v_product_name_en TEXT;
    v_product_name_ar TEXT;
    v_processed_count INT := 0;
    sub RECORD;
BEGIN
    -- Check if admin triggered or internal trigger (allowed for both)
    
    -- Verify stock
    SELECT v.stock_quantity, p.name_en, p.name_ar 
    INTO v_stock, v_product_name_en, v_product_name_ar
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = p_variant_id;

    IF v_stock IS NULL OR v_stock <= 0 THEN
        RETURN 0;
    END IF;

    -- Find pending subscriptions
    FOR sub IN 
        SELECT id, user_id, email, product_id 
        FROM public.back_in_stock_subscriptions 
        WHERE variant_id = p_variant_id AND status = 'pending'
    LOOP
        -- If user is registered, create a notification
        IF sub.user_id IS NOT NULL THEN
            PERFORM public.create_localized_notification(
                sub.user_id,
                'back_in_stock',
                'back_in_stock',
                jsonb_build_object('product_name', v_product_name_en), 
                jsonb_build_object('product_id', sub.product_id, 'variant_id', p_variant_id)
            );
        END IF;

        -- In a real app, you would also trigger an email sending Edge Function here
        -- e.g., using pg_net or an external worker queue for `sub.email`

        -- Mark as notified
        UPDATE public.back_in_stock_subscriptions 
        SET status = 'notified', updated_at = now() 
        WHERE id = sub.id;

        v_processed_count := v_processed_count + 1;
    END LOOP;

    -- Audit log if admin triggered
    IF public.is_admin() AND v_processed_count > 0 THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, entity_type, entity_id, new_data)
        VALUES (
            auth.uid(), 
            'TRIGGER_BACK_IN_STOCK', 
            'variant', 
            p_variant_id::text, 
            jsonb_build_object('processed_count', v_processed_count)
        );
    END IF;

    RETURN v_processed_count;
END;
$$;


-- RPC to fetch unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT count(*) INTO v_count 
    FROM public.notifications 
    WHERE user_id = auth.uid() AND is_read = false;
    
    RETURN v_count;
END;
$$;

-- RPC to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.notifications 
    SET is_read = true 
    WHERE user_id = auth.uid() AND is_read = false;
END;
$$;
