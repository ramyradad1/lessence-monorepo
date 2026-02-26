-- Migration: 20260226010000_product_management_fields.sql
-- Add new fields for comprehensive product management

-- 1) Add fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'hidden')),
ADD COLUMN IF NOT EXISTS top_notes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS heart_notes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS base_notes text[] DEFAULT '{}';

-- Update RLS for products to consider status
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products 
FOR SELECT USING (
    (is_active = true AND status = 'active') 
    OR public.is_content_manager() 
    OR public.is_inventory_manager()
);

-- 2) Add fields to product_variants table
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS compare_at_price numeric(10, 2);

-- Update RLS for product_variants to ensure they're only visible to public if their parent product is visible
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants 
FOR SELECT USING (
    (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM public.products p 
            WHERE p.id = product_variants.product_id 
              AND p.is_active = true 
              AND p.status = 'active'
        )
    )
    OR public.is_content_manager() 
    OR public.is_inventory_manager()
);
