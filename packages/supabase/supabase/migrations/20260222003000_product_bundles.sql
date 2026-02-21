-- Create bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Active bundles are viewable by everyone" 
ON public.bundles FOR SELECT USING (is_active = true OR is_admin() = true);

CREATE POLICY "Admins can manage bundles" 
ON public.bundles FOR ALL USING (is_admin());

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS public.bundle_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (bundle_id, product_id, variant_id)
);

-- Enable RLS
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Bundle items are viewable by everyone" 
ON public.bundle_items FOR SELECT USING (true); -- Usually fetched alongside the bundle

CREATE POLICY "Admins can manage bundle items" 
ON public.bundle_items FOR ALL USING (is_admin());

-- Modify cart_items
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE;
ALTER TABLE public.cart_items ALTER COLUMN product_id DROP NOT NULL;

-- Optional: Drop existing constraints if they interfere
-- ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_check; 

-- Add check constraint to ensure exactly one of product_id or bundle_id is set
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_product_or_bundle_check CHECK (
    (product_id IS NOT NULL AND bundle_id IS NULL) OR
    (product_id IS NULL AND bundle_id IS NOT NULL)
);

-- Note about unique constraint in cart_items:
-- In 20260221000000_full_ecommerce_schema.sql, there's `unique (cart_id, product_id, selected_size)`
-- With product_id being nullable, that unique constraint might not work well or we might need 
-- a new one for bundles. Currently PG treats nulls as distinct, so two identical bundles could be added.
-- Let's drop it and recreate two constraints: one for products, one for bundles.
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_selected_size_key CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_product ON public.cart_items (cart_id, product_id, selected_size, variant_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_bundle ON public.cart_items (cart_id, bundle_id) WHERE bundle_id IS NOT NULL;


-- Modify order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN product_name DROP NOT NULL; -- bundle_name will be used
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS bundle_name TEXT;

ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_or_bundle_check CHECK (
    (product_id IS NOT NULL AND bundle_id IS NULL AND product_name IS NOT NULL) OR
    (product_id IS NULL AND bundle_id IS NOT NULL AND bundle_name IS NOT NULL)
);

-- Triggers for updated_at
CREATE TRIGGER update_bundles_modtime
    BEFORE UPDATE ON public.bundles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
