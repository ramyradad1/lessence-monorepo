# Critical End-to-End Flows

This document outlines the critical end-to-end execution flows in the repository, traced from the actual codebase. Each flow lists the exact symbols and files involved in sequence.

## 1. Stripe Checkout Flow (Client → Payment → Order Fulfillment)
This is the primary payment flow for card-based transactions via Stripe.
1. User submits checkout → `CheckoutPage` (`apps/web/src/app/[locale]/checkout/...` or Flutter checkout screen)
2. Client calls `create-checkout-session` Edge Function (`packages/supabase/supabase/functions/create-checkout-session/index.ts`)
3. Edge Function validates cart items, prices, stock, and coupons against the database
4. Edge Function creates a Stripe Checkout Session with validated `line_items` and `metadata`
5. User is redirected to Stripe's hosted checkout page
6. On successful payment, Stripe fires a webhook to `stripe-webhook` (`packages/supabase/supabase/functions/stripe-webhook/index.ts`)
7. Webhook verifies signature via `stripe.webhooks.constructEventAsync`
8. Webhook creates: Address → Order → Order Items → Deducts Inventory → Payment Record → Updates Coupon → Clears Cart

## 2. Paymob Checkout Flow (Client → Payment → Order Fulfillment)
The payment flow for Paymob-based transactions (Egypt-centric).
1. User submits checkout → Client calls `create-paymob-order` Edge Function (`packages/supabase/supabase/functions/create-paymob-order/index.ts`)
2. Edge Function validates items, computes prices, creates a Paymob Payment Intention
3. User completes payment on Paymob's iframe/redirect
4. Paymob fires a webhook to `paymob-webhook` (`packages/supabase/supabase/functions/paymob-webhook/index.ts`)
5. Webhook validates HMAC signature (⚠️ currently mocked — returns `true`)
6. Webhook creates: Address → Order → Order Items → Deducts Inventory → Payment Record → Updates Coupon → Clears Cart → Awards Loyalty Points (via `calculate-points` Edge Function)

## 3. Cash-On-Delivery (COD) Order Flow
This flow bypasses payment gateways entirely.
1. User submits checkout with COD method
2. Client calls `create-cod-order` Edge Function (`packages/supabase/supabase/functions/create-cod-order/index.ts`)
3. Edge Function validates items, prices, stock, and coupons
4. Edge Function creates: Address → Order (status: `pending`) → Order Items → Deducts Inventory → Payment Record (status: `cod_pending`) → Updates Coupon → Clears Cart → Awards Loyalty Points

## 4. Server-Validated Order via RPC (create_order)
This flow uses an atomic database RPC for safe order placement.
1. Client calls `create_order` Edge Function (`supabase/functions/create_order/index.ts`)
2. Edge Function authenticates user via JWT
3. Edge Function validates item prices against `product_variants` table
4. Edge Function validates coupon (if provided)
5. Edge Function calls `place_order_transaction` PostgreSQL RPC with all order data
6. RPC atomically: creates order → inserts items → deducts inventory → records payment → updates coupon → clears cart
7. If any step fails, the entire transaction rolls back

## 5. Admin Return Detail Resolution
The admin dashboard loads return request details for processing.
1. `AdminReturnDetailPage` (`apps/web/src/app/[locale]/admin/returns/[id]/page.tsx`)
2. Fetches return request data via `useReturnRequests` hook (`packages/supabase/hooks/useReturnRequests.ts`)
3. Queries `return_requests` table joined with `orders`, `profiles`, and `return_request_items`
4. Renders return details, timeline, and admin action controls

## 6. Admin Bundles Management
The admin dashboard manages product bundles.
1. `AdminBundlesPage` (`apps/web/src/app/[locale]/admin/bundles/page.tsx`)
2. `useAdminProducts` / `useAdminBundles` hooks (`packages/supabase/hooks/useAdminProducts.ts`, `packages/supabase/hooks/useAdminBundles.ts`)
3. Queries `bundles` and `bundle_items` tables
4. Renders CRUD interface for bundle management
