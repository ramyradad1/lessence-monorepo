export type ProductVariant = {
  id: string;
  product_id: string;
  size_ml: number;
  concentration: string;
  price: number;
  stock_qty: number;
  sku?: string;
  is_active: boolean;
  low_stock_threshold?: number;
  created_at?: string;
  updated_at?: string;
};

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
  variants?: ProductVariant[];
  scent_profiles: { name: string; icon?: string }[];
  fragrance_notes?: { top: string[]; heart: string[]; base: string[] };
  rating: number;
  review_count: number;
  is_new: boolean;
  is_active?: boolean;
  is_limited?: boolean;
  low_stock_threshold?: number;
  gender_target?: 'men' | 'women' | 'unisex';
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
  is_gift?: boolean;
  gift_wrap?: boolean;
  gift_message?: string;
  applied_coupon_id?: string;
  shipping_address_id?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields (optional, from queries)
  customer_name?: string;
  customer_email?: string;
  total?: number; // alias for total_amount for backwards compat
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  admin_notes?: OrderAdminNote[];
};

export type OrderItem = {
  id?: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  bundle_id?: string;
  product_name?: string;
  bundle_name?: string;
  selected_size?: string;
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
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_amount: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  times_used: number;
  min_order_amount?: number;
  first_order_only?: boolean;
  per_user_limit?: number;
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

export interface CartItem extends Partial<Product> {
  quantity: number;
  selectedSize?: string;
  variant_id?: string;
  bundle_id?: string;
  variant?: ProductVariant;
  bundle?: Bundle;
}

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  phone?: string;
  created_at?: string;
};

export type BackInStockSubscription = {
  id: string;
  user_id?: string;
  email?: string;
  product_id: string;
  variant_id?: string;
  status: 'active' | 'notified' | 'cancelled';
  created_at?: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;   // 'back_in_stock' | 'price_drop' | 'order_update' etc.
  title: string;
  body: string;
  data?: Record<string, any>;  // { product_id, variant_id, old_price, new_price, ... }
  is_read: boolean;
  created_at?: string;
};

export type PushToken = {
  id: string;
  user_id: string;
  token: string;
  platform?: 'ios' | 'android' | 'web';
  created_at?: string;
  updated_at?: string;
};

export type NotificationPreferences = {
  user_id: string;
  order_updates: boolean;
  back_in_stock: boolean;
  price_drop: boolean;
  promotions: boolean;
  push_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};


export type Bundle = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  items?: BundleItem[];
  created_at?: string;
  updated_at?: string;
};

export type BundleItem = {
  id: string;
  bundle_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
  created_at?: string;
};

export type AdminNotification = {
  id: string;
  type: string;
  message: string;
  reference_id?: string;
  is_read: boolean;
  created_at?: string;
};

export type CustomerAggregate = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  phone?: string;
  total_orders: number;
  total_spend: number;
  last_order_date?: string;
  created_at?: string;
};

export type AdminNote = {
  id: string;
  customer_id: string;
  admin_id: string;
  admin_name?: string;
  note: string;
  created_at: string;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by?: string;
  changed_by_name?: string;
  created_at: string;
};

export type OrderAdminNote = {
  id: string;
  order_id: string;
  admin_id: string;
  admin_name?: string;
  note: string;
  created_at: string;
};

export type ReturnRequestStatus = 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';

export type ReturnRequest = {
  id: string;
  user_id: string;
  order_id: string;
  status: ReturnRequestStatus;
  reason: string;
  comment?: string;
  admin_notes?: string;
  media_urls: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
  items?: ReturnRequestItem[];
};

export type ReturnRequestItem = {
  id: string;
  return_request_id: string;
  order_item_id: string;
  quantity: number;
  created_at: string;
  // Joined fields
  product_name?: string;
  selected_size?: string;
  price?: number;
};
