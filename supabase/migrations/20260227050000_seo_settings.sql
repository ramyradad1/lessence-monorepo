-- SEO Settings: admin-configurable SEO metadata for key pages
-- and global SEO configuration

CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,  -- e.g. 'home', 'shop', 'about', 'global'
  title_en TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  keywords_en TEXT,
  keywords_ar TEXT,
  og_image_url TEXT,
  -- Global-only fields (page_key = 'global')
  google_verification TEXT,
  bing_verification TEXT,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  tiktok_pixel_id TEXT,
  custom_head_tags TEXT,          -- raw HTML to inject into <head>
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed defaults
INSERT INTO public.seo_settings (page_key, title_en, title_ar, description_en, description_ar) VALUES
  ('global', 'L''Essence | Luxury Fragrances', 'ليسنس | عطور فاخرة',
   'Discover the finest luxury & simulation perfumes in Egypt. Fast delivery nationwide.',
   'اكتشف أرقى العطور الفاخرة والمحاكاة في مصر. توصيل سريع لجميع المحافظات.'),
  ('home', 'L''Essence | Luxury Fragrances', 'ليسنس | عطور فاخرة',
   'Discover the finest luxury & simulation perfumes in Egypt. Original men''s & women''s fragrances at the best prices.',
   'اكتشف أرقى العطور الفاخرة والمحاكاة في مصر. عطور رجالية وحريمية أصلية بأفضل الأسعار.'),
  ('shop', 'Shop Perfumes | L''Essence', 'تسوق العطور | ليسنس',
   'Browse our collection of luxury and simulation perfumes. Filter by gender, type, and category.',
   'تصفح مجموعتنا من العطور الفاخرة والمحاكاة. تصفية حسب الجنس والنوع والفئة.')
ON CONFLICT (page_key) DO NOTHING;

-- RLS: public read, admin write
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo settings"
  ON public.seo_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update seo settings"
  ON public.seo_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can insert seo settings"
  ON public.seo_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
