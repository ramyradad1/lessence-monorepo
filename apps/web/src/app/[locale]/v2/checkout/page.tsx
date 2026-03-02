"use client";
import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import LuxuryButton from "@/components/v2/LuxuryButton";
import SectionTitle from "@/components/v2/SectionTitle";
import { formatCurrency } from "@lessence/core";
import { useLocale } from "next-intl";
import Image from "next/image";

export default function V2CheckoutPage() {
  const { cartItems, cartTotalItems, cartSubtotal } = useCart();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    // Simulate checkout process
    setTimeout(() => {
      setLoading(false);
      alert("Checkout simulation complete.");
    }, 1500);
  };

  if (cartTotalItems === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-serif text-white uppercase tracking-widest mb-6">Your Bag is Empty</h2>
        <LuxuryButton variant="outline" onClick={() => window.location.href='/v2/shop'}>Continue Shopping</LuxuryButton>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 w-full min-h-[85vh]">
      <SectionTitle title="Secure Checkout" subtitle="Complete Your Order" />
      
      <div className="flex flex-col lg:flex-row gap-16 mt-12">
        {/* Left Col: Form fields (simulated) */}
        <div className="flex-1 space-y-10">
          <div>
            <h3 className="text-sm font-serif text-primary uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Shipping Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <input type="text" placeholder="First Name" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
              <input type="text" placeholder="Last Name" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
              <input type="text" placeholder="Address" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full col-span-2 uppercase tracking-wider text-xs" />
              <input type="text" placeholder="City" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
              <input type="text" placeholder="Postal Code" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-serif text-primary uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Payment Method</h3>
            <div className="bg-[#1c1a14] border border-white/10 p-6 rounded-sm">
              <div className="flex items-center gap-4 text-xs tracking-widest uppercase text-white/50">
                <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                   <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                Credit Card
              </div>
              <div className="mt-6 flex flex-col gap-6">
                <input type="text" placeholder="Card Number" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
                <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="MM/YY" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
                  <input type="text" placeholder="CVC" className="bg-transparent border-b border-white/20 pb-2 text-white focus:border-primary outline-none transition-colors w-full uppercase tracking-wider text-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Order Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-[#12100c] border border-white/10 p-8 sticky top-32">
            <h3 className="text-sm font-serif text-primary uppercase tracking-widest mb-6">Order Summary</h3>
            
            <div className="flex flex-col gap-6 mb-8 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="relative w-16 h-20 bg-[#1c1a14] rounded-sm p-2">
                    <Image src={item.product?.image_url || ""} alt="" fill className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
                      {locale === 'ar' ? (item.product?.name_ar || item.product?.name) : (item.product?.name_en || item.product?.name)}
                    </h4>
                    <p className="text-[10px] text-fg-faint uppercase tracking-widest">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs text-primary font-bold">{formatCurrency((item.product?.price || 0) * item.quantity, locale)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-6 space-y-4 mb-8">
              <div className="flex justify-between text-xs tracking-widest uppercase text-white/70">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal, locale)}</span>
              </div>
              <div className="flex justify-between text-xs tracking-widest uppercase text-white/70">
                <span>Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="flex justify-between text-sm tracking-widest uppercase text-white font-bold pt-4 border-t border-white/10 mt-4">
                <span>Total</span>
                <span className="text-primary text-lg">{formatCurrency(cartSubtotal, locale)}</span>
              </div>
            </div>

            <LuxuryButton fullWidth onClick={handleCheckout}>
              {loading ? "Processing..." : "Place Order"}
            </LuxuryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
