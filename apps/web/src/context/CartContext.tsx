"use client";
import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { Product, CartItem } from "@lessence/core";
import { supabase } from "@/lib/supabase";
import { useAuth, useCartEngine, CartStorage } from "@lessence/supabase";

// ── Web localStorage adapter ──
const CART_KEY = "lessence_cart";

const webCartStorage: CartStorage = {
  async getCart(): Promise<CartItem[]> {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async setCart(items: CartItem[]): Promise<void> {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* full */ }
  },
  async clearCart(): Promise<void> {
    try { localStorage.removeItem(CART_KEY); } catch { /* noop */ }
  },
};

// ── Context type ──
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedSize: string) => void;
  removeFromCart: (productId: string, selectedSize: string) => void;
  updateQuantity: (productId: string, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<{ success: boolean; orderNumber?: string; error?: any }>;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  stockErrors: { productId: string; size: string; available: number; requested: number; ok: boolean }[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const engine = useCartEngine(supabase, user?.id, webCartStorage);
  const [isCartOpen, setIsCartOpenState] = React.useState(false);

  const setIsCartOpen = (open: boolean) => setIsCartOpenState(open);

  // Auto-open cart on add
  const addToCart = (product: Product, selectedSize: string) => {
    engine.addToCart(product, selectedSize);
    setIsCartOpenState(true);
  };

  const value = useMemo(() => ({
    cart: engine.cart,
    addToCart,
    removeFromCart: engine.removeFromCart,
    updateQuantity: engine.updateQuantity,
    clearCart: engine.clearCart,
    placeOrder: engine.placeOrder,
    cartCount: engine.cartCount,
    cartTotal: engine.cartTotal,
    isCartOpen,
    setIsCartOpen,
    stockErrors: engine.stockErrors,
  }), [engine.cart, engine.cartCount, engine.cartTotal, engine.stockErrors, isCartOpen]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
