import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// HMAC-SHA512 verification using WebCrypto API
async function verifyHmac(payload: string, hmacHeader: string, secret: string): Promise<boolean> {
  if (!secret || !hmacHeader) {
    console.error('HMAC verification failed: missing secret or header');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['verify']
    );

      // Paymob provides HMAC as a hex string
      const signatureBytes = new Uint8Array(
        hmacHeader.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, hmac',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const hmacSecret = Deno.env.get('PAYMOB_HMAC_SECRET') ?? ''

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('hmac');

    // Paymob webhooks usually send the type in "type" or "obj.type".
    const payload = JSON.parse(rawBody);

    // Validate request HMAC
    const isValid = await verifyHmac(rawBody, hmacHeader || '', hmacSecret);
    if (!isValid) {
        console.error('Invalid HMAC signature');
        return new Response('Invalid signature', { status: 401 });
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Idempotency Check ---
    // Use the transaction ID as a deduplication key to prevent processing the same webhook twice
    const idempotencyKey = transaction.id ? transaction.id.toString() : null;
    if (idempotencyKey) {
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
    }

    // According to Paymob doc, the transaction object is usually in payload.obj
    // NextGen intentions might fire different event types, e.g., "TRANSACTION_SUCCESS" or similar.
    // If it's a standard transaction callback, payload.obj contains the transaction.
    const transaction = payload.obj;
    if (!transaction || transaction.success !== true) {
        console.log('Transaction missing or not successful, ignoring.');
        return new Response('OK', { status: 200 });
    }

    // Attempt to extract extras
    // For intention API, the extras are nested under intention details often. Let's assume they're passed through.
    // Usually, Paymob sends custom fields in `payment_key_claims.extra` or `order.merchant_order_id` or similar.
    // For NextGen, fields sent in `extras` on Intention creation are sent back in webhook. Let's assume they are under transaction.payment_key_claims.extra or transaction.intention.extras
    let extras: any = {};
    if (transaction.payment_key_claims && transaction.payment_key_claims.extra) {
       extras = transaction.payment_key_claims.extra;
    } else if (transaction.intention && transaction.intention.extras) {
        // NextGen Intention Webhook structure 
        extras = transaction.intention.extras.creation_extras || transaction.intention.extras || {};
    } else {
        // Fallback for flat structure
        extras = payload.extras || transaction.extras || {};
    }

    // Because Paymob extras strings them, let's just make sure.
    const {
      user_id,
      applied_coupon_id,
      discount_amount,
      subtotal,
      total_amount,
      address,
      cart_items,
      is_gift,
      gift_wrap,
      gift_message
    } = extras;

    if (!cart_items || !address) {
        console.error('Missing required metadata in webhook', extras);
        return new Response('Missing metadata', { status: 400 });
    }

    const parsedAddress = address ? JSON.parse(address) : null;
    const items = cart_items ? JSON.parse(cart_items) : [];
    let dbUserId = user_id === 'guest' ? null : user_id;

    // 1. Create Address
    let addressId = null;
    if (parsedAddress && dbUserId) {
        const { data: insertedAddress, error: addrError } = await supabaseClient
        .from('addresses')
        .insert([{
            user_id: dbUserId,
            full_name: parsedAddress.fullName || parsedAddress.name || 'Guest',
            address_line1: parsedAddress.line1 || 'N/A',
            address_line2: parsedAddress.line2,
            city: parsedAddress.city || 'N/A',
            state: parsedAddress.state || 'N/A',
            postal_code: parsedAddress.postal_code || 'N/A',
            country: parsedAddress.country || 'N/A',
        }])
        .select()
        .single()

        if (!addrError && insertedAddress) {
            addressId = insertedAddress.id;
        }
    }

    // 2. Create Order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert([{
          user_id: dbUserId,
          order_number: orderNumber,
          status: 'paid', // Paymob successful callback
          subtotal: parseFloat(subtotal || '0'),
          discount_amount: parseFloat(discount_amount || '0'),
          total_amount: parseFloat(total_amount || '0'),
          applied_coupon_id: applied_coupon_id || null,
          shipping_address_id: addressId,
          is_gift: is_gift === 'true',
          gift_wrap: gift_wrap === 'true',
          gift_message: gift_message || null
      }])
      .select()
      .single();

    if (orderError || !order) {
        throw new Error(`Failed to create order: ${orderError?.message}`)
    }

    // 3. Create Order Items & Deduct Inventory
    const orderItemsToInsert = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.is_bundle ? null : item.product_id,
        bundle_id: item.is_bundle ? item.bundle_id : null,
        variant_id: item.variant_id || null,
        product_name: item.is_bundle ? null : item.product_name,
        bundle_name: item.is_bundle ? item.bundle_name : null,
        selected_size: item.selected_size || null,
        price: parseFloat(item.price),
        quantity: item.quantity
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
         throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    for (const item of items) {
        if (item.is_bundle && item.bundleItems) {
            for (const bItem of item.bundleItems) {
               if (bItem.variant_id) {
                    const { data: varData } = await supabaseClient
                      .from('product_variants')
                      .select('stock_qty')
                      .eq('id', bItem.variant_id)
                      .single();
                    if (varData) {
                        const newQty = Math.max(0, varData.stock_qty - (item.quantity * bItem.quantity));
                      const { error: invError } = await supabaseClient
                          .from('product_variants')
                          .update({ stock_qty: newQty })
                          .eq('id', bItem.variant_id);
                      if (invError) console.error(`Failed to update variant stock for ${bItem.variant_id}:`, invError);
                    }
               } else {
                    const { data: inv } = await supabaseClient
                      .from('inventory')
                      .select('quantity_available')
                      .eq('product_id', bItem.product_id)
                      .single();
                    if (inv) {
                         const newQty = Math.max(0, inv.quantity_available - (item.quantity * bItem.quantity));
                      const { error: invError } = await supabaseClient
                           .from('inventory')
                           .update({ quantity_available: newQty })
                           .eq('product_id', bItem.product_id);
                      if (invError) console.error(`Failed to update inventory for product ${bItem.product_id}:`, invError);
                    }
               }
            }
        } else {
            if (item.variant_id) {
               const { data: varData } = await supabaseClient
                  .from('product_variants')
                  .select('stock_qty')
                  .eq('id', item.variant_id)
                  .single();
                if (varData) {
                    const newQty = Math.max(0, varData.stock_qty - item.quantity);
                  const { error: invError } = await supabaseClient
                      .from('product_variants')
                      .update({ stock_qty: newQty })
                      .eq('id', item.variant_id);
                  if (invError) console.error(`Failed to update variant stock for ${item.variant_id}:`, invError);
                }
            } else {
               const { data: inv } = await supabaseClient
                 .from('inventory')
                 .select('quantity_available')
                 .eq('product_id', item.product_id)
                 .eq('size', item.selected_size)
                 .single();

               if (inv) {
                   const newQty = Math.max(0, inv.quantity_available - item.quantity);
                 const { error: invError } = await supabaseClient
                     .from('inventory')
                     .update({ quantity_available: newQty })
                     .eq('product_id', item.product_id)
                     .eq('size', item.selected_size);
                 if (invError) console.error(`Failed to update inventory for product ${item.product_id}:`, invError);
               }
            }
        }
    }

    // 4. Create Payment Record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert([{
          order_id: order.id,
          amount: parseFloat(total_amount || '0'),
          status: 'completed',
          provider: 'paymob',
          transaction_id: transaction.id ? transaction.id.toString() : `paymob_${orderNumber}`
      }]);
    if (paymentError) console.error(`Failed to create payment record for order ${order.id}:`, paymentError);

    // 5. Update Coupon Usage
    if (applied_coupon_id) {
        const { data: coupon } = await supabaseClient
            .from('coupons')
            .select('times_used')
            .eq('id', applied_coupon_id)
            .single();
        if (coupon) {
          const { error: couponError } = await supabaseClient
                .from('coupons')
                .update({ times_used: coupon.times_used + 1 })
                .eq('id', applied_coupon_id);
          if (couponError) console.error(`Failed to update coupon ${applied_coupon_id}:`, couponError);
        }
    }

    // 6. Clear Cart (if user is known)
    if (dbUserId) {
      const { error: cartError } = await supabaseClient
            .from('carts')
            .delete()
            .eq('user_id', dbUserId);
      if (cartError) console.error(`Failed to clear cart for user ${dbUserId}:`, cartError);
            
        // 7. Award Loyalty Points
        try {
            await supabaseClient.functions.invoke('calculate-points', {
                body: { orderId: order.id, pointsPerCurrency: 1 }
            });
        } catch (loyaltyErr) {
            console.error('Error awarding loyalty points:', loyaltyErr);
        }
    }

    console.log(`Successfully processed Paymob order ${orderNumber}`);
    return new Response(JSON.stringify({ received: true, orderId: order.id }), { status: 200 })

  } catch (err: any) {
    console.error('Webhook Execution Failed with full trace:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
})
