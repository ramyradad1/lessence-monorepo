import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product, CartItem } from '@lessence/core';

// ── Storage adapter interface ──
export interface CartStorage {
  getCart(): Promise<CartItem[]>;
  setCart(items: CartItem[]): Promise<void>;
  clearCart(): Promise<void>;
}

// ── Stock validation result ──
export type StockCheckResult = {
  productId: string;
  size: string;
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
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cartId)
          .eq('product_id', item.id)
          .eq('selected_size', item.selectedSize)
          .maybeSingle();

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
              product_id: item.id,
              selected_size: item.selectedSize,
              quantity: item.quantity,
            });
        }
      }
    } catch {
      /* non-blocking – local cart stays as source of truth */
    }
  };

  // ── Add to cart ──
  const addToCart = useCallback((product: Product, selectedSize: string) => {
    setStockErrors([]);
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id && i.selectedSize === selectedSize);
      let next: CartItem[];
      if (idx > -1) {
        next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
      } else {
        next = [...prev, { ...product, quantity: 1, selectedSize }];
      }
      persistLocally(next);
      return next;
    });
  }, [persistLocally]);

  // ── Update quantity ──
  const updateQuantity = useCallback((productId: string, selectedSize: string, quantity: number) => {
    setStockErrors([]);
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setCart(prev => {
      const next = prev.map(item =>
        item.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity }
          : item
      );
      persistLocally(next);
      return next;
    });
  }, [persistLocally]);

  // ── Remove item ──
  const removeFromCart = useCallback((productId: string, selectedSize: string) => {
    setCart(prev => {
      const next = prev.filter(i => !(i.id === productId && i.selectedSize === selectedSize));
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
      const { data } = await supabase
        .from('inventory')
        .select('quantity_available')
        .eq('product_id', item.id)
        .eq('size', item.selectedSize)
        .maybeSingle();

      // If no inventory row exists, assume unlimited
      const available = data?.quantity_available ?? Infinity;
      checks.push({
        productId: item.id,
        size: item.selectedSize,
        available,
        requested: item.quantity,
        ok: available >= item.quantity,
      });
    }
    const bad = checks.filter(c => !c.ok);
    setStockErrors(bad);
    return checks;
  }, [supabase, cart]);

  // ── Place order ──
  const placeOrder = useCallback(async (): Promise<{ success: boolean; orderNumber?: string; error?: any }> => {
    try {
      if (!userId) throw new Error('You must be logged in to place an order.');

      // Stock validation
      const checks = await validateStock();
      const outOfStock = checks.filter(c => !c.ok);
      if (outOfStock.length > 0) {
        const names = outOfStock.map(c => {
          const item = cart.find(i => i.id === c.productId && i.selectedSize === c.size);
          return `${item?.name || c.productId} (${c.size})`;
        });
        throw new Error(`Stock unavailable: ${names.join(', ')}`);
      }

      const cartTotal = cart.reduce((acc, item) => {
        const sizePrice = item.size_options?.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || item.price;
        return acc + sizePrice * item.quantity;
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

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        selected_size: item.selectedSize,
        price: item.size_options?.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || item.price,
        quantity: item.quantity,
      }));
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
    } catch (error: any) {
      return { success: false, error: error.message || error };
    }
  }, [supabase, userId, cart, validateStock, clearCart]);

  // ── Computed ──
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => {
    const sizePrice = item.size_options?.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price || item.price;
    return acc + sizePrice * item.quantity;
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
