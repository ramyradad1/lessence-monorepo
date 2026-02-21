-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to ensure a clean migration (USE WITH CAUTION in production)
drop table if exists visitor_events cascade;
drop table if exists admin_audit_logs cascade;
drop table if exists reviews cascade;
drop table if exists payments cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists coupons cascade;
drop table if exists addresses cascade;
drop table if exists cart_items cascade;
drop table if exists carts cascade;
drop table if exists favorites cascade;
drop table if exists inventory cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists profiles cascade;

-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products
create table products (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories on delete set null,
  name text not null,
  slug text not null unique,
  subtitle text,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  sku text not null unique,
  image_url text,
  images jsonb default '[]'::jsonb,
  is_active boolean default true,
  is_new boolean default false,
  scent_profiles jsonb default '[]'::jsonb,
  size_options jsonb default '[]'::jsonb,
  rating numeric(3, 2) default 0,
  review_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Inventory
create table inventory (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products on delete cascade not null,
  size text not null,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (product_id, size)
);

-- 5. Favorites
create table favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 6. Carts
create table carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade, -- can be null for guest carts
  session_id text, -- for guest carts
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Cart Items
create table cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references carts on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  selected_size text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (cart_id, product_id, selected_size)
);

-- 8. Addresses
create table addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  phone text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Coupons
create table coupons (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_amount numeric(10, 2) not null check (discount_amount > 0),
  is_active boolean default true,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  usage_limit integer,
  times_used integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Orders
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  order_number text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal numeric(10, 2) not null,
  discount_amount numeric(10, 2) default 0,
  total_amount numeric(10, 2) not null,
  applied_coupon_id uuid references coupons on delete set null,
  shipping_address_id uuid references addresses on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Order Items
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  product_id uuid references products on delete set null,
  product_name text not null,
  selected_size text not null,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Payments
create table payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  amount numeric(10, 2) not null,
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  provider text not null, -- e.g., 'stripe', 'paypal'
  transaction_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Reviews
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  is_approved boolean default false, -- Needs admin approval
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 14. Admin Audit Logs
create table admin_audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. Visitor Events
create table visitor_events (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  user_id uuid references auth.users on delete set null,
  event_type text not null,
  url text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Setup

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table favorites enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table addresses enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table admin_audit_logs enable row level security;
alter table visitor_events enable row level security;

-- Profiles Policies
create policy "Public profiles are readable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can manage all profiles" on profiles for all using (is_admin());

-- Categories Policies
create policy "Categories are readable by everyone" on categories for select using (true);
create policy "Admins can manage categories" on categories for all using (is_admin());

-- Products Policies
create policy "Active products are readable by everyone" on products for select using (is_active = true or is_admin() = true);
create policy "Admins can manage products" on products for all using (is_admin());

-- Inventory Policies
create policy "Public can view inventory" on inventory for select using (true);
create policy "Admins can manage inventory" on inventory for all using (is_admin());

-- Favorites Policies
create policy "Users can manage own favorites" on favorites for all using (auth.uid() = user_id);

-- Carts Policies
create policy "Users can manage own carts" on carts for all using (auth.uid() = user_id or session_id is not null);

-- Cart Items Policies
create policy "Users can manage own cart items" on cart_items for all using (
  exists (
    select 1 from carts
    where carts.id = cart_items.cart_id and (carts.user_id = auth.uid() or carts.session_id is not null)
  )
);

-- Addresses Policies
create policy "Users can manage own addresses" on addresses for all using (auth.uid() = user_id);

-- Coupons Policies
create policy "Admins can manage coupons" on coupons for all using (is_admin());
create policy "Users can read active coupons" on coupons for select using (is_active = true);

-- Orders Policies
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Admins can manage all orders" on orders for all using (is_admin());

-- Order Items Policies
create policy "Users can view own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Admins can manage all order items" on order_items for all using (is_admin());

-- Payments Policies
create policy "Users can view own payments" on payments for select using (
  exists (select 1 from orders where orders.id = payments.order_id and orders.user_id = auth.uid())
);
create policy "Admins can manage all payments" on payments for all using (is_admin());

-- Reviews Policies
create policy "Approved reviews are readable by everyone" on reviews for select using (is_approved = true or auth.uid() = user_id or is_admin() = true);
create policy "Users can create and update own reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews" on reviews for delete using (auth.uid() = user_id);
create policy "Admins can manage all reviews" on reviews for all using (is_admin());

-- Admin Audit Logs Policies
create policy "Only admins can view audit logs" on admin_audit_logs for select using (is_admin());

-- Visitor Events Policies
create policy "Service role can manage visitor events" on visitor_events for all using (true); -- Usually handled securely via Edge Functions or authenticated client endpoints

-- ========================================================================================
-- SEED DATA
-- ========================================================================================

-- Insert Categories
INSERT INTO categories (name, slug, description) VALUES
  ('All Scents', 'all-scents', 'Discover our entire collection of luxury fragrances.'),
  ('Floral', 'floral', 'Delicate, romantic, and blooming with spring essence.'),
  ('Woody', 'woody', 'Earthy, deep, and grounded sophisticated notes.'),
  ('Citrus', 'citrus', 'Bright, fresh, and energizing uplifting aromas.'),
  ('Oriental', 'oriental', 'Warm, spicy, and passionately exotic blends.');

-- Insert Products
WITH
  cat_floral AS (SELECT id FROM categories WHERE slug = 'floral' LIMIT 1),
  cat_woody AS (SELECT id FROM categories WHERE slug = 'woody' LIMIT 1),
  cat_citrus AS (SELECT id FROM categories WHERE slug = 'citrus' LIMIT 1)
INSERT INTO products (category_id, name, slug, subtitle, description, price, sku, image_url, is_new, scent_profiles, size_options) VALUES
  (
    (SELECT id FROM cat_floral), 'Velvet Rose', 'velvet-rose', 'EAU DE PARFUM',
    'A majestic blend of deep damask rose and smooth velvet accords.',
    120.00, 'VR-EDP-50', 'https://images.unsplash.com/photo-1594035910387-fea47794261f', true,
    '[{"name": "Floral"}, {"name": "Musk"}]'::jsonb,
    '[{"size": "50ml", "price": 120.00}, {"size": "100ml", "price": 180.00}]'::jsonb
  ),
  (
    (SELECT id FROM cat_woody), 'Midnight Oud', 'midnight-oud', 'INTENSE PARFUM',
    'Dark, mysterious agarwood with whispers of midnight smoke.',
    145.00, 'MO-INT-50', 'https://images.unsplash.com/photo-1615160868846-9b8e97495b59', false,
    '[{"name": "Woody"}, {"name": "Smoky"}]'::jsonb,
    '[{"size": "50ml", "price": 145.00}, {"size": "100ml", "price": 210.00}]'::jsonb
  ),
  (
    (SELECT id FROM cat_citrus), 'Citrus Breeze', 'citrus-breeze', 'EAU DE TOILETTE',
    'A refreshing burst of Sicilian lemon and coastal sea breezes.',
    95.00, 'CB-EDT-50', 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad', true,
    '[{"name": "Citrus"}, {"name": "Fresh"}]'::jsonb,
    '[{"size": "50ml", "price": 95.00}, {"size": "100ml", "price": 140.00}]'::jsonb
  ),
  (
    (SELECT id FROM cat_woody), 'Noire Essence', 'noire-essence', 'EAU DE PARFUM',
    'A sophisticated modern spice composition with deep amber undertones.',
    180.00, 'NE-EDP-50', 'https://images.unsplash.com/photo-1590156546946-ce55a12a6a1d', false,
    '[{"name": "Woody"}, {"name": "Spicy"}]'::jsonb,
    '[{"size": "50ml", "price": 180.00}, {"size": "100ml", "price": 260.00}]'::jsonb
  );
