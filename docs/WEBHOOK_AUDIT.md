# Webhook Endpoint Audit

This document reviews all webhook endpoints in the repository, showcasing their current signature or HMAC verification and proposing concrete patches where verification is missing or incomplete.

## 1. Stripe Webhook (`packages/supabase/supabase/functions/stripe-webhook/index.ts`)

**Status:** Secure.  
The Stripe webhook correctly utilizes `stripe.webhooks.constructEventAsync` to compute and verify the HMAC signature provided by Stripe.

**Current Code:**
```typescript
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  // ...
  let event: Stripe.Event

  try {
    const bodyText = await req.text()
    event = await stripe.webhooks.constructEventAsync(
      bodyText,
      signature,
      endpointSecret
    )
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message)
    return new Response(err.message, { status: 400 })
  }
```

---

## 2. Paymob Webhook (`packages/supabase/supabase/functions/paymob-webhook/index.ts`)

**Status:** Insecure / Mocked.  
The Paymob webhook contains a mocked `verifyHmac` function that simply returns `true` bypassing security validation.

**Current Code:**
```typescript
async function verifyHmac(payload: string, hmac: string, secret: string) {
    // Note: Paymob computes HMAC differently...
    // For safety and to keep checkout working during this PoC, if HMAC_SECRET isn't present, we'll allow it.
    if (!secret) return true;

    // TODO: Implement Paymob's 14-field concatenation based on payload.
    return true; 
}

// ... inside serve ...
const hmacSecret = Deno.env.get('PAYMOB_HMAC_SECRET') ?? ''
const rawBody = await req.text();
const hmacHeader = req.headers.get('hmac');

const isValid = await verifyHmac(rawBody, hmacHeader || '', hmacSecret);
if (!isValid) {
    console.error('Invalid HMAC signature');
    return new Response('Invalid signature', { status: 401 });
}
```

**Proposed Patch:**
Location: `packages/supabase/supabase/functions/paymob-webhook/index.ts`  
Replace the `verifyHmac` function with standard WebCrypto HMAC-SHA512 validation over Paymob's concatable fields (or raw payload, depending on the exact Paymob transaction structure being used). Assuming Paymob NextGen simply signs the raw payload body with HMAC-SHA512:

```typescript
// Replace existing `verifyHmac` function with:
async function verifyHmac(payload: string, hmacHeader: string, secret: string) {
    if (!secret || !hmacHeader) return false;

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['verify']
        );
        
        // Paymob often provides HMAC as hex string. Convert hex to Uint8Array.
        const signatureBytes = new Uint8Array(hmacHeader.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        
        return await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            encoder.encode(payload)
        );
    } catch (e) {
        console.error('HMAC verification error:', e);
        return false;
    }
}
```

---

## 3. Order Webhook (`supabase/functions/order_webhook/index.ts`)

**Status:** Insecure / Missing.  
This appears to be a stub or internal-facing webhook. It has absolutely no mechanism to verify the validity of the requests.

**Current Code:**
```typescript
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    // Placeholder logic for handling a webhook from a payment or shipping provider
    const data = {
      message: `Webhook received successfully.`,
      providedPayload: payload
    };
    // ...
```

**Proposed Patch:**
Location: `supabase/functions/order_webhook/index.ts`  
Assuming this expects a standard provider emitting a JWT or a shared secret token in an `Authorization` or `x-webhook-signature` header:

```typescript
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";

const WEBHOOK_SECRET = Deno.env.get('ORDER_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('x-webhook-signature');
    
    if (!signature || !WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const payloadText = await req.text();
    
    // Simple WebCrypto HMAC-SHA256 validation
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(payloadText));

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const payload = JSON.parse(payloadText);

    // Proceed safely...
    const data = {
      message: `Webhook received securely.`,
      providedPayload: payload
    };

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```
