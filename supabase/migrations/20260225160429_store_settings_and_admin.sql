-- Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to store settings" 
    ON public.store_settings FOR SELECT 
    USING (true);

CREATE POLICY "Allow admin full access to store settings" 
    ON public.store_settings FOR ALL 
    USING (public.is_admin());

-- Insert default settings
INSERT INTO public.store_settings (key, value) VALUES 
('contact', '{"email": "support@lessence.com", "phone": "+201234567890", "address": "Cairo, Egypt", "whatsapp": "+201234567890"}'),
('social', '{"facebook": "https://facebook.com/lessence", "instagram": "https://instagram.com/lessence", "tiktok": "https://tiktok.com/@lessence"}'),
('policies', '{"terms": "Terms of Service...", "privacy": "Privacy Policy...", "refund": "Refund Policy..."}'),
('features', '{"pickup_availability": true, "related_products": true, "recently_viewed": true}')
ON CONFLICT (key) DO NOTHING;

-- Create variant_normalizations table
CREATE TABLE IF NOT EXISTS public.variant_normalizations (
    original_value text PRIMARY KEY,
    normalized_value_en text NOT NULL,
    normalized_value_ar text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.variant_normalizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to variant normalizations" 
    ON public.variant_normalizations FOR SELECT 
    USING (true);

CREATE POLICY "Allow admin full access to variant normalizations" 
    ON public.variant_normalizations FOR ALL 
    USING (public.is_admin());

-- Insert common size normalizations
INSERT INTO public.variant_normalizations (original_value, normalized_value_en, normalized_value_ar) VALUES 
('S', 'Small', 'صغير'),
('Small', 'Small', 'صغير'),
('صغير', 'Small', 'صغير'),
('M', 'Medium', 'متوسط'),
('Medium', 'Medium', 'متوسط'),
('متوسط', 'Medium', 'متوسط'),
('L', 'Large', 'كبير'),
('Large', 'Large', 'كبير'),
('كبير', 'Large', 'كبير'),
('XL', 'X-Large', 'كبير جداً'),
('X-Large', 'X-Large', 'كبير جداً'),
('كبير جداً', 'X-Large', 'كبير جداً')
ON CONFLICT (original_value) DO NOTHING;

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read access to audit logs" 
    ON public.admin_audit_logs FOR SELECT 
    USING (public.is_admin());

CREATE POLICY "Allow admin insert access to audit logs" 
    ON public.admin_audit_logs FOR INSERT 
    WITH CHECK (public.is_admin());

-- Add DB constraints to prevent broken product data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'products_name_en_check'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_name_en_check CHECK (trim(name_en) <> '');
    END IF;
END $$;

-- Create RPC for store diagnostics
CREATE OR REPLACE FUNCTION public.get_store_diagnostics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    placeholder_products integer;
    missing_metadata_products integer;
    total_products integer;
    placeholder_categories integer;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Count total products
    SELECT COUNT(*) INTO total_products FROM public.products;

    -- Count products with placeholder text (Lorem, Dummy) in title, description
    SELECT COUNT(*) INTO placeholder_products 
    FROM public.products 
    WHERE name_en ILIKE '%lorem%' OR name_en ILIKE '%dummy%' 
       OR name_ar ILIKE '%lorem%' OR name_ar ILIKE '%dummy%'
       OR description_en ILIKE '%lorem%' OR description_en ILIKE '%dummy%'
       OR description_ar ILIKE '%lorem%' OR description_ar ILIKE '%dummy%';

    -- Count products missing essential metadata (empty SKU, zero price if valid)
    SELECT COUNT(*) INTO missing_metadata_products 
    FROM public.products 
    WHERE sku IS NULL OR trim(sku) = '' OR base_price <= 0;

    -- Count categories with placeholder text
    SELECT COUNT(*) INTO placeholder_categories
    FROM public.categories
    WHERE name_en ILIKE '%lorem%' OR name_en ILIKE '%dummy%'
       OR name_ar ILIKE '%lorem%' OR name_ar ILIKE '%dummy%'
       OR description_en ILIKE '%lorem%' OR description_en ILIKE '%dummy%'
       OR description_ar ILIKE '%lorem%' OR description_ar ILIKE '%dummy%';

    result := jsonb_build_object(
        'total_products', total_products,
        'placeholder_products', placeholder_products,
        'missing_metadata_products', missing_metadata_products,
        'placeholder_categories', placeholder_categories,
        'status', CASE 
            WHEN placeholder_products > 0 OR missing_metadata_products > 0 THEN 'warning' 
            ELSE 'healthy' 
        END,
        'checked_at', now()
    );

    RETURN result;
END;
$$;
