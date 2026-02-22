'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Button, Input, Label } from '@lessence/ui';
import { Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { isRTL, formatCurrency } from '@lessence/core';
import { useRouter } from '@/navigation';
import Image from 'next/image';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CheckoutPage() {
  const { cart, cartTotal, removeFromCart, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const originalSubtotal = cartTotal;
  const orderTotal = originalSubtotal - discountAmount;
  const locale = useLocale();
  const t = useTranslations('checkout');
  const rtl = isRTL(locale);
  const router = useRouter();

  const [address, setAddress] = useState({
    email: '',
    phone: '',
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: locale === 'ar' ? 'مصر' : 'Egypt',
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
      const response = await supabase.functions.invoke('create-cod-order', {
        body: {
          cartItems: cart,
          address,
          couponCode: couponCode || undefined,
          isGift,
          giftWrap,
          giftMessage: giftMessage.trim() || undefined
        }
      });

      if (response.error) {
        // If the error comes from the Edge Function logic itself
        if (response.error.context && response.error.context.length > 0) {
          const body = await response.error.context.text();
          try {
            const errorObj = JSON.parse(body);
            throw new Error(errorObj.error || t('error_initiating_checkout'));
          } catch {
            throw new Error(body);
          }
        }
          throw new Error(response.error.message || t('error_initiating_checkout'));
      }

      const data = response.data;
      
      if (data?.success && data?.orderId) {
        router.push(`/checkout/success?session_id=${data.orderId}`);
      } else {
        throw new Error(t('failed_create_order'));
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, t('error_unexpected')));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponError(t('invalid_coupon'));
      setDiscountAmount(0);
      setDiscountType(null);
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      // Get the authorization header if logged in (for user-specific rules)
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};

      // Fix for empty string token bug
      if (session && session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await supabase.functions.invoke('apply-coupon', {
        body: {
          couponCode,
          cartItems: cart
        },
        headers
      });

      if (response.error) {
        if (response.error.context && response.error.context.length > 0) {
          const body = await response.error.context.text();
          try {
            const errorObj = JSON.parse(body);
            throw new Error(errorObj.error || t('invalid_coupon'));
          } catch {
            throw new Error(body);
          }
        }
        throw new Error(t('failed_coupon'));
      }

      const data = response.data;
      if (data?.success) {
        setDiscountAmount(data.discountAmount);
        setDiscountType(data.discountType);
        setCouponError(null);
      } else {
        throw new Error(t('invalid_coupon'));
      }

    } catch (err: unknown) {
      setCouponError(getErrorMessage(err, t('failed_coupon')));
      setDiscountAmount(0);
      setDiscountType(null);
    } finally {
      setIsApplyingCoupon(false);
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
         <h1 className="text-3xl font-light text-zinc-900 dark:text-zinc-50 mb-6">{t('cart_empty')}</h1>
         <Button href="/shop" variant="default" size="lg">{t('continue_shopping')}</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background-dark py-12 px-4 sm:px-6 lg:px-8 ${rtl ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-display text-white mb-12 uppercase tracking-[0.2em]">{t('checkout')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Checkout Form */}
          <div className="lg:col-span-7 space-y-10">
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8 glass-effect p-8 rounded-2xl shadow-2xl border border-white/5 relative overflow-hidden">
              
              <div>
                <h2 className="text-xl font-display text-primary mb-6 uppercase tracking-widest">{t('contact_info')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className={rtl ? 'text-right block' : ''}>{t('email')}</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      value={address.email} 
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={rtl ? 'text-right' : 'text-left'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className={rtl ? 'text-right block' : ''}>{t('phone_number')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={address.phone}
                      onChange={handleChange}
                      placeholder="+20 1XX XXX XXXX"
                      className={rtl ? 'text-right' : 'text-left'}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-display text-primary mb-6 mt-10 uppercase tracking-widest">{t('shipping_address')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName" className={rtl ? 'text-right block' : ''}>{t('full_name')}</Label>
                    <Input id="fullName" name="fullName" required value={address.fullName} onChange={handleChange} className={rtl ? 'text-right' : 'text-left'} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line1" className={rtl ? 'text-right block' : ''}>{t('address_line_1')}</Label>
                    <Input id="line1" name="line1" required value={address.line1} onChange={handleChange} className={rtl ? 'text-right' : 'text-left'} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line2" className={rtl ? 'text-right block' : ''}>{t('address_line_2')}</Label>
                    <Input id="line2" name="line2" value={address.line2} onChange={handleChange} className={rtl ? 'text-right' : 'text-left'} />
                  </div>
                  <div>
                    <Label htmlFor="city" className={rtl ? 'text-right block' : ''}>{t('city')}</Label>
                    <Input id="city" name="city" required value={address.city} onChange={handleChange} className={rtl ? 'text-right' : 'text-left'} />
                  </div>
                  <div>
                    <Label htmlFor="state" className={rtl ? 'text-right block' : ''}>{t('governorate')}</Label>
                    <div className="relative">
                      <select
                        id="state"
                        name="state"
                        required
                        value={address.state}
                        onChange={handleChange}
                        title={t('select_governorate')}
                        className={`w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors appearance-none ${rtl ? 'text-right pr-4 pl-10' : 'text-left pl-4 pr-10'}`}
                      >
                        <option value="" disabled>{t('select_governorate')}</option>
                        {EGYPT_GOVERNORATES.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                      <div className={`absolute inset-y-0 ${rtl ? 'left-4' : 'right-4'} flex items-center pointer-events-none opacity-20`}>
                        <ArrowRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className={rtl ? 'text-right block' : ''}>{t('zip_code')}</Label>
                    <Input id="postal_code" name="postal_code" required value={address.postal_code} onChange={handleChange} className={rtl ? 'text-right' : 'text-left'} />
                  </div>
                  <div>
                    <Label htmlFor="country" className={rtl ? 'text-right block' : ''}>{t('country')}</Label>
                    <Input id="country" name="country" required value={address.country} onChange={handleChange} readOnly className={rtl ? 'text-right' : 'text-left'} />
                  </div>
                </div>
              </div>

              {/* Gift Options */}
              <div className="pt-4 border-t border-white/10 mt-6 text-left rtl:text-right">
                <div className={`flex items-center space-x-3 mb-4 ${rtl ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <input
                    type="checkbox"
                    id="is_gift"
                    checked={isGift}
                    onChange={(e) => {
                      setIsGift(e.target.checked);
                      if (!e.target.checked) {
                        setGiftWrap(false);
                        setGiftMessage('');
                      }
                    }}
                    aria-label={t('is_gift')}
                    className="w-5 h-5 rounded border border-white/10 bg-[#181611] accent-[#f4c025] focus:ring-[#f4c025] focus:ring-offset-background-dark transition-colors cursor-pointer"
                  />
                  <Label htmlFor="is_gift" className="text-white text-base font-medium cursor-pointer mb-0">{t('is_gift')}</Label>
                </div>

                {isGift && (
                  <div className={`space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300 ${rtl ? 'pr-8' : 'pl-8'}`}>
                    <div className={`flex items-center space-x-3 ${rtl ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <input
                        type="checkbox"
                        id="gift_wrap"
                        checked={giftWrap}
                        onChange={(e) => setGiftWrap(e.target.checked)}
                        aria-label={t('gift_wrap')}
                        className="w-4 h-4 rounded border border-white/10 bg-[#181611] accent-[#f4c025] focus:ring-[#f4c025] focus:ring-offset-background-dark transition-colors cursor-pointer"
                      />
                      <Label htmlFor="gift_wrap" className="text-white/80 text-sm cursor-pointer mb-0">{t('gift_wrap')}</Label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="gift_message" className="text-white/80 mb-0">{t('gift_message')}</Label>
                        <span className={`text-xs ${giftMessage.length > 250 ? 'text-red-400' : 'text-white/40'}`}>
                          {giftMessage.length}/250
                        </span>
                      </div>
                      <textarea
                        id="gift_message"
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value.substring(0, 250))}
                        placeholder={t('gift_message_placeholder')}
                        className={`w-full h-24 bg-[#181611] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors placeholder:text-white/20 resize-none ${rtl ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>


          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="glass-effect p-8 rounded-2xl shadow-2xl border border-white/5 sticky top-24">
              <h2 className="text-xl font-display text-primary mb-6 uppercase tracking-widest">{t('order_summary')}</h2>
              
              <div className="flow-root mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                <ul className="-my-6 divide-y divide-white/5">
                  {cart.map((item) => {
                    const itemName = locale === 'ar' 
                      ? (item.bundle ? (item.bundle.name_ar || item.bundle.name) : (item.name_ar || item.name))
                      : (item.bundle ? (item.bundle.name_en || item.bundle.name) : (item.name_en || item.name));
                    
                    return (
                      <li key={`${item.id}-${item.selectedSize}`} className={`py-6 flex ${rtl ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 w-20 h-20 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                          {item.image_url || item.bundle?.image_url ? (
                            <Image 
                              src={item.image_url || item.bundle?.image_url || ''} 
                              alt={itemName || 'Item'} 
                              width={80} 
                              height={80} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                              <div className="w-full h-full bg-white/5" />
                          )}
                        </div>
                        <div className={`${rtl ? 'mr-4' : 'ml-4'} flex-1 flex flex-col`}>
                          <div>
                            <div className={`flex justify-between text-base font-display text-white ${rtl ? 'flex-row-reverse' : ''}`}>
                              <h3>{itemName} {item.bundle && <span className="text-xs text-[#f4c025] block mt-1">{t('gift_set')}</span>}</h3>
                              <p className={`${rtl ? 'mr-4' : 'ml-4'} text-primary`}>{formatCurrency((item.price || item.bundle?.price || 0) * item.quantity, locale)}</p>
                            </div>
                            {!item.bundle && <p className={`mt-1 text-xs text-white/40 uppercase tracking-wider ${rtl ? 'text-right' : 'text-left'}`}>{t('size')}: {item.selectedSize}</p>}
                          </div>
                          <div className={`flex-1 flex items-end justify-between text-sm ${rtl ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center bg-white/5 rounded-lg border border-white/10 ${rtl ? 'flex-row-reverse' : ''}`}>
                                <button
                                onClick={() => updateQuantity(item.id || '', item.selectedSize, item.quantity - 1)}
                                className="px-3 py-1 text-white/40 hover:text-primary transition-colors"
                                >-</button>
                              <span className="px-3 font-bold text-white text-xs">{item.quantity}</span>
                                <button
                                onClick={() => updateQuantity(item.id || '', item.selectedSize, item.quantity + 1)}
                                className="px-3 py-1 text-white/40 hover:text-primary transition-colors"
                                >+</button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id || '', item.selectedSize)}
                              className="font-medium text-red-400/60 hover:text-red-400 transition-colors"
                              aria-label={t('remove_item')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-6 space-y-4">
                 <div className="text-left rtl:text-right">
                    <Label htmlFor="coupon" className={rtl ? 'text-right block' : ''}>{t('coupon_label')}</Label>
                    <div className={`flex mt-1 ${rtl ? 'flex-row-reverse' : ''}`}>
                        <Input 
                            id="coupon" 
                            name="coupon" 
                            value={couponCode} 
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        if (discountAmount > 0) {
                          setDiscountAmount(0);
                          setDiscountType(null);
                        }
                      }} 
                            className={rtl ? 'rounded-l-xl rounded-r-none text-right' : 'rounded-r-none text-left'} 
                            placeholder={t('coupon_placeholder')}
                        />
                    <Button
                      type="button"
                      variant="outline"
                      className={`${rtl ? 'rounded-r-xl rounded-l-none border-r-0' : 'rounded-l-none border-l-0'} px-4 min-w-[80px]`}
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode}
                    >
                      {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : t('apply')}
                    </Button>
                    </div>
                  {couponError && (
                    <p className="text-red-400 text-xs mt-2">{couponError}</p>
                  )}
                  {discountAmount > 0 && !couponError && (
                    <p className="text-emerald-400 text-xs mt-2">{t('discount_success')}</p>
                  )}
                  {discountType === 'free_shipping' && !couponError && (
                    <p className="text-emerald-400 text-xs mt-2">{t('free_shipping_applied')}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <div className={`flex justify-between text-white/40 text-xs uppercase tracking-wider ${rtl ? 'flex-row-reverse' : ''}`}>
                    <p>{t('subtotal')}</p>
                    <p className="text-white">{formatCurrency(originalSubtotal, locale)}</p>
                  </div>
                  {discountAmount > 0 && (
                    <div className={`flex justify-between text-emerald-400/80 text-xs uppercase tracking-wider ${rtl ? 'flex-row-reverse' : ''}`}>
                      <p>{t('discount')}</p>
                      <p>-{formatCurrency(discountAmount, locale)}</p>
                    </div>
                  )}
                  <div className={`flex justify-between text-white/40 text-xs uppercase tracking-wider ${rtl ? 'flex-row-reverse' : ''}`}>
                    <p>{t('shipping')}</p>
                    <p className="italic">{discountType === 'free_shipping' ? <span className="text-emerald-400 font-bold not-italic">{t('free')}</span> : t('calculated_next_step')}</p>
                  </div>
                  <div className={`flex justify-between text-lg font-display text-white pt-4 border-t border-white/10 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <p className="uppercase tracking-widest text-sm">{t('total')}</p>
                    <p className="text-primary font-bold">{formatCurrency(Math.max(0, orderTotal), locale)}</p>
                  </div>
                </div>

                {error && (
                  <div className={`bg-red-500/10 text-red-400 p-3 rounded-lg text-xs border border-red-500/20 ${rtl ? 'text-right' : 'text-left'}`}>
                    {error}
                  </div>
                )}

                <Button 
                    type="submit" 
                    form="checkout-form"
                  className={`w-full h-14 text-sm ${rtl ? 'flex-row-reverse' : ''}`} 
                    disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('place_order')}
                  {!loading && <ArrowRight className={`w-5 ${rtl ? 'mr-2 rotate-180' : 'ml-2'}`} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
