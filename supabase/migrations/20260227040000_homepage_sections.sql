-- Homepage Sections: controls the order and visibility of homepage sections
-- Manageable from the admin panel via drag-and-drop

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  label_ar TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default sections in display order
INSERT INTO public.homepage_sections (key, label, label_ar, sort_order, is_visible) VALUES
  ('hero', 'Hero Banner', 'البانر الرئيسي', 0, true),
  ('gender_showcase', 'Gender Showcase (Her / Him)', 'عرض الجنسين (لها / له)', 1, true),
  ('category_filter', 'Category Filter Bar', 'شريط تصفية الفئات', 2, true),
  ('category_grid', 'Category Grid', 'شبكة الفئات', 3, true),
  ('featured_products', 'Featured Products', 'المنتجات المميزة', 4, true),
  ('product_type_showcase', 'Product Type Showcase (Original / Simulation)', 'عرض نوع المنتج', 5, true),
  ('promo_banner', 'Promo Banner', 'بانر العروض', 6, true),
  ('recently_viewed', 'Recently Viewed', 'شوهدت مؤخراً', 7, true),
  ('luxury_quote', 'Luxury Quote', 'اقتباس فاخر', 8, true)
ON CONFLICT (key) DO NOTHING;

-- RLS: public read, admin write
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read homepage sections"
  ON public.homepage_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can update homepage sections"
  ON public.homepage_sections FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can insert homepage sections"
  ON public.homepage_sections FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can delete homepage sections"
  ON public.homepage_sections FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
