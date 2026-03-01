# Edge Functions Error Handling & Logging Audit

This document reviews the error handling, logging observability, and HTTP response safety within the core Supabase Edge Functions (`create_order`, `create-checkout-session`, `create-cod-order`, `stripe-webhook`, and `paymob-webhook`).

## 1. Current State Overview

All major edge functions utilize a top-level `try...catch` block to prevent unhandled promise rejections from crashing the isolated Deno worker. 

However, there is a systemic lack of granular error checking, specifically during sequential database operations (like inventory deduction and coupon application).

### Detailed Findings by Function

#### `create_order` (`supabase/functions/create_order/index.ts`)
- **RPC-based**: This function now correctly delegates all write operations to the `place_order_transaction` RPC, which runs atomically inside a PostgreSQL transaction. This eliminates the sequential-mutation vulnerability described for the webhook functions.
- **Idempotency**: Accepts an `idempotency_key` parameter and passes it to the RPC, providing protection against duplicate submissions.
- **Missing Logs**: Inside the `catch (err: unknown)` block, only `err.message` is extracted and returned to the client without logging the full error object to the Edge Function console (`console.error(err)` is missing in the outermost block).
- **Client Visibility**: The RPC error path returns `rpcError?.message || rpcResult.error` directly in the 400 response, which can potentially leak database schema details if the Postgres error is verbose.

#### `create-checkout-session` (`packages/supabase/supabase/functions/create-checkout-session/index.ts`)
- **Purpose**: Creates a Stripe Checkout Session with server-validated prices. Does not create orders directly — order creation happens in the `stripe-webhook` upon payment completion.
- **Missing Logs**: The catch block returns `error.message` directly to the client without `console.error`, losing server-side observability.

#### `create-cod-order` (`packages/supabase/supabase/functions/create-cod-order/index.ts`)
- **Sequential Writes**: Like the webhooks, this function performs sequential database operations (address → order → items → inventory → payment → coupon → cart → loyalty) without a wrapping RPC transaction.
- **Swallowed Errors**: Inventory deduction, payment record, and coupon/cart operations do not check `{ error }` responses from Supabase.
- **Recommendation**: Migrate to a single `place_order_transaction` RPC call (similar to `create_order`) for atomic execution.

#### `stripe-webhook` (`packages/supabase/supabase/functions/stripe-webhook/index.ts`)
- **Swallowed Errors**: Inside the webhook, there are critical sequential DB operations:
  1. Creating the order
  2. Creating order items
  3. Deducting inventory (in a `for` loop)
  4. Creating the payment record
  5. Updating the coupon
  6. Clearing the cart
- **The Issue**: For operations 3 (Inventory), 4 (Payment), 5 (Coupon), and 6 (Cart Deletion), the code uses `await supabaseClient.from(...).update(...)` **without extracting or checking** the `{ error }` object. If `update({ stock_qty: newQty })` fails silently inside the loop, the order continues, leaving inventory incorrect, and no log error is ever emitted because it doesn't throw.
- **Retries**: The top-level `catch` block returns standard HTTP `500`. Stripe's retry policy correctly interprets this and will retry the webhook delivery for up to 3 days.

#### `paymob-webhook` (`packages/supabase/supabase/functions/paymob-webhook/index.ts`)
- **Swallowed Errors**: Similar to Stripe, inventory deductions, payment record insertions, and coupon updates are fired off without checking the Supabase `{ error }` response.
- **Bad Error Visibility**: The top-level catch block logs `console.error('Webhook error:', err.message)` and returns `err.message` directly in the response body, which both strips the stack trace (making debugging hard) and leaks internal error details to external callers.
- **Retries**: The catch block returns HTTP `400` with the raw error message. Paymob interprets `400` as a permanent failure (client error) rather than a server error (`500`). This completely breaks Paymob's automatic retry mechanism, meaning transient database blips will cause permanently lost orders.

## 2. Proposed Improvements

To assure reliability in financial Webhooks and Orders, the following exact improvements are strictly recommended.

### Improvement 1: Extract and Check Every Data Mutation
Never run `await supabaseClient` without checking for the `error` object or explicitly throwing it.

**Status Quo (Insecure/Swallowed):**
```typescript
await supabaseClient
  .from('product_variants')
  .update({ stock_qty: newQty })
  .eq('id', variant_id);
```

**Patch (Reliable):**
```typescript
const { error: invError } = await supabaseClient
  .from('product_variants')
  .update({ stock_qty: newQty })
  .eq('id', variant_id);

if (invError) {
    console.error(`Failed to update inventory for variant ${variant_id} on order ${order.id}:`, invError);
    // Depending on severity, either throw to Abort the webhook or log prominently for manual reconciliation.
}
```

### Improvement 2: Migrate Webhook Logic to Database RPC
Performing multiple sequential database queries inside a Deno worker over the network (Order -> Items -> Inventory loop -> Payments -> Cart) is highly prone to network transient failures and race conditions, especially without transactions.

**Patch**: Create a large PostgreSQL RPC `fulfill_webhook_order(payload)` that executes all 6 steps within a single ACID transaction. Thus, if the coupon update step fails, the entire transaction rolls back cleanly so the Webhook provider can safely retry without leaving partial database state.

### Improvement 3: Fix Logging & Retry Status Codes
**Patch for `paymob-webhook/index.ts` & `stripe-webhook/index.ts`:**
```typescript
  } catch (err: any) {
    // 1. Log the full object, not just the message string
    console.error('Webhook Execution Failed with full trace:', err);
    
    // 2. Return 500 for internal errors so Payment gateways actually retry
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
```

### Improvement 4: Sanitize Output
Ensure `create_order` masks database errors:
```typescript
    if (rpcError) {
       console.error("Critical RPC Error:", rpcError);
       // Mask the error so users don't see Postgres internals
       return new Response(JSON.stringify({ error: 'Checkout failed due to a system error. Please try again.' }), { status: 500 });
    }
```
