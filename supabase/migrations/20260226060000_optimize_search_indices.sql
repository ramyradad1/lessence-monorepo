-- Enable the pg_trgm extension for fast text similarity and ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indices for all text fields used in search_products
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING gin (description_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_ar_trgm ON public.products USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_ar_trgm ON public.products USING gin (description_ar gin_trgm_ops);
