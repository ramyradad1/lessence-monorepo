-- Migration: 20260226000000_foundation_completion.sql
-- Add missing tables and localization/translation metadata fields

-- 1) Create the brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Translation metadata
    translation_status TEXT DEFAULT 'pending',
    translation_source TEXT,
    translated_at TIMESTAMPTZ,
    translation_error TEXT
);

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 2) Create the collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Translation metadata
    translation_status TEXT DEFAULT 'pending',
    translation_source TEXT,
    translated_at TIMESTAMPTZ,
    translation_error TEXT
);

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3) Create collection_products mapping
CREATE TABLE IF NOT EXISTS public.collection_products (
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (collection_id, product_id)
);

-- 4) Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Translation metadata
    translation_status TEXT DEFAULT 'pending',
    translation_source TEXT,
    translated_at TIMESTAMPTZ,
    translation_error TEXT
);

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 5) Create product_notes
CREATE TABLE IF NOT EXISTS public.product_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_product_notes_updated_at BEFORE UPDATE ON public.product_notes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 6) Create translation_logs
CREATE TABLE IF NOT EXISTS public.translation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    from_lang TEXT NOT NULL,
    to_lang TEXT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT,
    provider TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7) Append translation error columns and brand_id if missing

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand_id') THEN
        ALTER TABLE public.products ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='translation_error') THEN
        ALTER TABLE public.products ADD COLUMN translation_error TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='translation_error') THEN
        ALTER TABLE public.categories ADD COLUMN translation_error TEXT;
    END IF;
END $$;

-- 8) Row Level Security (RLS)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_logs ENABLE ROW LEVEL SECURITY;

-- Public read for active entities
CREATE POLICY "Public read active brands" ON public.brands FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active collections" ON public.collections FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active collection products" ON public.collection_products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_products.collection_id AND c.is_active = true)
);
CREATE POLICY "Public read active promotions" ON public.promotions FOR SELECT USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- Admin full access
CREATE POLICY "Admin manage brands" ON public.brands TO authenticated USING (public.is_admin());
CREATE POLICY "Admin manage collections" ON public.collections TO authenticated USING (public.is_admin());
CREATE POLICY "Admin manage collection products" ON public.collection_products TO authenticated USING (public.is_admin());
CREATE POLICY "Admin manage promotions" ON public.promotions TO authenticated USING (public.is_admin());
CREATE POLICY "Admin manage product notes" ON public.product_notes TO authenticated USING (public.is_admin());
CREATE POLICY "Admin manage translation logs" ON public.translation_logs TO authenticated USING (public.is_admin());

-- 9) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brands_active ON public.brands(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product ON public.collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_notes_product ON public.product_notes(product_id);
CREATE INDEX IF NOT EXISTS idx_translation_logs_entity ON public.translation_logs(entity_type, entity_id);

