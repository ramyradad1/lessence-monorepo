-- Migration for Localized Bundle Fields

ALTER TABLE bundles
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Move existing data to English fields as default
UPDATE bundles SET 
  name_en = COALESCE(name_en, name),
  description_en = COALESCE(description_en, description)
WHERE name_en IS NULL;
