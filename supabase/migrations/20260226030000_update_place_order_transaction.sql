-- Migration: 20260226030000_update_place_order_transaction.sql
-- Description: Update place_order_transaction to support gift options

CREATE OR REPLACE FUNCTION place_order_transaction(
    p_user_id UUID,
    p_items JSONB, -- Array of {product_id, variant_id, quantity, expected_price}
    p_subtotal DECIMAL,
    p_discount_amount DECIMAL,
    p_total_amount DECIMAL,
    p_shipping_address_id UUID,
    p_idempotency_key UUID,
    p_coupon_id UUID DEFAULT NULL,
    p_is_gift BOOLEAN DEFAULT FALSE,
    p_gift_wrap BOOLEAN DEFAULT FALSE,
    p_gift_message TEXT DEFAULT NULL
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

    -- Generate a unique order number
    v_order_number := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    -- 1. Create the Order
    INSERT INTO public.orders (
        order_number, user_id, status, subtotal, discount_amount, total_amount, shipping_address_id, idempotency_key,
        is_gift, gift_wrap, gift_message
    ) VALUES (
        v_order_number, p_user_id, 'pending', p_subtotal, p_discount_amount, p_total_amount, p_shipping_address_id, p_idempotency_key,
        p_is_gift, p_gift_wrap, p_gift_message
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items (Validate Stock, Create Order Items - NO DEDUCTION YET)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
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
            
            v_actual_price := v_variant_record.price;
        ELSE
            RAISE EXCEPTION 'Variant ID is required for all items in this schema.';
        END IF;

        -- Verify Price matches what we expect server-side
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
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
