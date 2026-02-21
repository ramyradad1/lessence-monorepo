'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Button, Input, Label } from '@lessence/ui';
import { Trash2, Loader2, ArrowRight } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, cartTotal, removeFromCart, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  
  const [address, setAddress] = useState({
    email: '',
    phone: '',
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Egypt',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const EGYPT_GOVERNORATES = [
    "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum",
    "Gharbia", "Ismailia", "Menofia", "Minya", "Qalyubia", "New Valley",
    "Sharqia", "Suez", "Aswan", "Assiut", "Beni Suef", "Damietta",
    "Kafr El Sheikh", "Matrouh", "Port Said", "Qena", "South Sinai",
    "North Sinai", "Sohag", "Luxor"
  ].sort();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-cod-order', {
        body: {
          cartItems: cart,
          address,
          couponCode: couponCode || undefined,
        }
      });

      if (response.error) {
          throw new Error(response.error.message || 'Error initiating checkout');
      }

      const data = response.data;
      
      if (data?.success && data?.orderId) {
        window.location.href = `/checkout/success?session_id=${data.orderId}`;
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-50" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
         <h1 className="text-3xl font-light text-zinc-900 dark:text-zinc-50 mb-6">Your Cart is Empty</h1>
         <Button href="/shop" variant="default" size="lg">Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-display text-white mb-12 uppercase tracking-[0.2em]">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Checkout Form */}
          <div className="lg:col-span-7 space-y-10">
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8 glass-effect p-8 rounded-2xl shadow-2xl border border-white/5 relative overflow-hidden">
              
              <div>
                <h2 className="text-xl font-display text-primary mb-6 uppercase tracking-widest">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      value={address.email} 
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={address.phone}
                      onChange={handleChange}
                      placeholder="+20 1XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-display text-primary mb-6 mt-10 uppercase tracking-widest">Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required value={address.fullName} onChange={handleChange} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input id="line1" name="line1" required value={address.line1} onChange={handleChange} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                    <Input id="line2" name="line2" value={address.line2} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="city">City / District</Label>
                    <Input id="city" name="city" required value={address.city} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="state">Governorate</Label>
                    <select
                      id="state"
                      name="state"
                      required
                      value={address.state}
                      onChange={handleChange}
                      title="Select Governorate"
                      className="w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors appearance-none"
                    >
                      <option value="" disabled>Select Governorate</option>
                      {EGYPT_GOVERNORATES.map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="postal_code">ZIP / Postal Code</Label>
                    <Input id="postal_code" name="postal_code" required value={address.postal_code} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" required value={address.country} onChange={handleChange} readOnly />
                  </div>
                </div>
              </div>
            </form>
          </div>


          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="glass-effect p-8 rounded-2xl shadow-2xl border border-white/5 sticky top-24">
              <h2 className="text-xl font-display text-primary mb-6 uppercase tracking-widest">Order Summary</h2>
              
              <div className="flow-root mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                <ul className="-my-6 divide-y divide-white/5">
                  {cart.map((item) => (
                    <li key={`${item.id}-${item.selectedSize}`} className="py-6 flex">
                      <div className="flex-shrink-0 w-20 h-20 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/5" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-display text-white">
                            <h3>{item.name}</h3>
                            <p className="ml-4 text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">Size: {item.selectedSize}</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                              <button
                                onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                              className="px-3 py-1 text-white/40 hover:text-primary transition-colors"
                              >-</button>
                            <span className="px-3 font-bold text-white text-xs">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                              className="px-3 py-1 text-white/40 hover:text-primary transition-colors"
                              >+</button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id, item.selectedSize)}
                            className="font-medium text-red-400/60 hover:text-red-400 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-6 space-y-4">
                 <div>
                    <Label htmlFor="coupon">Gift card or discount code</Label>
                    <div className="flex mt-1">
                        <Input 
                            id="coupon" 
                            name="coupon" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value)} 
                            className="rounded-r-none" 
                            placeholder="CODE"
                        />
                    <Button type="button" variant="outline" className="rounded-l-none border-l-0 px-4">Apply</Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <div className="flex justify-between text-white/40 text-xs uppercase tracking-wider">
                    <p>Subtotal</p>
                    <p className="text-white">${cartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-white/40 text-xs uppercase tracking-wider">
                    <p>Shipping</p>
                    <p className="italic">Calculated at next step</p>
                  </div>
                  <div className="flex justify-between text-lg font-display text-white pt-4 border-t border-white/10">
                    <p className="uppercase tracking-widest text-sm">Total</p>
                    <p className="text-primary font-bold">${cartTotal.toFixed(2)}</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-xs border border-red-500/20">
                    {error}
                  </div>
                )}

                <Button 
                    type="submit" 
                    form="checkout-form"
                  className="w-full h-14 text-sm" 
                    disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order (Cash on Delivery)'}
                  {!loading && <ArrowRight className="w-5 ml-2" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
