import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
         
         const { data: bundleItems, error: itemsError } = await supabaseClient
            .from('bundle_items')
            .select('product_id, variant_id, quantity')
            .eq('bundle_id', bundleId);
            
         if (itemsError || !bundleItems) {
             throw new Error(`Failed to load bundle components for: ${bundle.name}`);
         }
         
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
                  .maybeSingle(); 
                  
               const availableQty = inventory?.quantity_available ?? Infinity;
               if (invError || availableQty < (item.quantity * bItem.quantity)) {
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
             bundleItems
         });

      } else {
        const productId = item.id || item.product_id;
        const selectedSize = item.selectedSize || item.selected_size;

        const { data: product, error: productError } = await supabaseClient
          .from('products')
          .select('name, price, size_options')
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
            const { data: variant } = await supabaseClient
              .from('product_variants')
              .select('price, stock_qty')
              .eq('id', item.variant_id)
              .single();
            if (variant) price = variant.price;
        }

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
              .maybeSingle();

            const availableQty = inventory?.quantity_available ?? Infinity;
            
            if (inventoryError || availableQty < item.quantity) {
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
            discount_amount = 0;
        }
    }
    
    const total_amount = subtotal - discount_amount;

    // 3. Initiate Paymob Intention
    const paymobSecretKey = Deno.env.get('PAYMOB_SECRET_KEY');
    if (!paymobSecretKey) {
        throw new Error('Paymob Secret Key is not configured.');
    }

    const paymobIntegrationIdStr = Deno.env.get('PAYMOB_INTEGRATION_ID') || '5554410'; 
    const paymobIntegrationId = parseInt(paymobIntegrationIdStr, 10);

    const payload = {
        amount: Math.round(total_amount * 100), // in cents/piasters
        currency: 'EGP',
        payment_methods: [paymobIntegrationId], // Use the integration ID
        billing_data: {
            apartment: 'NA', 
            email: address.email || 'customer@lessence.com', 
            floor: 'NA', 
            first_name: address.fullName ? address.fullName.split(' ')[0] : 'Customer', 
            street: address.line1 || 'NA', 
            building: 'NA', 
            phone_number: address.phone || '+201000000000', 
            shipping_method: 'NA', 
            postal_code: address.postal_code || 'NA', 
            city: address.city || 'Cairo', 
            country: 'EG', 
            last_name: address.fullName && address.fullName.split(' ').length > 1 ? address.fullName.split(' ').slice(1).join(' ') : 'Customer', 
            state: address.state || 'Cairo'
        },
        extras: {
            user_id: user_id || 'guest',
            applied_coupon_id: applied_coupon_id || '',
            discount_amount: discount_amount.toString(),
            subtotal: subtotal.toString(),
            total_amount: total_amount.toString(),
            is_gift: isGift ? 'true' : 'false',
            gift_wrap: giftWrap ? 'true' : 'false',
            gift_message: giftMessage || '',
            address: JSON.stringify(address),
            cart_items: JSON.stringify(validatedCartItems.map(item => ({
                product_id: item.product_id,
                bundle_id: item.is_bundle ? item.bundle_id : null,
                selected_size: item.selected_size || null,
                quantity: item.quantity,
                price: item.price,
                product_name: item.product_name,
                bundle_name: item.is_bundle ? item.bundle_name : null,
                variant_id: item.variant_id || null,
                is_bundle: item.is_bundle ? true : false,
                bundleItems: item.bundleItems || null
            })))
        }
    };

    const response = await fetch('https://accept.paymob.com/v1/intention/', {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + paymobSecretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error('Paymob error:', responseData);
        throw new Error(responseData.detail || 'Failed to initialize payment with Paymob');
    }

    return new Response(
      JSON.stringify({ 
          clientSecret: responseData.client_secret, 
          publicKey: Deno.env.get('PAYMOB_PUBLIC_KEY') || 'egy_pk_test_QIL76LBH3idsKp2ubrJGMKdvMw2GylXN' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
