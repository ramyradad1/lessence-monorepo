# Data Model & Backend Architecture

This document outlines the primary data entities required for the Perfumes ecommerce app, matching the Supabase backend schema and adhering to LATEST-TECH backend best practices (2026).

## Backend Principles

1. **PostgreSQL-first schema design**: Strong typing, constraints, and indexes.
2. **Strict RLS**: Row Level Security policies applied to all tables. No open access.
3. **Sensitive Logic Server-Side**: Edge Functions/RPCs for checkout, payments, inventory, and points.
4. **Idempotency & Transactional Safety**: Guaranteed execution bounds for financial and inventory operations.
5. **Aggregates via RPC/Views**: No client-side math for heavy operations.
6. **Observability**: Structured logging and slow query diagnostics via Supabase.

## Entities

### `products`
The central catalog of perfumes.
- `id` (uuid, pk, indexed)
- `title_en` (text, non-null)
- `title_ar` (text, non-null)
- `description_en` (text)
- `description_ar` (text)
- `price` (numeric, non-null, > 0) - Stores price in EGP
- `stock_quantity` (int, default 0, check >= 0)
- *Policies*: Select (anon/auth), Insert/Update/Delete (admin only)

### `orders`
Customer purchases. State machine driven.
- `id` (uuid, pk)
- `user_id` (uuid, fk -> auth.users, indexed)
- `total_price` (numeric, non-null, > 0)
- `status` (text, check in ('pending', 'paid', 'shipped', 'cancelled'))
- `idempotency_key` (text, unique) - Prevents double charges/orders
- *Policies*: Select (own orders), Insert (via RPC/Edge Function only)

### `users` (managed by Supabase Auth)
Customer accounts.
- `id` (uuid, pk)
- `email` (text, unique)
- `role` (text, default 'customer')
