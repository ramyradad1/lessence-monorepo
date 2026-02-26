-- Migration: 20260226000001_management_schema_updates.sql
-- Description: Add missing management fields for categories, brands, and collections

-- 1) Add sort_order to brands (categories already has it)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='sort_order') THEN
        ALTER TABLE public.brands ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2) Add sort_order, show_on_homepage, is_smart, smart_rules to collections
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='sort_order') THEN
        ALTER TABLE public.collections ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='show_on_homepage') THEN
        ALTER TABLE public.collections ADD COLUMN show_on_homepage BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='is_smart') THEN
        ALTER TABLE public.collections ADD COLUMN is_smart BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='smart_rules') THEN
        ALTER TABLE public.collections ADD COLUMN smart_rules JSONB;
    END IF;
END $$;

-- 3) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON public.brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON public.collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_show_on_homepage ON public.collections(show_on_homepage) WHERE show_on_homepage = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- 4) Triggers for audit logging

-- Categories trigger
CREATE OR REPLACE FUNCTION audit_categories_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'CREATE_CATEGORY', 'categories', NEW.id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'UPDATE_CATEGORY', 'categories', NEW.id, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'DELETE_CATEGORY', 'categories', OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_categories_on_change ON public.categories;
CREATE TRIGGER audit_categories_on_change
    AFTER INSERT OR UPDATE OR DELETE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION audit_categories_changes();

-- Brands trigger
CREATE OR REPLACE FUNCTION audit_brands_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'CREATE_BRAND', 'brands', NEW.id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'UPDATE_BRAND', 'brands', NEW.id, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'DELETE_BRAND', 'brands', OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_brands_on_change ON public.brands;
CREATE TRIGGER audit_brands_on_change
    AFTER INSERT OR UPDATE OR DELETE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION audit_brands_changes();

-- Collections trigger
CREATE OR REPLACE FUNCTION audit_collections_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'CREATE_COLLECTION', 'collections', NEW.id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'UPDATE_COLLECTION', 'collections', NEW.id, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, record_id, changes)
        VALUES (auth.uid(), 'DELETE_COLLECTION', 'collections', OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_collections_on_change ON public.collections;
CREATE TRIGGER audit_collections_on_change
    AFTER INSERT OR UPDATE OR DELETE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION audit_collections_changes();

-- 5) RPC for Smart Collections Evaluation
-- This function takes smart_rules JSON array and returns matching products
CREATE OR REPLACE FUNCTION evaluate_smart_collection_rules(rules JSONB)
RETURNS TABLE (product_id UUID) AS $$
DECLARE
    rule_obj JSONB;
    base_query TEXT := 'SELECT id FROM public.products WHERE is_active = true';
    condition_str TEXT := '';
    i INT;
    operator TEXT;
    field TEXT;
    val TEXT;
BEGIN
    -- If rules is strictly an array in format [{field, operator, value}]
    IF jsonb_typeof(rules) = 'array' THEN
        FOR i IN 0 .. jsonb_array_length(rules) - 1 LOOP
            rule_obj := rules->i;
            field := rule_obj->>'field';
            operator := rule_obj->>'operator';
            val := rule_obj->>'value';
            
            -- Simple query builder (safe as it restricts fields and operators)
            IF field IN ('brand_id', 'category_id', 'is_new') AND operator IN ('=', '!=') THEN
                 -- For bools vs uuids
                 IF val IN ('true', 'false') THEN
                     condition_str := condition_str || ' AND ' || quote_ident(field) || ' ' || operator || ' ' || val;
                 ELSE
                     condition_str := condition_str || ' AND ' || quote_ident(field) || ' ' || operator || ' ' || quote_literal(val);
                 END IF;
            END IF;
            
            IF field = 'price' AND operator IN ('<', '>', '<=', '>=', '=') THEN
                 condition_str := condition_str || ' AND base_price ' || operator || ' ' || val::numeric;
            END IF;
            
        END LOOP;
        
        RETURN QUERY EXECUTE base_query || condition_str;
    ELSE
        RETURN QUERY EXECUTE base_query;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose via RPC to getting full products
CREATE OR REPLACE FUNCTION get_smart_collection_products(collection_slug TEXT)
RETURNS JSON AS $$
DECLARE
    coll_record RECORD;
    res JSON;
BEGIN
    SELECT * INTO coll_record FROM public.collections WHERE slug = collection_slug AND is_smart = true AND is_active = true;
    IF NOT FOUND THEN
        RETURN '[]'::json;
    END IF;
    
    WITH matched_products AS (
        SELECT evaluate_smart_collection_rules(coll_record.smart_rules) AS id
    )
    SELECT json_agg(p.*) INTO res
    FROM public.products p
    JOIN matched_products mp ON p.id = mp.id;
    
    RETURN COALESCE(res, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
