import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'

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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    let user_id = null;

    if (authHeader) {
      // Get the JWT token
      const token = authHeader.replace('Bearer ', '')
      // Verify the JWT token and get the user
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      if (!userError && user) {
        user_id = user.id;
      }
    }

    const { cartItems, address, couponCode, successUrl, cancelUrl } = await req.json()

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    if (!address) {
      throw new Error('Address is required')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Fetch product details from database to validate pricing and stock
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;
    const validatedCartItems = [];

    for (const item of cartItems) {
      const productId = item.id || item.product_id;
      const selectedSize = item.selectedSize || item.selected_size;

      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('name, image_url, size_options')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Find the specific size price
      const sizeOptions = product.size_options as any[];
      const sizeOption = (sizeOptions || []).find((s: any) => s.size === selectedSize);
      
      if (!sizeOption) {
        throw new Error(`Invalid size ${selectedSize} for product ${product.name}`)
      }

      const price = sizeOption.price;

      let availableQty = 0;
      if (item.variant_id) {
        const { data: variant, error: variantError } = await supabaseClient
          .from('product_variants')
          .select('stock_qty')
          .eq('id', item.variant_id)
          .single();
        if (variantError || !variant) throw new Error(`Variant not found for ${product.name}`);
        availableQty = variant.stock_qty;
      } else {
        const { data: inventory, error: inventoryError } = await supabaseClient
          .from('inventory')
          .select('quantity_available')
          .eq('product_id', productId)
          .eq('size', selectedSize)
          .maybeSingle();
          
        if (inventoryError) throw new Error(`Error checking stock for ${product.name}`);
        availableQty = inventory?.quantity_available ?? Infinity;
      }
        
      if (availableQty < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (${selectedSize})`)
      }

      subtotal += price * item.quantity;
      validatedCartItems.push({
         ...item,
        product_id: productId,
        selected_size: selectedSize,
         price,
         product_name: product.name,
         variant_id: item.variant_id || null
      });

      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.name} (${selectedSize})`,
            images: product.image_url ? [product.image_url] : [],
          },
          unit_amount: Math.round(price * 100), // Stripe expects amounts in cents
        },
        quantity: item.quantity,
      })
    }
    
    // Apply coupon if provided
    let discount_amount = 0;
    let applied_coupon_id = '';

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
        
        // Basic validation
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            throw new Error('Coupon has expired.')
        }

        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
             throw new Error('Coupon usage limit reached.')
        }

        applied_coupon_id = coupon.id;

        // Calculate discount
        if (coupon.discount_type === 'percentage') {
            discount_amount = parseFloat((subtotal * (coupon.discount_amount / 100)).toFixed(2));
        } else if (coupon.discount_type === 'fixed') {
            discount_amount = Math.min(coupon.discount_amount, subtotal);
        }
    }
    
    const total_amount = subtotal - discount_amount;

    let customerId;
    if (user_id) {
        const { data: profile } = await supabaseClient.from('profiles').select('email, full_name').eq('id', user_id).single();
        if (profile) {
            try {
             const customer = await stripe.customers.create({
                 email: profile.email,
                 name: profile.full_name || undefined,
             });
             customerId = customer.id;
            } catch(e) {
                console.error("Failed creating stripe customer", e)
            }
        }
    }

    // Create Stripe Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode: 'payment',
      success_url: successUrl || `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/checkout/cancel`,
      customer_email: !customerId && address?.email ? address.email : undefined,
      customer: customerId,
      metadata: {
          user_id: user_id || 'guest',
          applied_coupon_id,
          discount_amount: discount_amount.toString(),
          subtotal: subtotal.toString(),
          total_amount: total_amount.toString(),
          address: JSON.stringify(address), // Store address to use in webhook
          cart_items: JSON.stringify(validatedCartItems.map(item => ({
              product_id: item.product_id,
              selected_size: item.selected_size,
              quantity: item.quantity,
              price: item.price,
              product_name: item.product_name,
              variant_id: item.variant_id
          })))
      }
    };

    if (discount_amount > 0 && couponCode) {
         try {
             const stripeCoupon = await stripe.coupons.create({
                 amount_off: Math.round(discount_amount * 100),
                 currency: 'usd',
                 duration: 'once',
                 name: `Coupon ${couponCode}`,
             });
             sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
         } catch (e) {
             console.error("Failed to create Stripe coupon", e);
             throw new Error('Failed to apply discount in Stripe.')
         }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
