import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'

// Keep this secret safe in your Supabase project's secrets!
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Extract metadata
    const metadata = session.metadata
    if (!metadata) {
      console.error('No metadata found in session', session.id)
      return new Response('Missing metadata', { status: 400 })
    }

    const {
      user_id,
      applied_coupon_id,
      discount_amount,
      subtotal,
      total_amount,
      address,
      cart_items
    } = metadata

    const parsedAddress = address ? JSON.parse(address) : null;
    const items = cart_items ? JSON.parse(cart_items) : [];

    let dbUserId = user_id === 'guest' ? null : user_id;

    try {
      // 1. Create Address if it doesn't exist (simplified, ideally you'd look it up or create a specific order address table)
      let addressId = null;
      if (parsedAddress) {
        // Just insert it as a new address for the record, or if guest user, don't link to auth.users (requires schema change for guest addresses, but we'll assume for now orders hold text addresses or we insert anyway)
        // Note: Our schema requires `user_id` for addresses. If guest, we might need a workaround. 
        // For production, maybe the `orders` table should have `shipping_address_json` directly.
         // Let's assume we insert it if user is logged in.
         if (dbUserId) {
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
         } else {
             // For guests, we skip address table (due to user_id constraint) and maybe just rely on Stripe's record, or we'd need to alter schema.
             // Given the schema `shipping_address_id uuid references addresses`, we must have a user_id for addresses.
             // We'll leave it null for guests for now based on current schema constraints, or we could insert a dummy address if we altered schema to allow null user_id.
         }
      }

      // 2. Create Order
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert([{
            user_id: dbUserId,
            order_number: orderNumber,
            status: 'paid', // Mark as paid immediately since webhook is for successful payment
            subtotal: parseFloat(subtotal || '0'),
            discount_amount: parseFloat(discount_amount || '0'),
            total_amount: parseFloat(total_amount || '0'),
            applied_coupon_id: applied_coupon_id || null,
            shipping_address_id: addressId
        }])
        .select()
        .single();

      if (orderError || !order) {
          throw new Error(`Failed to create order: ${orderError?.message}`)
      }

      // 3. Create Order Items and Deduct Inventory
      const orderItemsToInsert = items.map((item: any) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_id: item.variant_id || null,
          selected_size: item.selected_size,
          price: parseFloat(item.price),
          quantity: item.quantity
      }));

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
           throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      // Deduct inventory
      for (const item of items) {
          // This approach is naive regarding concurrency (race conditions).
          // In a real production system, you'd use a Postgres RPC (stored procedure) to atomically deduct inventory.
          if (item.variant_id) {
             const { data: varData } = await supabaseClient
                .from('product_variants')
                .select('stock_qty')
                .eq('id', item.variant_id)
                .single();
              if (varData) {
                  const newQty = Math.max(0, varData.stock_qty - item.quantity);
                  await supabaseClient
                    .from('product_variants')
                    .update({ stock_qty: newQty })
                    .eq('id', item.variant_id);
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
                 await supabaseClient
                   .from('inventory')
                   .update({ quantity_available: newQty })
                   .eq('product_id', item.product_id)
                   .eq('size', item.selected_size);
             }
          }
      }

      // 4. Create Payment Record
      await supabaseClient
        .from('payments')
        .insert([{
            order_id: order.id,
            amount: parseFloat(total_amount || '0'),
            status: 'completed',
            provider: 'stripe',
            transaction_id: session.payment_intent as string || session.id
        }]);

       // 5. Update Coupon Usage
       if (applied_coupon_id) {
            // Again, a stored procedure would be better for atomic increments
            const { data: coupon } = await supabaseClient
                .from('coupons')
                .select('times_used')
                .eq('id', applied_coupon_id)
                .single();
            if (coupon) {
                 await supabaseClient
                    .from('coupons')
                    .update({ times_used: coupon.times_used + 1 })
                    .eq('id', applied_coupon_id);
            }
       }

       // 6. Clear Cart (if user is known)
       if (dbUserId) {
            await supabaseClient
                .from('carts')
                .delete()
                .eq('user_id', dbUserId);
       }

      console.log(`Successfully processed order ${orderNumber} for session ${session.id}`)
      return new Response(JSON.stringify({ received: true, orderId: order.id }), { status: 200 })

    } catch (e: any) {
        console.error('Error fulfilling order during webhook:', e);
        // Important: Still return 200 to Stripe so it doesn't retry infinitely if it's a structural error in our code,
        // unless it's a transient DB error where retrying makes sense.
        // For now, we'll return 500 so Stripe retries.
        return new Response(JSON.stringify({ error: 'Failed to fulfill order' }), { status: 500 })
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
