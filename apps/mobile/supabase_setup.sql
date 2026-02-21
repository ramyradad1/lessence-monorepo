-- =========================================
-- L'Essence Perfume Store - Database Schema
-- Run this in Supabase SQL Editor
-- =========================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  size_options JSONB DEFAULT '[]',
  scent_profiles JSONB DEFAULT '[]',
  fragrance_notes JSONB DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_limited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending','shipped','delivered')) DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hero Banners
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  cta_text TEXT DEFAULT 'Shop Collection',
  badge_text TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON hero_banners FOR SELECT USING (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);

-- =========================================
-- SEED DATA
-- =========================================

-- Categories
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('All Scents', 'all', 'local_florist', 0),
  ('Floral', 'floral', 'spa', 1),
  ('Woody', 'woody', 'park', 2),
  ('Citrus', 'citrus', 'wb_sunny', 3),
  ('Oriental', 'oriental', 'auto_awesome', 4);

-- Products (matching Stitch designs exactly)
INSERT INTO products (name, subtitle, description, price, image_url, category_id, size_options, scent_profiles, fragrance_notes, rating, review_count, is_new, is_limited) VALUES
(
  'Velvet Rose',
  'Eau de Parfum',
  'An enchanting bouquet of Bulgarian rose and velvety musk, capturing the romance of a midnight garden.',
  120.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC6fAinLXTPnn1NtZXGpP7kDctFKFTPYqj-Hh-yjKwAGEVFmQRmJBe0Tfwmj5KCs_ZZ1br3CXRSRSXR7vID-3CrRhZLxDwO2XNXQmCAB1LqvB2S5SAiWAg5-FgNhV_iICZaMmw-RsZHm5CXvRCdWvIJbLL2VRsYVfYjKnug-UP9k_omvjmgPwQDH5V1UKtN-RqdqRux1jmR78_AWLUu_8sarc2Wbwoud5dRHBwIAckw3qk4_TI3D93eDhvV8W1T8UvcWLM2_LcsCJ1m',
  (SELECT id FROM categories WHERE slug = 'floral'),
  '[{"size": "50ml", "price": 120.00}, {"size": "100ml", "price": 180.00}]',
  '[{"name": "Floral", "icon": "spa"}, {"name": "Musk", "icon": "nights_stay"}]',
  '{"top": ["Rose", "Peony"], "heart": ["Jasmine", "Lily"], "base": ["Musk", "Sandalwood"]}',
  4.5, 38, true, false
),
(
  'Midnight Oud',
  'Intense Parfum',
  'A powerful blend of rare oud wood and smoky incense, evoking the allure of Arabian nights.',
  145.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdC0bsFJLwidqKoCJC16JdiW2LC4xui1Pxpk-L6L2zFQ5Dcl6-IsId7YC-EyIGNaTE9jwIz6WF1RzRKcuGlwV1K_ncPY65w4AO47x2FI4jZM-pC1AnrO2NbWrfJfZY1HnkQ15zveSdZHVohL8wxcyiPyi19EKvT8Tt0zd3-tdJ1J_-9nzS_Vm6qLozLVMXwYOMgkmyM6fRaxYCPwgYBHWCOaRi4Eh47attE0_TUI9bLKr4PTsHgTJLrVHlFwS_V1kTGGHDM_grCxve',
  (SELECT id FROM categories WHERE slug = 'oriental'),
  '[{"size": "50ml", "price": 145.00}, {"size": "100ml", "price": 220.00}]',
  '[{"name": "Woody", "icon": "park"}, {"name": "Smoky", "icon": "local_fire_department"}]',
  '{"top": ["Saffron", "Cardamom"], "heart": ["Oud", "Incense"], "base": ["Amber", "Vetiver"]}',
  4.8, 56, false, false
),
(
  'Citrus Breeze',
  'Eau de Toilette',
  'A refreshing burst of Mediterranean citrus and ocean breeze, perfect for sun-kissed days.',
  95.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAGCt1T_0-iQGpFCp1Mloe8J4RjCyOL02u48IvM_voW_eTCWRHVkpZO947cZ_tOtdYbKp1FHVszH00ekwErrmY4eYs1dC7FYTpZgRBRKCO1xxgHhjzpLg1HUmrMhUyomjnD2VFBlWDWuS58Hdf7pXE9Mp3NR413Wy-xggnjwH4FurxFPxtnejCNJwGymVQoS7KGjRpwOPE6yuGiwjFpB5iXTALHl6bYoZKO7NBYeJtJtCbgPlcE7Kb_XUAR8Np3o8zdNzzWNvvv4fei',
  (SELECT id FROM categories WHERE slug = 'citrus'),
  '[{"size": "50ml", "price": 95.00}, {"size": "100ml", "price": 140.00}]',
  '[{"name": "Citrus", "icon": "wb_sunny"}, {"name": "Fresh", "icon": "water_drop"}]',
  '{"top": ["Bergamot", "Lemon"], "heart": ["Neroli", "Marine"], "base": ["White Musk", "Cedar"]}',
  4.3, 27, true, false
),
(
  'Noire Essence',
  'Eau de Parfum',
  'A provocative blend of dark florals and warm woods. Noire Essence captures the mystery of the night with its intoxicating top notes of spicy pink pepper, settling into a deep, sensual amber base.',
  180.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBRTDuGHsKv6gZggTWfA4p2SHMGKLyTdXnoWKr3Wu5ZpeMeK5cdBNdHuBOgaavvDXKXBwl3-1neXavcdbeUjFgJnLy0-U3sRL_oVGfsvk3b961rskG7KhHIHJNbMFg72ELXb1qsM-ieLm_XHaOedBYc70xDv5Q9bJh6jXGqa64nvlO_j5vdH7anYFWNB46lYnY0ouGqIxiAeu7aXEo3lv5USFaJ_rW46yAWlsbFdfM1GJRZUCzGRLzLoEwU0CbL0yVEwaJErzAlvS2Q',
  (SELECT id FROM categories WHERE slug = 'woody'),
  '[{"size": "50ml", "price": 180.00}, {"size": "100ml", "price": 260.00}]',
  '[{"name": "Woody", "icon": "park"}, {"name": "Spicy", "icon": "local_fire_department"}, {"name": "Floral", "icon": "spa"}]',
  '{"top": ["Bergamot", "Pink Pepper"], "heart": ["Rose", "Cedarwood"], "base": ["Amber", "Patchouli", "Musk"]}',
  4.5, 42, true, true
);

