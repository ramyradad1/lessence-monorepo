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

    const { cartItems, address, couponCode } = await req.json()

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
      
      if (!sizeOption) {
        throw new Error(`Invalid size ${selectedSize} for product ${product.name}`)
      }

      const price = sizeOption.price;

      // Validate stock
      const { data: inventory, error: inventoryError } = await supabaseClient
        .from('inventory')
        .select('quantity_available')
        .eq('product_id', productId)
        .eq('size', selectedSize)
        .single();
        
      if (inventoryError || !inventory || inventory.quantity_available < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (${selectedSize})`)
      }

      subtotal += price * item.quantity;
      validatedCartItems.push({
         ...item,
        product_id: productId,
        selected_size: selectedSize,
         price,
         product_name: product.name
      });
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

        applied_coupon_id = coupon.id;

        if (coupon.discount_type === 'percentage') {
            discount_amount = parseFloat((subtotal * (coupon.discount_amount / 100)).toFixed(2));
        } else if (coupon.discount_type === 'fixed') {
            discount_amount = Math.min(coupon.discount_amount, subtotal);
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
          shipping_address_id: addressId
      }])
      .select()
      .single();

    if (orderError || !order) {
        throw new Error(`Failed to create order: ${orderError?.message}`)
    }

    // 5. Create Order Items & Deduct Inventory
    const orderItemsToInsert = validatedCartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
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

    for (const item of validatedCartItems) {
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
