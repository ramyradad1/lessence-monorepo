# PostgreSQL RLS Coverage & Security Matrix

This document analyzes the Row-Level Security (RLS) coverage for all sensitive tables, lists identified weak policies, and provides an audit of the `service_role` key usage across the repository.

## 1. RLS Coverage Matrix

| Table | RLS Enabled | Read Access (SELECT) | Write Access (INSERT/UPDATE/DELETE) | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | ✅ Yes | **Public** (Everyone) | Owner (`uid = id`) & Admins | ⚠️ Medium |
| **`orders`** | ✅ Yes | Owner (`uid = user_id`) | Users (INSERT) & Admins (ALL) | 🚨 High |
| **`order_items`** | ✅ Yes | Owner | Admins (ALL) | 🔒 Low |
| **`payments`** | ✅ Yes | Owner | Admins (ALL) | 🔒 Low |
| **`carts` & `cart_items`**| ✅ Yes | Owner (via `user_id` or `session_id`) | Owner (via `user_id` or `session_id`) | ⚠️ Medium |
| **`addresses`** | ✅ Yes | Owner | Owner | 🔒 Low |
| **`reviews`** | ✅ Yes | Public (if `is_approved=true`) or Owner | Owner (INSERT/UPDATE) & Admins | 🚨 High |
| **`admin_audit_logs`** | ✅ Yes | Admins | Service Role Only (Implicit via Edge) | 🔒 Low |
| **`visitor_events`** | ✅ Yes | Admins / Service Role | Service Role Only | 🔒 Low |

---

## 2. Missing & Weak Policies

Based on the current Supabase SQL migrations, the following critical RLS vulnerabilities have been identified:

### 🚨 Critical Vulnerability 1: Fraudulent Order Insertion
**Table:** `orders`
**Current Policy:** `CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);`
**Why it's weak:** This policy successfully mandates that users can only place orders for themselves. However, it completely fails to validate the payload contents. A malicious user can connect directly to the Supabase URL via REST or GraphQL and insert an order where `total_amount = 0`, or manipulate the `subtotal` and `discount_amount`.
**Recommendation:** Completely disable client-side `INSERT` access for `orders`. Orders should ONLY be generated on the server (e.g., inside the `create_order` Edge Function or Webhook) using the `service_role` key after prices are verified against the database.

### 🚨 Critical Vulnerability 2: Malicious Review Approval
**Table:** `reviews`
**Current Policy:** `CREATE POLICY "Users can create and update own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);`
**Why it's weak:** The `reviews` table has an `is_approved` boolean column designed for admin moderation. The current `WITH CHECK` condition only validates `user_id`. A malicious user can submit `{ "comment": "Spam", "rating": 5, "is_approved": true }` to instantly bypass the admin approval queue.
**Recommendation:** Enforce `is_approved = false` directly within the `CHECK` condition or remove the column from client-facing roles entirely.

### ⚠️ Medium Vulnerability 1: Data Leakage of `profiles`
**Table:** `profiles`
**Current Policy:** `CREATE POLICY "Public profiles are readable by everyone" ON profiles FOR SELECT USING (true);`
**Why it's weak:** Any unauthenticated or authenticated user can perform `SELECT * FROM profiles`. If the `profiles` table stores sensitive information like physical addresses, phone numbers, or private emails beyond `auth.users`, it represents a massive data leakage risk.
**Recommendation:** Restrict `SELECT` to `(auth.uid() = id OR is_admin())` unless public profiles are truly a core feature (like a social network).

### ⚠️ Medium Vulnerability 2: `session_id` Hijacking
**Table:** `carts` and `cart_items`
**Current Policy:** `USING (auth.uid() = user_id OR session_id IS NOT NULL)`
**Why it's weak:** If `session_id` is highly predictable or susceptible to brute-forcing, an attacker can enumerate guest carts or steal them by simply providing the target's `session_id`.
**Recommendation:** Ensure `session_id` tokens are generated via cryptographically secure randomness (UUIDv4) and rotate immediately upon checkout login.

---

## 3. `service_role` Usage & Client-Side Risk

A full workspace audit was conducted (using `grep`) to explicitly look for the string `SUPABASE_SERVICE_ROLE_KEY` across the repository.

**Audit Findings:**
* **`apps/web` (Next.js Application):** Clean. No references found.
* **`apps/mobile` (Flutter Application):** Clean. No references found.
* **`packages/supabase/supabase/functions` (Edge Functions):** Heavy usage in webhooks (`stripe-webhook`, `paymob-webhook`) and the `create_order` RPC handler.

**Verdict:** 
The `service_role` key is **strictly server-only**. There is **ZERO** client-side risk of the `service_role` key leaking into the browser or mobile application bundles based on the current codebase. Usage in edge functions correctly allows the backend to securely bypass RLS to fulfill orders and modify inventory atomic quantities.
