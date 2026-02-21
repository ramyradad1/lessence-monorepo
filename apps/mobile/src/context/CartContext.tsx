import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Product, CartItem } from '@lessence/core';
import { supabase } from '../lib/supabase';
import { useAuth, useCartEngine, CartStorage } from '@lessence/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Mobile AsyncStorage adapter ──
const CART_KEY = 'lessence_cart';

const mobileCartStorage: CartStorage = {
  async getCart(): Promise<CartItem[]> {
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async setCart(items: CartItem[]): Promise<void> {
    try { await AsyncStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* noop */ }
  },
  async clearCart(): Promise<void> {
    try { await AsyncStorage.removeItem(CART_KEY); } catch { /* noop */ }
  },
};

// ── Context type ──
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedSize: string) => void;
  removeFromCart: (productId: string, selectedSize: string) => void;
  updateQuantity: (productId: string, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (customerName?: string) => Promise<{ success: boolean; orderNumber?: string; error?: any }>;
  cartCount: number;
  cartTotal: number;
  stockErrors: { productId: string; size: string; available: number; requested: number; ok: boolean }[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const engine = useCartEngine(supabase, user?.id, mobileCartStorage);

  const value = useMemo(() => ({
    cart: engine.cart,
    addToCart: engine.addToCart,
    removeFromCart: engine.removeFromCart,
    updateQuantity: engine.updateQuantity,
    clearCart: engine.clearCart,
    placeOrder: engine.placeOrder,
    cartCount: engine.cartCount,
    cartTotal: engine.cartTotal,
    stockErrors: engine.stockErrors,
  }), [engine.cart, engine.cartCount, engine.cartTotal, engine.stockErrors]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
