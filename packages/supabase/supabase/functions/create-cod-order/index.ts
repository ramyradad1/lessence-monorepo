import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header to extract user_id if present
    const authHeader = req.headers.get('Authorization');
    let user_id = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      if (!userError && user) {
        user_id = user.id;
      }
    }

    const { cartItems, address, couponCode, isGift, giftWrap, giftMessage } = await req.json()

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    if (!address) {
      throw new Error('Address is required')
    }

    let subtotal = 0;
    const validatedCartItems = [];

    // 1. Validate Items & Stock
    for (const item of cartItems) {
      if (item.bundle_id) {
         // It's a bundle
         const bundleId = item.bundle_id;
         const { data: bundle, error: bundleError } = await supabaseClient
            .from('bundles')
            .select('name, price, is_active')
            .eq('id', bundleId)
            .single();
         
         if (bundleError || !bundle || !bundle.is_active) {
            throw new Error(`Bundle not found or inactive: ${bundleId}`);
         }
         
         const price = bundle.price;
         subtotal += price * item.quantity;
         
         // Fetch bundle items
         const { data: bundleItems, error: itemsError } = await supabaseClient
            .from('bundle_items')
            .select('product_id, variant_id, quantity')
            .eq('bundle_id', bundleId);
            
         if (itemsError || !bundleItems) {
             throw new Error(`Failed to load bundle components for: ${bundle.name}`);
         }
         
         // Validate stock for each component
         for (const bItem of bundleItems) {
            if (bItem.variant_id) {
               const { data: variant, error: varError } = await supabaseClient
                  .from('product_variants')
                  .select('stock_qty')
                  .eq('id', bItem.variant_id)
                  .single();
                  
               if (varError || !variant || variant.stock_qty < (item.quantity * bItem.quantity)) {
                  throw new Error(`Insufficient stock for a component of bundle ${bundle.name}`);
               }
            } else {
               const { data: inventory, error: invError } = await supabaseClient
                  .from('inventory')
                  .select('quantity_available')
                  .eq('product_id', bItem.product_id)
                  .single(); // Doesn't perfectly handle selectedSize if bundles don't specify size, but we'll assume it's general for now or skipped
                  
               if (invError || !inventory || inventory.quantity_available < (item.quantity * bItem.quantity)) {
                   throw new Error(`Insufficient stock for a component of bundle ${bundle.name}`);
               }
            }
         }
         
         validatedCartItems.push({
             ...item,
             bundle_id: bundleId,
             bundle_name: bundle.name,
             price,
             is_bundle: true,
             bundleItems // Store to decrement inventory later
         });

      } else {
        // It's a regular product
        const productId = item.id || item.product_id;
        const selectedSize = item.selectedSize || item.selected_size;

        const { data: product, error: productError } = await supabaseClient
          .from('products')
          .select('name, size_options')
          .eq('id', productId)
          .single()

        if (productError || !product) {
          throw new Error(`Product not found: ${productId}`)
        }

        const sizeOptions = product.size_options as any[];
        const sizeOption = (sizeOptions || []).find((s: any) => s.size === selectedSize);
        
        let price = product.price;
        if (sizeOption) {
            price = sizeOption.price;
        } else if (item.variant_id) {
            // handle variant price if needed, simplified for now
            const { data: variant } = await supabaseClient
              .from('product_variants')
              .select('price, stock_qty')
              .eq('id', item.variant_id)
              .single();
            if (variant) price = variant.price;
        }

        // Validate stock
        if (item.variant_id) {
            const { data: variant, error: varError } = await supabaseClient
              .from('product_variants')
              .select('stock_qty')
              .eq('id', item.variant_id)
              .single();
              
            if (varError || !variant || variant.stock_qty < item.quantity) {
               throw new Error(`Insufficient stock for ${product.name}`);
            }
        } else {
            const { data: inventory, error: inventoryError } = await supabaseClient
              .from('inventory')
              .select('quantity_available')
              .eq('product_id', productId)
              .eq('size', selectedSize)
              .single();
              
            if (inventoryError || !inventory || inventory.quantity_available < item.quantity) {
              throw new Error(`Insufficient stock for ${product.name} (${selectedSize})`)
            }
        }

        subtotal += price * item.quantity;
        validatedCartItems.push({
           ...item,
          product_id: productId,
          selected_size: selectedSize,
           price,
           product_name: product.name,
           is_bundle: false
        });
      }
    }
    
    // 2. Apply coupon if provided
    let discount_amount = 0;
    let applied_coupon_id = null;
    let is_free_shipping = false;

    if (couponCode) {
        const { data: coupon, error: couponError } = await supabaseClient
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

        if (couponError || !coupon) {
             throw new Error('Invalid or expired coupon code.')
        }
        
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            throw new Error('Coupon has expired.')
        }

        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
             throw new Error('Coupon usage limit reached.')
        }

        // Advanced Promo Validations
        if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
            throw new Error(`Minimum order amount of $${coupon.min_order_amount} is required for this coupon.`)
        }

        if (coupon.first_order_only || coupon.per_user_limit) {
            if (!user_id) {
                throw new Error('You must be logged in to use this coupon.');
            }

            if (coupon.first_order_only) {
                const { count } = await supabaseClient
                  .from('orders')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user_id)
                  .not('status', 'in', '("cancelled")');
                  
                if (count && count > 0) {
                     throw new Error('This coupon is only valid for your first order.');
                }
            }

            if (coupon.per_user_limit) {
                 const { count } = await supabaseClient
                  .from('coupon_redemptions')
                  .select('*', { count: 'exact', head: true })
                  .eq('coupon_id', coupon.id)
                  .eq('user_id', user_id);

                 if (count && count >= coupon.per_user_limit) {
                      throw new Error(`You have reached the usage limit (${coupon.per_user_limit}) for this coupon.`);
                 }
            }
        }

        applied_coupon_id = coupon.id;

        if (coupon.discount_type === 'percentage') {
            discount_amount = parseFloat((subtotal * (coupon.discount_amount / 100)).toFixed(2));
        } else if (coupon.discount_type === 'fixed') {
            discount_amount = Math.min(coupon.discount_amount, subtotal);
            discount_amount = parseFloat(discount_amount.toFixed(2));
        } else if (coupon.discount_type === 'free_shipping') {
            is_free_shipping = true;
            discount_amount = 0; // Handled separately via shipping cost calculations or visual free shipping flags
        }
    }
    
    const total_amount = subtotal - discount_amount;

    // 3. Create Address Record (If logged in, otherwise keep address on order metadata or schema if updated)
    let addressId = null;
    if (user_id && address) {
        const { data: insertedAddress, error: addrError } = await supabaseClient
        .from('addresses')
        .insert([{
            user_id: user_id,
            full_name: address.fullName || address.name || 'Guest',
            address_line1: address.line1 || 'N/A',
            address_line2: address.line2,
            city: address.city || 'N/A',
            state: address.state || 'N/A',
            postal_code: address.postal_code || 'N/A',
            country: address.country || 'N/A',
        }])
        .select()
        .single()

        if (!addrError && insertedAddress) {
            addressId = insertedAddress.id;
        }
    }

    // 4. Create Order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert([{
          user_id: user_id,
          order_number: orderNumber,
          status: 'pending', // COD is pending upon creation
          subtotal: parseFloat(subtotal.toString()),
          discount_amount: parseFloat(discount_amount.toString()),
          total_amount: parseFloat(total_amount.toString()),
          applied_coupon_id: applied_coupon_id,
          shipping_address_id: addressId,
          is_gift: isGift || false,
          gift_wrap: giftWrap || false,
          gift_message: giftMessage || null
      }])
      .select()
      .single();

    if (orderError || !order) {
        throw new Error(`Failed to create order: ${orderError?.message}`)
    }

    // 5. Create Order Items & Deduct Inventory
    const orderItemsToInsert = validatedCartItems.map((item: any) => ({
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

    for (const item of validatedCartItems) {
        if (item.is_bundle) {
            for (const bItem of item.bundleItems) {
               if (bItem.variant_id) {
                    const { data: varData } = await supabaseClient
                      .from('product_variants')
                      .select('stock_qty')
                      .eq('id', bItem.variant_id)
                      .single();
                    if (varData) {
                        const newQty = Math.max(0, varData.stock_qty - (item.quantity * bItem.quantity));
                        await supabaseClient
                          .from('product_variants')
                          .update({ stock_qty: newQty })
                          .eq('id', bItem.variant_id);
                    }
               } else {
                    const { data: inv } = await supabaseClient
                      .from('inventory')
                      .select('quantity_available')
                      .eq('product_id', bItem.product_id)
                      //.eq('size', ...) -> simplified for bundles
                      .single();
                    if (inv) {
                         const newQty = Math.max(0, inv.quantity_available - (item.quantity * bItem.quantity));
                         await supabaseClient
                           .from('inventory')
                           .update({ quantity_available: newQty })
                           .eq('product_id', bItem.product_id);
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
    }

    // 6. Create Payment Record
    await supabaseClient
      .from('payments')
      .insert([{
          order_id: order.id,
          amount: parseFloat(total_amount.toString()),
          status: 'pending',
          provider: 'cod',
          transaction_id: `cod_${orderNumber}`
      }]);

     // 7. Update Coupon Usage
     if (applied_coupon_id) {
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

     // 8. Clear Cart 
     if (user_id) {
          await supabaseClient
              .from('carts')
              .delete()
              .eq('user_id', user_id);
          
          // 9. Award Loyalty Points
          try {
              // We invoke the calculate-points function
              await supabaseClient.functions.invoke('calculate-points', {
                  body: { orderId: order.id, pointsPerCurrency: 1 }
              });
          } catch (loyaltyErr) {
              console.error('Error awarding loyalty points:', loyaltyErr);
              // We don't throw here to avoid failing the whole order if loyalty fails
          }
     }

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, orderNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
