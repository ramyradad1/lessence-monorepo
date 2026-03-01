# Security, RLS & Webhook Architecture

This document outlines the security mechanisms implemented in the repository, focusing on PostgreSQL Row Level Security (RLS), edge function service role usage, webhook verification, and idempotency considerations based on the knowledge graph overview.

## 1. Row Level Security (RLS) Matrix

The system implements a robust RLS policy structure primarily driven by JWT role claims and customized security definer functions (e.g., `get_user_role`, `is_super_admin`, `is_order_manager`).

| Table / Domain | Public / Unauthenticated | Regular Authenticated Users | Managers (Content/Inventory/Order) | Super Admin |
| :--- | :--- | :--- | :--- | :--- |
| **`user_profiles`** | None | SELECT/UPDATE (own profile only) | SELECT/UPDATE (own profile only) | ALL (Full CRUD) |
| **`categories`** | SELECT (if `is_active=true`) | SELECT (if `is_active=true`) | ALL (Content Managers) | ALL |
| **`products`** | SELECT (if `is_active=true`) | SELECT (if `is_active=true`) | ALL (Content/Inventory Managers) | ALL |
| **`product_variants`** | SELECT (if `is_active=true`) | SELECT (if `is_active=true`) | ALL (Content/Inventory Managers) | ALL |
| **`favorites`** | None | ALL (own favorites only) | ALL (own favorites only) | ALL (own favorites only) |
| **`carts` & `cart_items`**| ALL (via `session_id`) | ALL (via `user_id`) | ALL (own carts) | ALL |
| **`addresses`** | None | ALL (own addresses only) | ALL (own addresses only) | ALL (own addresses only) |
| **`orders`** | None | SELECT (own orders only) | UPDATE (Order Managers) | ALL |
| **`payments`** | None | SELECT (own payments only) | SELECT / UPDATE | ALL |
| **`reviews`** | SELECT (if `is_approved=true`) | INSERT, UPDATE/DELETE (own) | ALL (Content Managers) | ALL |
| **`loyalty_accounts`** | None | SELECT (own account only) | SELECT | ALL |
| **`admin_audit_logs`** | None | None | None | SELECT |

> **Note**: Several tables restrict `INSERT` entirely at the client level (e.g., `orders`, `payments`, `loyalty_accounts`). These are mutated exclusively via Supabase Edge Functions using the `service_role` key.

## 2. Service Role Usage

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It is used exclusively in secured backend environments (Supabase Edge Functions) to perform elevated actions safely. 

Identified usage areas:
- **`create_order` Function**: Deducts inventory and atomic operations missing from client capabilities.
- **`stripe-webhook` Function**: Inserts records into `orders`, `order_items`, `payments`, updates `product_variants` stock, updates `coupons`, and clears `carts`.
- **`paymob-webhook` Function**: Mirrors Stripe behavior, additionally invokes internal specific functions like `calculate-points`.

## 3. Webhook Security Verification

Webhooks are crucial entry points into the system to fulfill financial transactions. Both Stripe and Paymob endpoints rely on payload validation.

### Stripe
- Uses `stripe.webhooks.constructEventAsync` utilizing `STRIPE_WEBHOOK_SECRET`.
- Cryptographically verifiable header (`stripe-signature`).
- Strict validation protects against payload spoofing.

### Paymob
- Uses a custom `verifyHmac(rawBody, hmacHeader, hmacSecret)` function.
- **⚠️ Critical**: The current implementation is **completely mocked** — `verifyHmac` always returns `true` regardless of inputs. This means any attacker can send fabricated webhook payloads to create fraudulent orders.
- If `PAYMOB_HMAC_SECRET` is not set, it returns `true` immediately.
- Even if the secret is set, the function still returns `true` due to a hardcoded `return true` at line 20.
- **This must be replaced with a proper HMAC-SHA512 verification before production deployment.**

## 4. Idempotency Considerations

### The Problem
Payment providers (Stripe, Paymob) enforce "at-least-once" delivery for webhooks. Therefore, the same successful payment event might be delivered multiple times.

### Current Status
- **`create_order` Edge Function**: ✅ Has idempotency — accepts an `idempotency_key` parameter and passes it to the `place_order_transaction` PostgreSQL RPC, which handles deduplication atomically.
- **Stripe & Paymob Webhooks**: ❌ No idempotency — the current implementation handles `checkout.session.completed` (Stripe) and successful transactions (Paymob) by directly inserting an order with a randomized `order_number`, deducting inventory, and inserting payment records.
- **`create-cod-order`**: ❌ No idempotency — similar sequential writes without deduplication.
- **⚠️ Risk**: Processing the same webhook twice will create duplicate orders and deduct inventory twice.

### Recommendations
1. **Idempotency Keys for Webhooks**: Implement a `handled_webhook_events` deduplication table (as detailed in `IDEMPOTENCY_STRATEGY.md`) to track processed webhook event IDs.
2. **`UNIQUE` Constraints**: Add `UNIQUE(provider, transaction_id)` to the `payments` table to prevent duplicate payment records.
3. **Atomic Operations**: Migrate webhook order-creation logic to a PostgreSQL RPC (similar to `place_order_transaction`) for atomic execution.
