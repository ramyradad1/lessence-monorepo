-- 1) Extensions & Functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2) Custom Enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE return_status AS ENUM ('requested', 'approved', 'received', 'refunded', 'rejected');


-- 3) Base Tables

-- User Profiles (extends auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    image_url TEXT,
    icon TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Translation metadata
    translation_status TEXT DEFAULT 'pending',
    translation_source TEXT,
    translated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    slug TEXT UNIQUE NOT NULL,
    sku TEXT UNIQUE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_ar TEXT,
    description_en TEXT,
    description_ar TEXT,
    
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_new BOOLEAN DEFAULT FALSE NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INT DEFAULT 0 CHECK (review_count >= 0),
    
    -- Translation metadata
    translation_status TEXT DEFAULT 'pending',
    translation_source TEXT,
    translated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Product Variants
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    size_ml INT,
    concentration_en TEXT,
    concentration_ar TEXT,
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    
    -- Inventory fields directly on variant for clean design as requested
    stock_quantity INT DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
    low_stock_threshold INT DEFAULT 10,
    
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Product Images
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text_en TEXT,
    alt_text_ar TEXT,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4) Carts & Favorites

-- Favorites (Wishlist)
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Carts
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    session_id TEXT UNIQUE, -- For guest carts
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Cart Items
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(cart_id, product_id, variant_id)
);

-- 5) Ordering & Addresses

-- Addresses
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT, -- e.g. "Home", "Work"
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'EG',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Order Constraints handling
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending'::order_status NOT NULL,
    
    -- Snapshotted Totals
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    
    -- Address Snapshot (in case physical address gets deleted/changed)
    shipping_address JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Order Items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    
    -- Snapshotted Info
    product_name_en TEXT NOT NULL,
    product_name_ar TEXT NOT NULL,
    sku TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider TEXT NOT NULL, -- 'paymob', 'stripe', 'cod'
    transaction_id TEXT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status payment_status DEFAULT 'pending'::payment_status NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6) Admin & Operations

-- Order Status History
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Order Admin Notes
CREATE TABLE public.order_admin_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Coupons
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2), -- Cap for percentage discounts
    usage_limit INT, -- NULL means unlimited
    times_used INT DEFAULT 0 CHECK (times_used >= 0),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Coupon Redemptions
CREATE TABLE public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10, 2) NOT NULL CHECK (discount_applied >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reviews
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(product_id, user_id)
);

-- Loyalty Accounts
CREATE TABLE public.loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    points_balance INT DEFAULT 0 NOT NULL CHECK (points_balance >= 0),
    tier TEXT DEFAULT 'bronze' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Loyalty Transactions
CREATE TABLE public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    points INT NOT NULL, -- positive for earn, negative for spend
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'refunded', 'manual_adjustment')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Back In Stock Subscriptions
CREATE TABLE public.back_in_stock_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT email_or_user CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_ar TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'order_update', 'promo'
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Admin Audit Logs
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'UPDATE_ORDER_STATUS', 'CREATE_PRODUCT'
    target_table TEXT NOT NULL,
    record_id UUID,
    changes JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Visitor Events (Basic telemetry)
CREATE TABLE public.visitor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'page_view', 'add_to_cart', 'search'
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- 7) Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_order_admin_notes_updated_at BEFORE UPDATE ON public.order_admin_notes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER update_loyalty_accounts_updated_at BEFORE UPDATE ON public.loyalty_accounts FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


-- 8) Indexes for performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_approved ON public.reviews(product_id) WHERE is_approved = TRUE;

CREATE INDEX idx_visitor_events_type ON public.visitor_events(event_type);
CREATE INDEX idx_visitor_events_created_at ON public.visitor_events(created_at DESC);
