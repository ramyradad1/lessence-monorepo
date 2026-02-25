# Supabase Shared Backend Configuration and Foundation Plan

This document outlines the foundation configuration and strict structure that the dual-client architecture (Next.js & Flutter) will share for the `@lessence` project.

## 1. Directory Structure

- `apps/web`: Next.js Web App.
- `apps/mobile`: Flutter Mobile App.
- `supabase/`: Source of Truth for the Backend.
  - `migrations/`: All DB migrations (Tables, RLS, RPCs, Enums).
  - `functions/`: Edge Functions (Server-side logic like Checkout, Loyalty).
  - `types/`: Generated TypeScript and Dart types synced from DB schema.
  - `seed.sql`: Local development seeds.

## 2. Shared Auth & Session Strategy

- **Source of Truth**: Supabase Auth (`auth.users`).
- **Profile Table**: A `public.user_profiles` table linked via a trigger to `auth.users` on signup. Stores app-specific data (Full Name, Phone, Role).
- **Web App (Next.js)**:
  - SSR Support via `@supabase/ssr`.
  - Sessions handled through server-side Cookies for seamless SSR/Client hydration.
  - Next.js Middleware protects Admin and Auth routes checking the decoded JWT / server session.
- **Mobile App (Flutter)**:
  - Token-based auth via `supabase_flutter`.
  - Session securely persisted via `SharedPreferences` or `flutter_secure_storage`.
  - `Auth.onAuthStateChange` listener to manage application state globally.

## 3. Shared Database Conventions

We must adhere strictly to these patterns across all future migrations:

1. **Naming Conventions**:
    - Tables: `snake_case`, pluralized (e.g., `products`, `user_profiles`, `order_items`).
    - Columns: `snake_case`, descriptive (e.g., `price_egp`, `stock_quantity`).
    - Enums: Lowercase, `snake_case` (e.g., `order_status='pending'`, `payment_status='paid'`).

2. **Standard Audit Fields**:
   Every table that involves user action MUST include:
    - `created_at` (timestamp with time zone, default `now()`)
    - `updated_at` (timestamp with time zone, default `now()`)
    - `created_by` (uuid, reference to `auth.users`, nullable)
    - `updated_by` (uuid, reference to `auth.users`, nullable)

3. **Soft Deletes**:
   Critical tables (Products, Categories, Orders) use `is_active` (boolean, default true) rather than hard deletions to maintain relational integrity.

4. **Security (RLS)**:
   - Default: All tables have `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`.
   - Admin Bypass: Use the Service Role Key ONLY in Edge Functions where strictly required (e.g., final inventory sync), bypassing RLS securely.
   - User Policies: General rule `WHERE user_id = auth.uid()`.

## 4. Initial Service Wrapper Outlines (Abstracted)

Both Web and Mobile clients should mirror these service abstractions to interact with Supabase reliably.

### A. Auth Service
- `signUp(email, password, fullName)`
- `signIn(email, password)`
- `signOut()`
- `getUserProfile()` -> Returns joined `user_profiles` data + Role.

### B. Products Service
- `getProducts(filters, sort, pagination)`
- `getProductDetails(slug)`
- `searchProducts(query)` -> Maps to a Postgres Text Search RPC.

### C. Cart & Pre-Checkout Service
- `syncCart(localItems)` -> Merges guest cart to DB upon login.
- `validateCartStock(items)` -> Triggers Edge Function or RPC to check live DB stock.
- `applyCoupon(cartTotal, code)` -> Edge Function.

### D. Orders & Checkout Service (Server-side critical)
- `createCheckoutSession(cartItems, addressId, paymentMethod)` -> EDGE FUNCTION. Handles idempotent checks, creates pending order in DB, secures payment intent with Paymob, and returns client tokens.
- `getUserOrders(userId)`

### E. Admin Dashboard Service
- `getMetricsSummary()` -> Maps to a single optimized RPC (`get_admin_dashboard_metrics()`).
- `updateOrderStatus(orderId, newStatus)` -> With audit logging.
