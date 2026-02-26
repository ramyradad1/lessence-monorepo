"use client";
import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@lessence/supabase";
import type { CartItem } from "@lessence/core";
import { formatCurrency, isRTL } from "@lessence/core";
import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import { useStoreSettings } from "@/context/StoreSettingsContext";
import Image from "next/image";

type CartOrderResult = { success: boolean; orderNumber?: string; error?: unknown };
type CartDrawerItem = CartItem & { product_id?: string };

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderResult, setOrderResult] = useState<CartOrderResult | null>(null);
  const { user } = useAuth();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const router = useRouter();
  const { settings } = useStoreSettings();

  const getNormalizedSize = (originalValue: string | undefined | null) => {
    if (!originalValue) return originalValue;
    const term = String(originalValue).trim().toLowerCase();
    const mapping = settings?.variant_normalizations?.find((n: { original_value: string; normalized_ar?: string; normalized_en?: string }) => n.original_value.toLowerCase() === term);
    if (!mapping) return originalValue;
    return locale === 'ar' ? (mapping.normalized_ar || mapping.normalized_en || originalValue) : (mapping.normalized_en || originalValue);
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => { setIsCartOpen(false); setOrderResult(null); setIsCheckout(false); }}
      />

      {/* Drawer */}
      <div className={`fixed ${rtl ? 'left-0 border-r' : 'right-0 border-l'} top-0 z-50 h-full w-full max-w-md bg-background-dark border-white/10 shadow-2xl flex flex-col font-sans transition-transform`}>

        {/* Header - Stitch UI Style */}
        <header className="sticky top-0 z-10 flex items-center bg-background-dark/80 backdrop-blur-md p-6 justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-lg font-bold uppercase tracking-[0.1em]">Shopping Bag</h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black text-xs font-bold leading-none">{cartCount}</span>
          </div>
          <button onClick={() => { setIsCartOpen(false); setOrderResult(null); setIsCheckout(false); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white" aria-label="Close cart">
            <X size={20} />
          </button>
        </header>

        {/* Order Success */}
        {orderResult?.success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={32} className="text-primary" />
            </div>
            <h3 className="text-2xl font-normal italic text-white mb-2">Order Confirmed!</h3>
            <p className="text-fg-muted mb-1">Your order number is</p>
            <p className="text-3xl font-bold text-primary mb-8">{orderResult.orderNumber}</p>
            <button
              onClick={() => { setIsCartOpen(false); setOrderResult(null); setIsCheckout(false); }}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all uppercase tracking-widest text-sm"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingBag size={48} className="text-fg-faint mb-6" />
              <h3 className="text-xl font-normal text-white mb-2 uppercase tracking-widest">Your bag is empty</h3>
              <p className="text-fg-muted text-sm italic">Discover our signature scents.</p>
              <button
                onClick={() => { setIsCartOpen(false); }}
                className="mt-8 px-8 py-3 rounded-full border border-white/20 text-white uppercase tracking-widest text-xs font-bold hover:bg-white hover:text-black transition-colors"
              >
                Shop Now
              </button>
          </div>
        ) : (
          <>
                {/* Cart Items List - Stitch UI Style */}
                <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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

                    // Fixed itemName extraction with better type safety
                    const itemName = isBundle && item.bundle
                      ? (locale === 'ar' ? (item.bundle.name_ar || item.bundle.name) : (item.bundle.name_en || item.bundle.name))
                      : (locale === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name));

                return (
                  <div key={key} className="flex flex-col gap-4 pb-6 border-b border-white/10 group">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="relative aspect-square rounded-xl size-24 shrink-0 shadow-lg border border-white/5 overflow-hidden bg-surface-dark">
                        <Image src={item.image_url || item.bundle?.image_url || ""} alt={itemName || "Cart item"} fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className={`flex justify-between items-start ${rtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                            <p className="text-white text-base font-semibold leading-tight line-clamp-2 px-1">{itemName}</p>
                            <button onClick={() => removeFromCart(itemId, item.selectedSize, item.variant_id, isBundle)} className="text-fg-muted hover:text-red-500 transition-colors p-1 -m-1" aria-label="Remove item">
                              <X size={18} />
                            </button>
                          </div>
                          <p className={`text-fg-muted text-xs mt-1.5 uppercase tracking-wider ${rtl ? 'text-right' : 'text-left'}`}>
                            {isBundle ? "Gift Set" : getNormalizedSize(item.selectedSize)}
                          </p>
                        </div>

                        {/* Price & Quantity */}
                        <div className={`flex items-center justify-between mt-3 ${rtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          <p className="text-primary text-lg font-bold leading-normal">
                            {formatCurrency(Number(sizePrice) * item.quantity, locale)}
                          </p>
                          <div className="flex items-center gap-3 bg-white/5 rounded-full px-2 py-1 border border-white/10">
                            <button onClick={() => updateQuantity(itemId, item.selectedSize, item.quantity - 1, item.variant_id, isBundle)} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shadow-sm" aria-label="Decrease quantity">
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold w-4 text-center text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(itemId, item.selectedSize, item.quantity + 1, item.variant_id, isBundle)} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black font-bold shadow-sm hover:bg-primary/90 transition-colors" aria-label="Increase quantity">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                </main>

                {/* Bottom Section - Stitch UI Style */}
                <footer className="sticky bottom-0 bg-background-dark p-6 border-t border-white/10">

                  {/* Summary Section */}
                  <div className="mb-6 space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className={`flex justify-between items-center ${rtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-fg font-bold text-sm uppercase tracking-wider">Total</span>
                      <span className="text-primary font-bold text-xl">{formatCurrency(cartTotal, locale)}</span>
                    </div>
                    <div className="text-[10px] text-fg-muted text-center pt-3 border-t border-white/5 uppercase tracking-widest mt-2">
                      Shipping & taxes calculated at checkout
                    </div>
              </div>

                  {/* Action Buttons */}
              {isCheckout ? (
                    <div className="space-y-3 fade-in">
                  {!user ? (
                    <div className="text-center">
                          <p className="text-fg-muted text-sm mb-4">You must be signed in to checkout securely.</p>
                      <button
                            onClick={() => { setIsCartOpen(false); router.push('/login'); }}
                            className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all shadow-lg shadow-white/10"
                      >
                            Sign In / Register
                      </button>
                    </div>
                  ) : (
                    <button
                            onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}
                            className={`w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-sm ${rtl ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                            Proceed to Checkout
                            <ArrowRight size={18} className={rtl ? 'rotate-180' : ''} />
                    </button>
                  )}
                      <button onClick={() => setIsCheckout(false)} className="w-full text-fg-muted text-xs uppercase tracking-widest hover:text-white transition-colors py-3 font-bold mt-2">
                    Back to Bag
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCheckout(true)}
                        className={`w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-sm ${rtl ? 'flex-row-reverse' : 'flex-row'}`}
                >
                        Checkout securely
                        <ArrowRight size={18} className={rtl ? 'rotate-180' : ''} />
                </button>
              )}
                </footer>
          </>
        )}
      </div>
    </>
  );
}
