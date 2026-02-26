-- Migration: 20260226020000_product_management_rpcs.sql
-- Transactional RPCs for product management

-- 1) Admin Save Product
-- Handles inserting or updating a product, its variants, and logging the action.
CREATE OR REPLACE FUNCTION public.admin_save_product(
    p_product_id UUID,
    p_category_id UUID,
    p_brand_id UUID,
    p_slug TEXT,
    p_name_en TEXT,
    p_name_ar TEXT,
    p_description_en TEXT,
    p_description_ar TEXT,
    p_base_price NUMERIC,
    p_is_active BOOLEAN,
    p_is_featured BOOLEAN,
    p_is_sale BOOLEAN,
    p_status TEXT,
    p_tags TEXT[],
    p_top_notes TEXT[],
    p_heart_notes TEXT[],
    p_base_notes TEXT[],
    p_variants JSONB -- Array of { id (optional), sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity, low_stock_threshold, is_active, barcode, compare_at_price }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID;
    v_product_id UUID;
    v_variant_record RECORD;
    v_variant JSONB;
BEGIN
    v_admin_id := auth.uid();
    
    -- Ensure admin access
    IF NOT public.is_content_manager() AND NOT public.is_inventory_manager() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF p_product_id IS NULL THEN
        -- Insert new product
        INSERT INTO public.products (
            category_id, brand_id, slug, name_en, name_ar, description_en, description_ar,
            base_price, is_active, is_featured, is_sale, status, tags, top_notes, heart_notes, base_notes, created_by
        ) VALUES (
            p_category_id, p_brand_id, p_slug, p_name_en, p_name_ar, p_description_en, p_description_ar,
            p_base_price, p_is_active, p_is_featured, p_is_sale, p_status, p_tags, p_top_notes, p_heart_notes, p_base_notes, v_admin_id
        ) RETURNING id INTO v_product_id;
        
        -- Log creation
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (v_admin_id, 'CREATE_PRODUCT', 'products', v_product_id, jsonb_build_object('name_en', p_name_en));
    ELSE
        -- Update existing
        v_product_id := p_product_id;
        UPDATE public.products SET
            category_id = p_category_id,
            brand_id = p_brand_id,
            slug = p_slug,
            name_en = p_name_en,
            name_ar = p_name_ar,
            description_en = p_description_en,
            description_ar = p_description_ar,
            base_price = p_base_price,
            is_active = p_is_active,
            is_featured = p_is_featured,
            is_sale = p_is_sale,
            status = p_status,
            tags = p_tags,
            top_notes = p_top_notes,
            heart_notes = p_heart_notes,
            base_notes = p_base_notes,
            updated_by = v_admin_id,
            updated_at = NOW()
        WHERE id = v_product_id;
        
        -- Log update
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (v_admin_id, 'UPDATE_PRODUCT', 'products', v_product_id, jsonb_build_object('name_en', p_name_en));
    END IF;

    -- Upsert variants
    IF jsonb_typeof(p_variants) = 'array' THEN
        FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
        LOOP
            IF v_variant->>'id' IS NOT NULL AND v_variant->>'id' != '' THEN
                -- Update existing variant
                UPDATE public.product_variants SET
                    sku = v_variant->>'sku',
                    size_ml = (v_variant->>'size_ml')::int,
                    concentration_en = v_variant->>'concentration_en',
                    concentration_ar = v_variant->>'concentration_ar',
                    price_adjustment = COALESCE((v_variant->>'price_adjustment')::numeric, 0),
                    stock_quantity = COALESCE((v_variant->>'stock_quantity')::int, 0),
                    low_stock_threshold = COALESCE((v_variant->>'low_stock_threshold')::int, 10),
                    is_active = COALESCE((v_variant->>'is_active')::boolean, true),
                    barcode = v_variant->>'barcode',
                    compare_at_price = (v_variant->>'compare_at_price')::numeric,
                    updated_at = NOW()
                WHERE id = (v_variant->>'id')::uuid AND product_id = v_product_id;
            ELSE
                -- Insert new variant
                INSERT INTO public.product_variants (
                    product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment,
                    stock_quantity, low_stock_threshold, is_active, barcode, compare_at_price
                ) VALUES (
                    v_product_id,
                    v_variant->>'sku',
                    (v_variant->>'size_ml')::int,
                    v_variant->>'concentration_en',
                    v_variant->>'concentration_ar',
                    COALESCE((v_variant->>'price_adjustment')::numeric, 0),
                    COALESCE((v_variant->>'stock_quantity')::int, 0),
                    COALESCE((v_variant->>'low_stock_threshold')::int, 10),
                    COALESCE((v_variant->>'is_active')::boolean, true),
                    v_variant->>'barcode',
                    (v_variant->>'compare_at_price')::numeric
                );
            END IF;
        END LOOP;
        
        -- Optional: We might want to remove variants not in the list, but it's safer to just set them inactive 
        -- or require an explicit delete flag. To keep it simple, we don't auto-delete here to prevent accidental data loss.
    END IF;

    RETURN v_product_id;
END;
$$;

-- 2) Bulk update product status
CREATE OR REPLACE FUNCTION public.admin_bulk_update_product_status(
    p_product_ids UUID[],
    p_status TEXT,
    p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT public.is_content_manager() AND NOT public.is_inventory_manager() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.products 
    SET 
        status = p_status, 
        is_active = p_is_active, 
        updated_by = v_admin_id,
        updated_at = NOW()
    WHERE id = ANY(p_product_ids);

    -- Log bulk update
    INSERT INTO public.admin_audit_logs (admin_id, action, target_table, changes)
    VALUES (v_admin_id, 'BULK_UPDATE_PRODUCT_STATUS', 'products', jsonb_build_object('product_ids', p_product_ids, 'status', p_status, 'is_active', p_is_active));
END;
$$;
