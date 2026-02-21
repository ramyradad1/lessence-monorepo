export type Product = {
  id: string;
  name: string;
  slug?: string;
  subtitle: string;
  description: string;
  price: number;
  sku?: string;
  image_url: string;
  images?: string[];
  category_id: string;
  size_options: { size: string; price: number }[];
  scent_profiles: { name: string; icon?: string }[];
  fragrance_notes?: { top: string[]; heart: string[]; base: string[] };
  rating: number;
  review_count: number;
  is_new: boolean;
  is_active?: boolean;
  is_limited?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  sort_order?: number;
  created_at?: string;
};

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type Order = {
  id: string;
  user_id?: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount?: number;
  total_amount: number;
  applied_coupon_id?: string;
  shipping_address_id?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields (optional, from queries)
  customer_name?: string;
  customer_email?: string;
  total?: number; // alias for total_amount for backwards compat
  items?: OrderItem[];
};

export type OrderItem = {
  id?: string;
  order_id: string;
  product_id: string;
  product_name: string;
  selected_size: string;
  price: number;
  quantity: number;
  created_at?: string;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  transaction_id?: string;
  created_at?: string;
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_amount: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  times_used: number;
  created_at?: string;
};

export type Inventory = {
  id: string;
  product_id: string;
  size: string;
  quantity_available: number;
  updated_at?: string;
};

export type AdminAuditLog = {
  id: string;
  admin_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  changes?: Record<string, any>;
  created_at?: string;
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default?: boolean;
  created_at?: string;
};

export type HeroBanner = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  cta_text: string;
  badge_text: string;
};

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at?: string;
};
