"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product, CartItem } from '@lessence/core';
import { TelemetryLogger, withRetryAndLog } from '../src/utils/telemetry';

// ── Storage adapter interface ──
export interface CartStorage {
  getCart(): Promise<CartItem[]>;
  setCart(items: CartItem[]): Promise<void>;
  clearCart(): Promise<void>;
}

// ── Stock validation result ──
export type StockCheckResult = {
  productId?: string;
  variantId?: string;
  bundleId?: string;
  size?: string;
  available: number;
  requested: number;
  ok: boolean;
};

// ── Cart engine hook ──
export function useCartEngine(
  supabase: SupabaseClient,
  userId: string | undefined,
  storage: CartStorage
) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockErrors, setStockErrors] = useState<StockCheckResult[]>([]);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const initialized = useRef(false);

  // Initialize logger
  const logger = useRef(new TelemetryLogger(supabase, 'web-client')).current;

  // ── Persist to local storage on every change (debounced) ──
  const persistLocally = useCallback(async (items: CartItem[]) => {
    try { await storage.setCart(items); } catch { /* silent */ }
  }, [storage]);

  // ── Initialize: load from local storage ──
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      setLoading(true);
      try {
        const saved = await storage.getCart();
        if (saved.length > 0) setCart(saved);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, [storage]);

  // ── Sync guest cart → server on login ──
  useEffect(() => {
    if (!prevUserIdRef.current && userId && cart.length > 0) {
      // User just logged in with items in cart – merge to server
      mergeCartToServer(userId, cart);
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  const mergeCartToServer = async (uid: string, items: CartItem[]) => {
    try {
      // Find or create user cart
      let { data: existingCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      let cartId: string;
      if (existingCart) {
        cartId = existingCart.id;
      } else {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: uid })
          .select('id')
          .single();
        if (!newCart) return;
        cartId = newCart.id;
      }

      // Upsert items
      for (const item of items) {
        let query = supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cartId);
        
        if (item.bundle_id) {
          query = query.eq('bundle_id', item.bundle_id);
        } else {
          query = query.eq('product_id', item.id)
            .eq(item.variant_id ? 'variant_id' : 'selected_size', item.variant_id ? item.variant_id : item.selectedSize);
        }
        
        const { data: existing } = await query.maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + item.quantity })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              cart_id: cartId,
              product_id: item.bundle_id ? null : item.id,
              bundle_id: item.bundle_id || null,
              selected_size: item.bundle_id ? null : item.selectedSize,
              variant_id: item.bundle_id ? null : item.variant_id,
              quantity: item.quantity,
            });
        }
      }
    } catch {
      /* non-blocking – local cart stays as source of truth */
    }
  };

  // ── Add to cart ──
  const addToCart = useCallback((itemObj: Partial<Product> | import('@lessence/core').Bundle, selectedSize?: string, variantId?: string, isBundle: boolean = false) => {
    setStockErrors([]);
    setCart(prev => {
      let isMatch;
      if (isBundle) {
        isMatch = (i: CartItem) => i.bundle_id === itemObj.id;
      } else {
        isMatch = (i: CartItem) => i.id === itemObj.id && 
          (variantId ? i.variant_id === variantId : i.selectedSize === selectedSize);
      }
      const idx = prev.findIndex(isMatch);
      let next: CartItem[];
      
      if (idx > -1) {
        next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
      } else {
        if (isBundle) {
          const bundle = itemObj as import('@lessence/core').Bundle;
          next = [...prev, { 
            bundle_id: bundle.id, 
            name: bundle.name, 
            price: bundle.price,
            image_url: bundle.image_url || '',
            bundle: bundle, 
            quantity: 1 
          }];
        } else {
          const product = itemObj as Product;
          const targetVariant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
          next = [...prev, { ...product, quantity: 1, selectedSize, variant_id: variantId, variant: targetVariant }];
        }
      }
      persistLocally(next);
      return next;
    });
  }, [persistLocally]);

  // ── Update quantity ──
  const updateQuantity = useCallback((id: string, selectedSize: string | undefined, quantity: number, variantId?: string, isBundle?: boolean) => {
    setStockErrors([]);
    if (quantity <= 0) {
      removeFromCart(id, selectedSize, variantId, isBundle);
      return;
    }
    setCart(prev => {
      const next = prev.map(item => {
        if (isBundle && item.bundle_id === id) {
           return { ...item, quantity };
        }
        if (!isBundle && item.id === id && (variantId ? item.variant_id === variantId : item.selectedSize === selectedSize)) {
           return { ...item, quantity };
        }
        return item;
      });
      persistLocally(next);
      return next;
    });
  }, [persistLocally]);

  // ── Remove item ──
  const removeFromCart = useCallback((id: string, selectedSize?: string, variantId?: string, isBundle?: boolean) => {
    setCart(prev => {
      const next = prev.filter(i => {
         if (isBundle) return i.bundle_id !== id;
         return !(i.id === id && (variantId ? i.variant_id === variantId : i.selectedSize === selectedSize));
      });
      persistLocally(next);
      return next;
    });
  }, [persistLocally]);

  // ── Clear cart ──
  const clearCart = useCallback(() => {
    setCart([]);
    storage.clearCart();
  }, [storage]);

  // ── Server-side stock validation ──
  const validateStock = useCallback(async (): Promise<StockCheckResult[]> => {
    const checks: StockCheckResult[] = [];
    for (const item of cart) {
      if (item.bundle_id) {
        // Fetch bundle items to validate stock for each component
        const { data: bundleItems } = await supabase
          .from('bundle_items')
          .select('product_id, variant_id, quantity')
          .eq('bundle_id', item.bundle_id);
          
        if (bundleItems) {
            for (const bItem of bundleItems) {
                if (bItem.variant_id) {
                    const { data } = await supabase
                      .from('product_variants')
                      .select('stock_qty')
                      .eq('id', bItem.variant_id)
                      .maybeSingle();
                    const available = data?.stock_qty ?? Infinity;
                    const reqQty = item.quantity * bItem.quantity;
                    checks.push({
                      bundleId: item.bundle_id,
                      productId: bItem.product_id,
                      variantId: bItem.variant_id,
                      available,
                      requested: reqQty,
                      ok: available >= reqQty,
                    });
                } else {
                     const { data } = await supabase
                      .from('inventory')
                      .select('quantity_available')
                      .eq('product_id', bItem.product_id)
                      .maybeSingle();
            
                    const available = data?.quantity_available ?? Infinity;
                    const reqQty = item.quantity * bItem.quantity;
                    checks.push({
                      bundleId: item.bundle_id,
                      productId: bItem.product_id,
                      available,
                      requested: reqQty,
                      ok: available >= reqQty,
                    });
                }
            }
        }
      } else if (item.variant_id) {
        const { data } = await supabase
          .from('product_variants')
          .select('stock_qty')
          .eq('id', item.variant_id)
          .maybeSingle();
        const available = data?.stock_qty ?? Infinity;
        checks.push({
          productId: item.id,
          variantId: item.variant_id,
          size: item.selectedSize,
          available,
          requested: item.quantity,
          ok: available >= item.quantity,
        });
      } else {
        const { data } = await supabase
          .from('inventory')
          .select('quantity_available')
          .eq('product_id', item.id)
          .eq('size', item.selectedSize)
          .maybeSingle();

        const available = data?.quantity_available ?? Infinity;
        checks.push({
          productId: item.id,
          size: item.selectedSize,
          available,
          requested: item.quantity,
          ok: available >= item.quantity,
        });
      }
    }
    const bad = checks.filter(c => !c.ok);
    setStockErrors(bad);
    return checks;
  }, [supabase, cart]);

  // ── Place order ──
  const placeOrder = useCallback(async (): Promise<{ success: boolean; orderNumber?: string; error?: any }> => {
    try {
      if (!userId) throw new Error('You must be logged in to place an order.');

      return await withRetryAndLog('place_order', logger, async () => {
      // Stock validation
      const checks = await validateStock();
      const outOfStock = checks.filter(c => !c.ok);
      if (outOfStock.length > 0) {
        const names = outOfStock.map(c => {
          if (c.bundleId) {
             const bItem = cart.find(i => i.bundle_id === c.bundleId);
             return `${bItem?.bundle?.name || 'Bundle'} (Component stock issue)`;
          }
          const item = cart.find(i => i.id === c.productId && (c.variantId ? i.variant_id === c.variantId : i.selectedSize === c.size));
          return `${item?.name || c.productId} (${c.size || 'Variant'})`;
        });
        throw new Error(`Stock unavailable: ${names.join(', ')}`);
      }

      const cartTotal = cart.reduce((acc, item) => {
        let price = item.price || 0;
        if (item.bundle) {
          price = item.bundle.price;
        } else if (item.variant) {
          price = item.variant.price;
        } else if (item.size_options && item.selectedSize) {
          price = item.size_options.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || (item.price || 0);
        }
        return acc + price * item.quantity;
      }, 0);

      const orderNumber = `LE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userId,
          order_number: orderNumber,
          status: 'pending',
          subtotal: cartTotal,
          total_amount: cartTotal,
        }])
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = cart.map(item => {
        let price = item.price || 0;
        if (item.bundle) {
            price = item.bundle.price;
        } else if (item.variant) {
          price = item.variant.price;
        } else if (item.size_options && item.selectedSize) {
          price = item.size_options.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || (item.price || 0);
        }
        return {
          order_id: orderData.id,
          product_id: item.bundle_id ? null : item.id,
          bundle_id: item.bundle_id,
          variant_id: item.variant_id,
          product_name: item.bundle_id ? null : item.name,
          bundle_name: item.bundle_id ? item.bundle?.name : null,
          selected_size: item.selectedSize,
          price: price,
          quantity: item.quantity,
        };
      });
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Clear server cart if it exists
      const { data: userCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (userCart) {
        await supabase.from('cart_items').delete().eq('cart_id', userCart.id);
      }

      clearCart();
      return { success: true, orderNumber };
    });
    } catch (error: any) {
      return { success: false, error: error.message || error };
    }
  }, [supabase, userId, cart, validateStock, clearCart, logger]);

  // ── Computed ──
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => {
    let price = item.price || 0;
    if (item.bundle) {
      price = item.bundle.price;
    } else if (item.variant) {
      price = item.variant.price;
    } else if (item.size_options && item.selectedSize) {
      price = item.size_options.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || (item.price || 0);
    }
    return acc + price * item.quantity;
  }, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    placeOrder,
    validateStock,
    stockErrors,
    cartCount,
    cartTotal,
    loading,
  };
}
