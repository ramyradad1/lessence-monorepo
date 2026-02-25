# L'Essence Backend Practices

This guide establishes query patterns, real-time scoping, and edge function usage for Web and Mobile developers. Strict adherence ensures performant data access over Supabase without straining the database.

## 1. Query Optimization Patterns

### 1.1 NO `SELECT *`
**Rule**: Never use `.select('*')` unless absolutely necessary (e.g., small configuration tables).
**Why**: Fetching unneeded columns bloats network transfers and prevents Postgres from relying purely on indexes.

**Example (Bad):**
```typescript
const { data } = await supabase.from('products').select('*');
```

**Example (Good):**
```typescript
const { data } = await supabase
  .from('products')
  .select(`
    id, slug, name_en, name_ar, base_price, is_new, rating,
    product_images!inner(image_url) 
  `)
  .eq('product_images.is_primary', true);
```

### 1.2 Required Pagination
**Rule**: Any query fetching lists (orders, products, users) must be paginated using `.range(from, to)`.

**Example:**
```typescript
const PAGE_SIZE = 25;
const from = page * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;

const { data } = await supabase
  .from('orders')
  .select('id, status, total_amount, created_at')
  .order('created_at', { ascending: false })
  .range(from, to);
```

## 2. Admin Analytics via RPC Only

Do **not** perform analytics processing on the client by fetching all rows (like `useAdminDashboard` previously did). 

**Usage:**
```typescript
const { data, error } = await supabase.rpc('get_admin_dashboard_metrics');

// Returns:
// {
//    totalRevenue: number;
//    orderCount: number;
//    newOrdersCount: number;
//    uniqueCustomers: number;
//    visitorCount: number;
//    chartData: Array<{ date: string, sales: number }>;
// }
```

## 3. Edge Functions Payload Formats

Use specific shape constraints when invoking Edge Functions.

### `create_order`
```typescript
{
  items: Array<{
    product_id: string;
    variant_id: string;
    quantity: number;
    expected_price: number; 
  }>;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  shipping_address_id: string;
  idempotency_key: string; // UUID
  coupon_id?: string;
}
```

## 4. Realtime Usage Limits

The `supabase_realtime` publication has been severely restricted at the database level to limit concurrent connection overhead.

- **Available Tables**: `orders`, `notifications`
- **Restricted Tables**: `visitor_events`, `products`, `carts`, `views`, etc.

**Rule**: Do not add `.on('*', { event: '*', schema: 'public', table: 'product_variants' })`. Use a `staleTime` with `react-query` to rely on polling/cache invalidations instead. Only use realtime subscriptions on User Notifications or Admin Order stream updates.
