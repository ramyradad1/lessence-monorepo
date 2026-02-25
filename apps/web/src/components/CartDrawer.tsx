"use client";
import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@lessence/supabase";
import type { CartItem } from "@lessence/core";
import { formatCurrency } from "@lessence/core";
import { useLocale } from "next-intl";
import Image from "next/image";

type CartOrderResult = { success: boolean; orderNumber?: string; error?: unknown };
type CartDrawerItem = CartItem & { product_id?: string };

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderResult, setOrderResult] = useState<CartOrderResult | null>(null);
  const { user } = useAuth();
  const locale = useLocale();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => { setIsCartOpen(false); setOrderResult(null); }} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background-dark border-l border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="text-lg font-display text-white">Your Bag</h2>
            <span className="text-xs bg-primary text-black px-2 py-0.5 rounded-full font-bold">{cartCount}</span>
          </div>
          <button onClick={() => { setIsCartOpen(false); setOrderResult(null); }} className="text-white/40 hover:text-white transition-colors" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Order Success */}
        {orderResult?.success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={32} className="text-primary" />
            </div>
            <h3 className="text-2xl font-display text-white mb-2">Order Confirmed!</h3>
            <p className="text-white/40 mb-1">Your order number is</p>
            <p className="text-3xl font-bold text-primary mb-6">{orderResult.orderNumber}</p>
            <button
              onClick={() => { setIsCartOpen(false); setOrderResult(null); }}
              className="bg-primary text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag size={48} className="text-white/10 mb-4" />
            <h3 className="text-xl font-display text-white/60 mb-2">Your bag is empty</h3>
            <p className="text-white/30 text-sm">Discover our signature scents below.</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.map((item: CartDrawerItem, index: number) => {
                    let sizePrice = item.price || 0;
                    if (item.variant) {
                      sizePrice = item.variant.price;
                    } else if (item.size_options && item.selectedSize) {
                      sizePrice = item.size_options.find((s: { size: string; price: number }) => s.size === item.selectedSize)?.price ?? item.price ?? 0;
                    }
                    const itemId = item.bundle_id || item.id || item.product_id || '';
                    const isBundle = !!item.bundle_id;
                    const key = item.variant_id ? `${itemId}-${item.variant_id}-${index}` : `${itemId}-${item.selectedSize}-${index}`;

                return (
                  <div key={key} className="flex gap-4 bg-surface-dark/40 rounded-xl p-4 border border-white/5">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={item.image_url || item.bundle?.image_url || ""} alt={item.name || item.bundle?.name || "Cart item"} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-display text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-white/30 uppercase">
                            {isBundle ? "Gift Set" : item.selectedSize}
                          </p>
                        </div>
                        <button onClick={() => removeFromCart(itemId, item.selectedSize, item.variant_id, isBundle)} className="text-white/20 hover:text-red-400 transition-colors" aria-label="Remove item">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 bg-white/5 rounded-full">
                          <button onClick={() => updateQuantity(itemId, item.selectedSize, item.quantity - 1, item.variant_id, isBundle)} className="p-1.5 text-white/40 hover:text-primary transition-colors" aria-label="Decrease quantity">
                            <Minus size={12} />
                          </button>
                          <span className="text-xs text-white font-bold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(itemId, item.selectedSize, item.quantity + 1, item.variant_id, isBundle)} className="p-1.5 text-white/40 hover:text-primary transition-colors" aria-label="Increase quantity">
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-primary font-bold text-sm">{formatCurrency(Number(sizePrice) * item.quantity, locale)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-xs uppercase tracking-widest">Subtotal</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(cartTotal, locale)}</span>
              </div>

              {isCheckout ? (
                <div className="space-y-3">
                  {!user ? (
                    <div className="text-center">
                      <p className="text-white/50 text-sm mb-4">You must be signed in to checkout.</p>
                      <button
                        onClick={() => { setIsCartOpen(false); window.location.href = '/login'; }}
                        className="w-full bg-white text-black py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                      >
                        Sign In or Create Account
                      </button>
                    </div>
                  ) : (
                    <button
                            onClick={() => { setIsCartOpen(false); window.location.href = '/checkout'; }}
                      className="w-full bg-primary text-black py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-50"
                    >
                            Proceed to Checkout
                    </button>
                  )}
                  <button onClick={() => setIsCheckout(false)} className="w-full text-white/40 text-xs uppercase tracking-widest hover:text-white transition-colors py-2">
                    Back to Bag
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCheckout(true)}
                  className="w-full bg-primary text-black py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all"
                >
                  Checkout
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
