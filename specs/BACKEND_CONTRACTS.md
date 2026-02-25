# L'Essence Backend Contracts

This document defines the stable data contracts expected by the Web and Flutter clients. Altering these shapes requires a synchronized update across both frontend applications to prevent breaking changes.

## 1. Response Shapes

### 1.1 `ProductDetail` & `ProductList`

**DO NOT** `SELECT *` on products. Use explicit selections to minimize payload.

```typescript
type ProductList = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  base_price: number;
  image_url: string; // From product_images where is_primary = true
  is_new: boolean;
  rating: number;
  review_count: number;
};

type ProductDetail = ProductList & {
  subtitle_en: string;
  subtitle_ar: string;
  description_en: string;
  description_ar: string;
  variants: ProductVariant[];
  images: ProductImage[];
};

type ProductVariant = {
  id: string;
  sku: string;
  size_ml: number;
  concentration_en: string;
  concentration_ar: string;
  price_adjustment: number;
  stock_quantity: number; // For out-of-stock UI states
};
```

### 1.2 `CartResponse`

Cart requests should resolve items to calculate the current subtotal to be displayed to the user.

```typescript
type CartResponse = {
  cart_id: string;
  user_id: string | null;
  session_id: string | null;
  items: CartItemResolved[];
  subtotal: number;
};

type CartItemResolved = {
  id: string; // cart_item.id
  product_id: string;
  variant_id: string;
  quantity: number;
  product: {
    name_en: string;
    name_ar: string;
    image_url: string; // Primary image
  };
  variant: {
    size_ml: number;
    concentration_en: string;
    price: number; // Calculated base_price + price_adjustment
  };
};
```

### 1.3 `OrderResponse`

```typescript
type OrderResponse = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  created_at: string; // ISO 8601
  shipping_address: AddressInfo; // Snapshot
  items: OrderItemSnapshot[];
};

type OrderItemSnapshot = {
  id: string;
  product_id: string;
  variant_id: string;
  product_name_en: string;
  product_name_ar: string;
  sku: string;
  price: number;
  quantity: number;
};
```

### 1.4 `ErrorResponse` Format

Standard RPC error fallback or Edge Function API errors should follow this shape:

```typescript
type ErrorResponse = {
  success: false;
  error: {
    code: string; // e.g. "INSUFFICIENT_STOCK", "INVALID_COUPON"
    message_en: string;
    message_ar: string;
    details?: any; // For debugging internal issues
  }
};
```

## 2. Enums

Database-backed enums to be mirrored on Web/Mobile natively:

- **`user_role`**: `'user'`, `'admin'`, `'super_admin'`
- **`order_status`**: `'pending'`, `'paid'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`, `'refunded'`
- **`payment_status`**: `'pending'`, `'completed'`, `'failed'`, `'refunded'`
- **`return_status`**: `'requested'`, `'approved'`, `'received'`, `'refunded'`, `'rejected'`
