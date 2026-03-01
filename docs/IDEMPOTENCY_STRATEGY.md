# Webhook Idempotency Strategy

## Current Status and Vulnerability

Currently, the payment webhook integrations (`stripe-webhook`, `paymob-webhook`) lack idempotency safeguards. This means that if a payment provider (which guarantees "at-least-once" delivery) sends the exact same successful payment event twice due to a network retry:
1. **Duplicate Orders**: Both webhooks generate a completely randomized `order_number` (`ORD-${Date.now()}-${Math.random()}`). Thus, the database `UNIQUE` constraint on `orders.order_number` is bypassed, creating duplicate orders.
2. **Duplicate Inventory Deductions**: The webhooks naively subtract from `product_variants.stock_qty` multiple times.
3. **Duplicate Payments**: Multiple entries are inserted into the `payments` table.

> **Note**: The `create_order` Edge Function (`supabase/functions/create_order/index.ts`) already accepts an `idempotency_key` parameter and passes it to the `place_order_transaction` RPC, which provides protection against duplicate submissions for client-initiated orders. The webhook functions, however, lack this safeguard.

## Proposed Strategy

We must implement a strict idempotency lock based on the unique event ID provided by the payment gateway (e.g., Stripe's `event.id` or Paymob's `transaction_id`). 

The best strategy combines a dedicated deduplication table (`handled_webhook_events`) with an atomic database function check, or simple Edge Function lookup combined with a UNIQUE constraint.

### Step 1: Database Migration (Dedupe Table & Constraint)
**Location:** `supabase/migrations/[timestamp]_add_idempotency_table.sql` (Create new file)

```sql
-- Create a table specifically to track processed webhooks to prevent duplicate execution
CREATE TABLE handled_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL, -- 'stripe' or 'paymob'
  event_id text NOT NULL, -- e.g., evt_12345
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(provider, event_id)
);

-- Optional: Also add a unique constraint to payments to prevent double-logging
ALTER TABLE payments ADD CONSTRAINT unique_provider_transaction UNIQUE (provider, transaction_id);
```

### Step 2: Edge Function Idempotency Patch (Stripe)
**Location:** `packages/supabase/supabase/functions/stripe-webhook/index.ts`

Right after verifying the webhook signature and instantiating `supabaseClient`, inject this check:

```typescript
// Add this right before `if (event.type === 'checkout.session.completed')`
const idempotencyKey = event.id; // Stripe event ID is unique

// Attempt to insert the event into our deduplication tracking table.
// If it fails (due to the UNIQUE constraint), this webhook was already processed.
const { error: lockError } = await supabaseClient
  .from('handled_webhook_events')
  .insert([{ provider: 'stripe', event_id: idempotencyKey }]);

if (lockError) {
  // 23505 is the Postgres code for unique_violation
  if (lockError.code === '23505') {
    console.log(`Duplicate webhook event blocked: ${idempotencyKey}`);
    // Return 200 so Stripe stops retrying
    return new Response('Webhook already processed', { status: 200 });
  }
  // If it's another DB error, it's safer to fail 500 and let Stripe retry later
  throw new Error(`Failed to acquire idempotency lock: ${lockError.message}`);
}
```

### Step 3: Edge Function Idempotency Patch (Paymob)
**Location:** `packages/supabase/supabase/functions/paymob-webhook/index.ts`

Inside the webhook handler, extract the Paymob `transaction_id` (from Paymob's `obj.id` or `obj.order.id`) and apply the same logic.

```typescript
const payloadObj = JSON.parse(rawBody);
// Assuming Payload contains obj.id as the unique transaction reference
const idempotencyKey = payloadObj.obj.id.toString(); 

const { error: lockError } = await supabaseClient
  .from('handled_webhook_events')
  .insert([{ provider: 'paymob', event_id: idempotencyKey }]);

if (lockError) {
  if (lockError.code === '23505') {
    console.log(`Duplicate Paymob webhook blocked: ${idempotencyKey}`);
    return new Response('Webhook already processed', { status: 200 });
  }
  throw new Error(`Failed to acquire idempotency lock: ${lockError.message}`);
}
```

### Why this approach?
- **Atomicity**: Relies on Postgres `UNIQUE` constraint on `handled_webhook_events(provider, event_id)`. Two concurrent webhooks executing simultaneously will race to insert; only one succeeds, the other fails and safely returns 200 OK.
- **Decoupled**: We don't have to alter the `orders` creation code to inject the external `session.id` logic right away, though adding a `stripe_session_id` to `orders` is also highly recommended moving forward.
