-- Migration for Bilingual Content Support

-- Products Table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Move existing data to English fields as default
UPDATE products SET 
  name_en = COALESCE(name_en, name),
  subtitle_en = COALESCE(subtitle_en, subtitle),
  description_en = COALESCE(description_en, description)
WHERE name_en IS NULL;

-- Categories Table
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT;

UPDATE categories SET
  name_en = COALESCE(name_en, name)
WHERE name_en IS NULL;

-- Hero Banners
ALTER TABLE hero_banners
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS cta_text_en TEXT,
  ADD COLUMN IF NOT EXISTS cta_text_ar TEXT,
  ADD COLUMN IF NOT EXISTS badge_text_en TEXT,
  ADD COLUMN IF NOT EXISTS badge_text_ar TEXT;

UPDATE hero_banners SET
  title_en = COALESCE(title_en, title),
  subtitle_en = COALESCE(subtitle_en, subtitle),
  description_en = COALESCE(description_en, description),
  cta_text_en = COALESCE(cta_text_en, cta_text),
  badge_text_en = COALESCE(badge_text_en, badge_text)
WHERE title_en IS NULL;
