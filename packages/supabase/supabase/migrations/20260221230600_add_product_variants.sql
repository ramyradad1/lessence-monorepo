-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size_ml INTEGER NOT NULL,
    concentration TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Admins can manage product variants" 
ON public.product_variants FOR ALL USING (
  is_admin()
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger
CREATE TRIGGER update_product_variants_modtime
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Update cart_items table
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;
-- Make selected_size optional or drop it eventually, but we'll keep it nullable for now
ALTER TABLE public.cart_items ALTER COLUMN selected_size DROP NOT NULL;

-- Update order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);
ALTER TABLE public.order_items ALTER COLUMN selected_size DROP NOT NULL;

-- Insert some default variants for testing based on existing products (optional, to avoid breaking current UI immediately)
-- We will use the Noire Essence product for our initial testing
-- Assuming Noire Essence has id = '1' or similar, we'll just let the front-end handle 
-- fallback or create a generic way to seed it later if needed.
