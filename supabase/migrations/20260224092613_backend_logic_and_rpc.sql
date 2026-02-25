-- 1. Idempotency & Safety Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;


-- 2. Audit Logging Function & Triggers
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Assume the admin ID is passed via a local variable or we capture the auth.uid()
    v_admin_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (v_admin_id, 'CREATE_' || TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (v_admin_id, 'UPDATE_' || TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, 
                jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (v_admin_id, 'DELETE_' || TG_TABLE_NAME, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit Triggers to critical tables
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE log_admin_action();

DROP TRIGGER IF EXISTS trg_audit_coupons ON public.coupons;
CREATE TRIGGER trg_audit_coupons
    AFTER INSERT OR UPDATE OR DELETE ON public.coupons
    FOR EACH ROW EXECUTE PROCEDURE log_admin_action();

DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
CREATE TRIGGER trg_audit_orders
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE log_admin_action();


-- 3. Views and Read-Only RPCs
CREATE OR REPLACE VIEW public.get_low_stock_report AS
SELECT 
    v.id AS variant_id,
    p.name_en AS product_name_en,
    p.name_ar AS product_name_ar,
    v.sku,
    v.size_ml,
    v.stock_qty,
    v.low_stock_threshold
FROM 
    public.product_variants v
JOIN 
    public.products p ON p.id = v.product_id
WHERE 
    v.stock_qty <= v.low_stock_threshold
    AND v.is_active = TRUE
    AND p.is_active = TRUE;


CREATE OR REPLACE VIEW public.get_customer_spend_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    u.full_name,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_spent
FROM 
    public.profiles u
LEFT JOIN 
    public.orders o ON u.id = o.user_id AND o.status NOT IN ('cancelled', 'refunded')
GROUP BY 
    u.id, u.email, u.full_name;


CREATE OR REPLACE VIEW public.get_product_rating_aggregates AS
SELECT 
    p.id AS product_id,
    p.name_en,
    COUNT(r.id) AS total_reviews,
    COALESCE(AVG(r.rating), 0) AS average_rating
FROM 
    public.products p
LEFT JOIN 
    public.reviews r ON p.id = r.product_id AND r.is_approved = TRUE
GROUP BY 
    p.id, p.name_en;


CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sales DECIMAL;
    v_total_orders INT;
    v_total_users INT;
    v_recent_sales JSONB;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_sales FROM public.orders WHERE status IN ('paid', 'processing', 'shipped', 'delivered');
    SELECT COUNT(*) INTO v_total_orders FROM public.orders WHERE status != 'cancelled';
    SELECT COUNT(*) INTO v_total_users FROM public.profiles WHERE role = 'user';
    
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
        'totalSales', v_total_sales,
        'totalOrders', v_total_orders,
        'totalUsers', v_total_users,
        'chartData', COALESCE(v_recent_sales, '[]'::jsonb)
    );
END;
$$;


-- 4. Transactional Order Placement RPC
CREATE OR REPLACE FUNCTION place_order_transaction(
    p_user_id UUID,
    p_items JSONB, -- Array of {product_id, variant_id, quantity, expected_price}
    p_subtotal DECIMAL,
    p_discount_amount DECIMAL,
    p_total_amount DECIMAL,
    p_shipping_address_id UUID,
    p_idempotency_key UUID,
    p_coupon_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_variant_record RECORD;
    v_product_record RECORD;
    v_coupon_record RECORD;
    v_actual_price DECIMAL;
BEGIN
    -- 0. Idempotency Check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_order_id FROM public.orders WHERE idempotency_key = p_idempotency_key;
        IF v_order_id IS NOT NULL THEN
            -- Order already exists, return the existing order
            RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'message', 'Order already created idempotently.');
        END IF;
    END IF;

    -- Generate a unique order number (simple format for example: ORD-YYYYMMDD-XXXX)
    v_order_number := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    -- 1. Create the Order
    INSERT INTO public.orders (
        order_number, user_id, status, subtotal, discount_amount, total_amount, shipping_address_id, idempotency_key
    ) VALUES (
        v_order_number, p_user_id, 'pending', p_subtotal, p_discount_amount, p_total_amount, p_shipping_address_id, p_idempotency_key
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items (Validate Stock, Deduct Inventory, Create Order Items)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Fetch Product and Variant inside transaction with FOR UPDATE to lock the row
        SELECT * INTO v_product_record FROM public.products p WHERE p.id = (v_item->>'product_id')::UUID FOR UPDATE;
        IF NOT FOUND OR NOT v_product_record.is_active THEN
            RAISE EXCEPTION 'Product % is not available.', v_item->>'product_id';
        END IF;

        IF v_item->>'variant_id' IS NOT NULL THEN
            SELECT * INTO v_variant_record FROM public.product_variants v WHERE v.id = (v_item->>'variant_id')::UUID FOR UPDATE;
            IF NOT FOUND OR NOT v_variant_record.is_active THEN
                RAISE EXCEPTION 'Variant % is not available.', v_item->>'variant_id';
            END IF;
            
            -- Check stock
            IF v_variant_record.stock_qty < (v_item->>'quantity')::INT THEN
                RAISE EXCEPTION 'Insufficient stock for product % variant %.', v_product_record.name_en, v_variant_record.sku;
            END IF;

            -- Deduct stock
            UPDATE public.product_variants 
            SET stock_qty = stock_qty - (v_item->>'quantity')::INT
            WHERE id = v_variant_record.id;
            
            v_actual_price := v_variant_record.price;
        ELSE
            -- No variant used (e.g. single size product if variants are optional)
            RAISE EXCEPTION 'Variant ID is required for all items in this schema.';
        END IF;

        -- Verify Price matches what we expect server-side. Note: Edge function actually calculates total so this is an extra sanity check
        IF v_actual_price != (v_item->>'expected_price')::DECIMAL THEN
             RAISE EXCEPTION 'Price mismatch detected on variant %.', v_variant_record.id;
        END IF;

        -- Insert Order Item
        INSERT INTO public.order_items (
            order_id, product_id, variant_id, product_name, price, quantity
        ) VALUES (
            v_order_id, v_product_record.id, v_variant_record.id, v_product_record.name_en, v_actual_price, (v_item->>'quantity')::INT
        );
    END LOOP;

    -- 3. If a coupon was used, create redemption and increment usage
    IF p_coupon_id IS NOT NULL THEN
        SELECT * INTO v_coupon_record FROM public.coupons WHERE id = p_coupon_id FOR UPDATE;
        
        IF NOT FOUND OR NOT v_coupon_record.is_active THEN
            RAISE EXCEPTION 'Coupon is invalid or inactive.';
        END IF;
        
        IF v_coupon_record.valid_until IS NOT NULL AND v_coupon_record.valid_until < NOW() THEN
            RAISE EXCEPTION 'Coupon implies it has expired.';
        END IF;
        
        IF v_coupon_record.usage_limit IS NOT NULL AND v_coupon_record.times_used >= v_coupon_record.usage_limit THEN
            RAISE EXCEPTION 'Coupon usage limit reached.';
        END IF;

        -- Increment usage
        UPDATE public.coupons SET times_used = times_used + 1 WHERE id = p_coupon_id;

        -- Record Redemption
        INSERT INTO public.coupon_redemptions (
            coupon_id, order_id, user_id, discount_applied
        ) VALUES (
            p_coupon_id, v_order_id, p_user_id, p_discount_amount
        );
    END IF;

    -- Returns successful order ID and Number
    RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'order_number', v_order_number);

EXCEPTION WHEN OTHERS THEN
    -- Postgres rolls back the transaction automatically if an exception is raised
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
