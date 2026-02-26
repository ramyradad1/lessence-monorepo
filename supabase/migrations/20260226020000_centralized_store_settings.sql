-- migration: centralized_store_settings
-- Re-apply default store settings
INSERT INTO public.store_settings (key, value) VALUES 
('identity', '{"store_name": "LESSENCE", "support_email": "support@lessence.com", "support_phone": "+201234567890", "social_links": {"facebook": "https://facebook.com/lessence", "instagram": "https://instagram.com/lessence", "tiktok": "https://tiktok.com/@lessence"}}'::jsonb),
('business', '{"currency_display": "EGP", "low_stock_threshold": 5, "guest_checkout_enabled": true, "pickup_availability": true}'::jsonb),
('content', '{"homepage_sections": {"hero": true, "featured_categories": true, "new_arrivals": true, "bestsellers": true}, "featured_collections": []}'::jsonb),
('features', '{"recently_viewed": true, "related_products": true, "wishlist": true, "reviews": true, "back_in_stock_alerts": true}'::jsonb),
('localization', '{"default_language": "en", "enabled_languages": ["en", "ar"]}'::jsonb),
('policies', '{"terms": "Terms of Service...", "privacy": "Privacy Policy...", "refund": "Refund Policy..."}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = public.store_settings.value; -- keep exiting but insert if not exists

-- RPC to get all settings as a single object map
CREATE OR REPLACE FUNCTION public.get_store_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) INTO result
    FROM public.store_settings;

    RETURN result;
END;
$$;

-- RPC to update multiple settings
CREATE OR REPLACE FUNCTION public.update_store_settings(p_settings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid;
    v_key text;
    v_value jsonb;
    v_old_value jsonb;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get current admin user ID
    v_admin_id := auth.uid();

    -- Iterate through the provided JSON object keys and values
    FOR v_key, v_value IN
        SELECT * FROM jsonb_each(p_settings)
    LOOP
        -- Retrieve the current value
        SELECT value INTO v_old_value FROM public.store_settings WHERE key = v_key;

        -- Insert or update the setting
        INSERT INTO public.store_settings (key, value, updated_at, updated_by)
        VALUES (v_key, v_value, now(), v_admin_id)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by;

        -- Create an audit log if the value changed
        IF (v_old_value IS NULL) OR (v_old_value IS DISTINCT FROM v_value) THEN
            INSERT INTO public.admin_audit_logs (admin_id, action, entity_type, entity_id, old_data, new_data)
            VALUES (v_admin_id, 'UPDATE_SETTING', 'store_settings', v_key, v_old_value, v_value);
        END IF;

    END LOOP;
END;
$$;
