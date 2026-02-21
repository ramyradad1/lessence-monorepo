# L'Essence - Production Readiness & Setup Guide

This document outlines the required steps to get the L'Essence cross-platform ecommerce application running in a production or local environment, including necessary environment variables, Supabase configurations, and demo accounts.

## 1. Environment Variables

To run the full stack, you need to populate `.env` files in three locations.

### `apps/web/.env.local`
This file configures the Next.js web application.
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### `apps/mobile/.env`
This file configures the Expo React Native application.
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### `packages/supabase/supabase/.env`
This file configures the Supabase Edge Functions locally. (In production, these must be set in the Supabase Dashboard -> Edge Functions -> Secrets).
```env
STRIPE_SECRET_KEY=sk_test_... (or live key)
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 2. Supabase Setup Guide

### Critical Authentication Settings
For the seamless checkout flow to work across guest and authenticated users without friction:
1. Go to your Supabase Dashboard.
2. Navigate to **Authentication  > Providers > Email**.
3. **Toggle OFF "Confirm email"**. If this is enabled, new users created during checkout cannot immediately log in and will be stuck.

### Edge Functions Deployment
The project relies on two edge functions for Stripe integration. Deploy them using the Supabase CLI:

```bash
cd packages/supabase
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy admin-user-management --no-verify-jwt
```
*(Note: JWT verification is handled inside the functions where appropriate, but routing bypasses standard Gateway JWT requirements for webhooks).*

### Securing the Database (RLS)
The database relies on Row Level Security (RLS) for data protection. Ensure you have applied the latest migrations which contain the policies:
- **Guests**: Read-only access to `products` and `categories`.
- **Authenticated Users**: Read/write access to their own `orders`, `order_items`, and `favorites`.
- **Admins**: Bypass RLS (using Service Role keys in secure Edge Functions) to manage inventory, users, and read all orders.

---

## 3. Local Execution Guide

To run the project locally, ensure you have Node.js and npm installed.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Web Application (Next.js)**
   ```bash
   npm run dev --workspace=apps/web
   ```
   *Runs on http://localhost:3000*

3. **Mobile Application (Expo)**
   ```bash
   npm run start --workspace=apps/mobile
   ```
   *Opens the Expo Dev menu. Press `w` to open in web browser, or scan the QR code with the Expo Go app.*

---

## 4. Production Checklist Status

- [x] **Supabase Migrations Applied**: Inventory seeded and categories configured.
- [x] **Cross-Platform State**: Redux/Contexts configured to sync Cart and Favorites between local storage (guest) and Supabase DB (authenticated).
- [x] **Type Safety**: Workspace compiles cleanly (`tsc --noEmit` verified).
- [ ] **Stripe Production Keys**: User must insert `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` into Supabase Secrets.
- [ ] **Email Confirmation**: User must disable Email Confirmations in Supabase Auth settings.
- [ ] **Vercel Domains**: If deploying to a custom domain, update the `successUrl` and `cancelUrl` in `create-checkout-session` edge function.

---

## 5. Demo Accounts

For testing purposes, the following user configurations are standard:

**Customer Account**
- Acts as a normal user. Can browse, add to cart, checkout, and view their own order history.
- Set up by signing up organically through the app.

**Admin Account**
- **Email**: `ramy.radad@upward.sa`
- **Role**: Has access to `/admin` routes on the web application.
- **Permissions**: Can view total orders, sales analytics, update order statuses, and create/manage users through the Admin Dashboard.