-- Hero Banner
INSERT INTO hero_banners (title, subtitle, description, image_url, cta_text, badge_text, is_active) VALUES
(
  'Scents of',
  'Elegance',
  'Discover our exclusive summer collection crafted for moments of pure luxury.',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmz59Oikko0Q3-z9Y_cuN0EOHRAjzIIFzACcv_ZrCxt54PxtmUvsiqUMmLsJ3fWtwR_kHxMWfDhf8RPGi2K0881AEfHAwoTK3_HYNgljZYsPTq20o_wJDF7ZKDJNMa5W7PXo8CnJdt5534EoF2RRXCxdXJ6KFHGrCeJwYnEpquaQHZLWlDfsB-2mv3ijMZrzLJwtnx0J8kjFmWAxyQ5y1rH5X_E5SVXRqVthpiaZV-huqgcFcKw3Qs8EzAoA8HHzgkBMEm1Hz3KIiP',
  'Shop Collection',
  'Limited Edition',
  true
);

-- Orders (matching admin dashboard design)
INSERT INTO orders (customer_name, order_number, status, total) VALUES
  ('Sophie Miller', '#2045', 'pending', 145.00),
  ('James Carter', '#2044', 'shipped', 210.50),
  ('Elena Ray', '#2043', 'shipped', 89.99);
