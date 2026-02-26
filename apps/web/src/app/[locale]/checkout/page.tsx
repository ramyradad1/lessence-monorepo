'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { isRTL, formatCurrency } from '@lessence/core';
import { useRouter } from '@/navigation';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useAuth } from '@lessence/supabase';
import Image from 'next/image';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CheckoutPage() {
  const { cart, cartTotal, removeFromCart, updateQuantity, stockErrors, validateStock } = useCart();
  const hasStockIssues = stockErrors.length > 0;
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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paymob'>('paymob');
  const originalSubtotal = cartTotal;
  const orderTotal = originalSubtotal - discountAmount;
  const locale = useLocale();
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const rtl = isRTL(locale);
  const router = useRouter();
  const { settings } = useStoreSettings();
  const { user } = useAuth();

  const inputClasses = `w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors placeholder:text-fg-faint`;

  const getNormalizedSize = (originalValue: string | undefined | null) => {
    if (!originalValue) return originalValue;
    const term = String(originalValue).trim().toLowerCase();
    const mapping = settings?.variant_normalizations?.find((n: { original_value: string; normalized_ar?: string; normalized_en?: string }) => n.original_value.toLowerCase() === term);
    if (!mapping) return originalValue;
    return locale === 'ar' ? (mapping.normalized_ar || mapping.normalized_en || originalValue) : (mapping.normalized_en || originalValue);
  };

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

  // Validate stock on page load and whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      validateStock();
    }
  }, [cart, validateStock]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    // Re-validate stock before submitting
    const checks = await validateStock();
    const bad = checks.filter((c: { ok: boolean }) => !c.ok);
    if (bad.length > 0) return;
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = 'create_order';
      const idempotency_key = crypto.randomUUID();
      const response = await supabase.functions.invoke(endpoint, {
        body: {
          items: cart.map(item => ({
            id: item.id,
            product_id: item.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selected_size: item.selectedSize,
            price: item.price || item.bundle?.price
          })),
          address,
          coupon_code: couponCode || undefined,
          idempotency_key,
          is_gift: isGift,
          gift_wrap: giftWrap,
          gift_message: giftMessage.trim() || undefined
        }
      });

      if (response.error) {
        console.error('Checkout error:', response.error);
        // Try to extract a meaningful message from the error context (Response body)
        let errorMessage = t('error_initiating_checkout');
        try {
          if (response.error.context instanceof Response) {
            const body = await response.error.context.json();
            if (body?.error) errorMessage = body.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          }
        } catch {
          // If JSON parsing fails, try text
          try {
            if (response.error.context instanceof Response) {
              const textBody = await response.error.context.text();
              if (textBody) errorMessage = textBody;
            }
          } catch {
          // Fallback to default error message
          }
        }
        throw new Error(errorMessage);
      }

      const data = response.data;
      
      if (data?.clientSecret && data?.publicKey) {
        // Redirection for Paymob unified checkout
        window.location.href = `https://accept.paymob.com/unifiedcheckout/?publicKey=${data.publicKey}&clientSecret=${data.clientSecret}`;
      } else if (data?.success && data?.orderId) {
        // Cash on delivery success redirect
        router.push(`/checkout/success?session_id=${data.orderId}&whatsapp=true`);
      } else {
        console.error('Unexpected response data:', data);
        throw new Error(data?.error || t('failed_create_order'));
      }
    } catch (err: unknown) {
      console.error('Checkout failed:', err);
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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center bg-background-dark">
        <h1 className="text-3xl font-sans text-white mb-6 uppercase tracking-widest">{t('cart_empty')}</h1>
        <button onClick={() => router.push('/shop')} className="px-8 py-4 rounded-full border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors">
          {t('continue_shopping')}
        </button>
      </div>
    );
  }

  if (!settings.business.guest_checkout_enabled && !user) {
    return (
      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center bg-background-dark">
        <h1 className="text-3xl font-sans text-white mb-6 uppercase tracking-widest">{tc ? tc('login_required') : 'Login Required'}</h1>
        <p className="text-fg-muted mb-8">{tc ? tc('login_to_checkout') : 'You must be logged in to checkout.'}</p>
        <button onClick={() => router.push('/profile?redirect=/checkout')} className="px-8 py-4 rounded-full bg-primary text-black font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          {tc ? tc('login') : 'Login'}
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background-dark py-12 px-4 sm:px-6 lg:px-8 ${rtl ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-sans text-white mb-12 uppercase tracking-[0.2em]">{t('checkout')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Checkout Form */}
          <div className="lg:col-span-7 space-y-10">
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8 bg-surface-dark p-8 rounded-2xl shadow-2xl border border-white/5 relative overflow-hidden">
              
              <div>
                <h2 className="text-xl font-sans text-primary mb-6 uppercase tracking-widest">{t('contact_info')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('email')}</label>
                    <input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      value={address.email} 
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('phone_number')}</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={address.phone}
                      onChange={handleChange}
                      placeholder="+20 1XX XXX XXXX"
                      className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-sans text-primary mb-6 mt-10 uppercase tracking-widest">{t('shipping_address')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="fullName" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('full_name')}</label>
                    <input id="fullName" name="fullName" required value={address.fullName} onChange={handleChange} className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="line1" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('address_line_1')}</label>
                    <input id="line1" name="line1" required value={address.line1} onChange={handleChange} className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="line2" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('address_line_2')}</label>
                    <input id="line2" name="line2" value={address.line2} onChange={handleChange} className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`} />
                  </div>
                  <div>
                    <label htmlFor="city" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('city')}</label>
                    <input id="city" name="city" required value={address.city} onChange={handleChange} className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`} />
                  </div>
                  <div>
                    <label htmlFor="state" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('governorate')}</label>
                    <div className="relative">
                      <select
                        id="state"
                        name="state"
                        required
                        value={address.state}
                        onChange={handleChange}
                        className={`${inputClasses} appearance-none ${rtl ? 'text-right pr-4 pl-10' : 'text-left pl-4 pr-10'}`}
                      >
                        <option value="" disabled>{t('select_governorate')}</option>
                        {EGYPT_GOVERNORATES.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                      <div className={`absolute inset-y-0 ${rtl ? 'left-4' : 'right-4'} flex items-center pointer-events-none opacity-40`}>
                        <ArrowRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="postal_code" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('zip_code')}</label>
                    <input id="postal_code" name="postal_code" required value={address.postal_code} onChange={handleChange} className={`${inputClasses} ${rtl ? 'text-right' : 'text-left'}`} />
                  </div>
                  <div>
                    <label htmlFor="country" className={`text-fg text-sm mb-2 font-medium ${rtl ? 'text-right block' : 'block'}`}>{t('country')}</label>
                    <input id="country" name="country" required value={address.country} onChange={handleChange} readOnly className={`${inputClasses} focus:border-white/10 ${rtl ? 'text-right' : 'text-left'}`} />
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
                  <label htmlFor="is_gift" className="text-white text-base font-medium cursor-pointer mb-0">{t('is_gift')}</label>
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
                      <label htmlFor="gift_wrap" className="text-fg text-sm cursor-pointer mb-0">{t('gift_wrap')}</label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="gift_message" className="text-fg text-sm font-medium mb-0">{t('gift_message')}</label>
                        <span className={`text-xs ${giftMessage.length > 250 ? 'text-red-400' : 'text-fg-muted'}`}>
                          {giftMessage.length}/250
                        </span>
                      </div>
                      <textarea
                        id="gift_message"
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value.substring(0, 250))}
                        placeholder={t('gift_message_placeholder')}
                        className={`${inputClasses} h-24 resize-none`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-white/10 mt-6 text-left rtl:text-right">
                <h2 className="text-xl font-sans text-primary mb-6 uppercase tracking-widest">{t('payment_method')}</h2>
                <div className="flex flex-col space-y-4">
                  <label className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'paymob' ? 'bg-primary/10 border-primary' : 'bg-[#181611] border-white/10 hover:border-white/20'} ${rtl ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="paymob"
                      title="Credit Card"
                      checked={paymentMethod === 'paymob'}
                      onChange={() => setPaymentMethod('paymob')}
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="text-white font-medium mb-0">{t('credit_card')}</span>
                  </label>
                  <label className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-primary/10 border-primary' : 'bg-[#181611] border-white/10 hover:border-white/20'} ${rtl ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      title="Cash on Delivery"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="text-white font-medium mb-0">{t('cash_on_delivery')}</span>
                  </label>
                </div>
              </div>
            </form>
          </div>


          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-surface-dark p-8 rounded-2xl shadow-2xl border border-white/5 sticky top-24">
              <h2 className="text-xl font-sans text-primary mb-6 uppercase tracking-widest">{t('order_summary')}</h2>
              
              <div className="flow-root mb-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <ul className="-my-6 divide-y divide-white/5">
                  {cart.map((item) => {
                    const itemName = locale === 'ar' 
                      ? (item.bundle ? (item.bundle.name_ar || item.bundle.name) : (item.name_ar || item.name))
                      : (item.bundle ? (item.bundle.name_en || item.bundle.name) : (item.name_en || item.name));
                    
                    return (
                      <li key={`${item.id}-${item.selectedSize}`} className={`py-6 flex ${rtl ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 w-24 h-24 bg-surface rounded-xl overflow-hidden border border-white/5 shadow-lg relative">
                          {item.image_url || item.bundle?.image_url ? (
                            <Image 
                              src={item.image_url || item.bundle?.image_url || ''} 
                              alt={itemName || 'Item'} 
                              fill
                              sizes="96px"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                              <div className="w-full h-full bg-white/5" />
                          )}
                        </div>
                        <div className={`${rtl ? 'mr-4' : 'ml-4'} flex-1 flex flex-col justify-between py-1`}>
                          <div>
                            <div className={`flex justify-between items-start text-base font-semibold text-white ${rtl ? 'flex-row-reverse' : ''}`}>
                              <h3 className="line-clamp-2 leading-tight">{itemName} {item.bundle && <span className="text-xs text-primary block mt-1">{t('gift_set')}</span>}</h3>
                              <p className={`${rtl ? 'mr-4' : 'ml-4'} text-primary font-bold`}>{formatCurrency((item.price || item.bundle?.price || 0) * item.quantity, locale)}</p>
                            </div>
                            {!item.bundle && <p className={`mt-1 text-xs text-fg-muted uppercase tracking-wider ${rtl ? 'text-right' : 'text-left'}`}>{t('size')}: {getNormalizedSize(item.selectedSize)}</p>}
                          </div>
                          <div className={`flex-1 flex items-end justify-between mt-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-2 bg-white/5 rounded-full border border-white/10 px-2 py-1 ${rtl ? 'flex-row-reverse' : ''}`}>
                                <button
                                onClick={() => updateQuantity(item.id || '', item.selectedSize, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shadow-sm"
                                >-</button>
                              <span className="w-4 text-center font-bold text-white text-sm">{item.quantity}</span>
                                <button
                                onClick={() => updateQuantity(item.id || '', item.selectedSize, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-black hover:bg-primary/90 transition-colors shadow-sm"
                                >+</button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id || '', item.selectedSize)}
                              className="text-fg-muted hover:text-red-500 transition-colors p-1"
                              aria-label={t('remove_item')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Stock warning per item */}
                          {stockErrors.some(e =>
                            item.bundle_id
                              ? e.bundleId === item.bundle_id
                              : (e.productId === item.id && (e.variantId ? e.variantId === item.variant_id : e.size === item.selectedSize))
                          ) && (
                              <p className="text-red-400 text-[10px] mt-2 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                                ⚠ {t('out_of_stock') || 'Out of stock'}
                              </p>
                            )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-6 space-y-4">
                 <div className="text-left rtl:text-right">
                  <label htmlFor="coupon" className={`text-fg text-sm font-medium mb-2 uppercase tracking-wide ${rtl ? 'text-right block' : 'block'}`}>{t('coupon_label')}</label>
                  <div className={`flex mt-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <input 
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
                      className={`${inputClasses} ${rtl ? 'rounded-l-xl rounded-r-none text-right' : 'rounded-r-none text-left'}`} 
                            placeholder={t('coupon_placeholder')}
                        />
                    <button
                      type="button"
                      className={`bg-white/10 hover:bg-white/20 text-white px-6 font-bold uppercase tracking-tight text-sm transition-colors ${rtl ? 'rounded-r-xl rounded-l-none' : 'rounded-l-none rounded-r-xl'} min-w-[100px] flex items-center justify-center`}
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode}
                    >
                      {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : t('apply')}
                    </button>
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

                <div className="flex flex-col gap-3 pt-4 bg-white/5 rounded-xl p-4 border border-white/5 mt-6">
                  <div className={`flex justify-between text-fg-muted text-xs uppercase tracking-wider ${rtl ? 'flex-row-reverse' : ''}`}>
                    <p>{t('subtotal')}</p>
                    <p className="text-white font-medium">{formatCurrency(originalSubtotal, locale)}</p>
                  </div>
                  {discountAmount > 0 && (
                    <div className={`flex justify-between text-emerald-400 text-xs uppercase tracking-wider ${rtl ? 'flex-row-reverse' : ''}`}>
                      <p>{t('discount')}</p>
                      <p className="font-medium">-{formatCurrency(discountAmount, locale)}</p>
                    </div>
                  )}
                  <div className={`flex justify-between text-fg-muted text-xs uppercase tracking-wider ${rtl ? 'flex-row-reverse' : ''}`}>
                    <p>{t('shipping')}</p>
                    <p className="italic">{discountType === 'free_shipping' ? <span className="text-emerald-400 font-bold not-italic">{t('free')}</span> : t('calculated_next_step')}</p>
                  </div>
                  <div className={`flex justify-between items-center text-lg font-sans text-white pt-4 border-t border-white/5 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <p className="uppercase tracking-widest text-sm font-bold">{t('total')}</p>
                    <p className="text-primary font-bold text-xl">{formatCurrency(Math.max(0, orderTotal), locale)}</p>
                  </div>
                </div>

                {error && (
                  <div className={`bg-red-500/10 text-red-400 p-3 rounded-xl text-xs border border-red-500/20 ${rtl ? 'text-right' : 'text-left'}`}>
                    {error}
                  </div>
                )}

                {hasStockIssues && (
                  <div className={`bg-red-500/10 text-red-400 p-3 rounded-xl text-xs border border-red-500/20 ${rtl ? 'text-right' : 'text-left'}`}>
                    {t('stock_error') || 'Some items in your cart are out of stock. Please remove them or reduce quantity to proceed.'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById('checkout-form') as HTMLFormElement;
                    if (form) {
                      if (form.reportValidity()) {
                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }
                    }
                  }}
                  className={`w-full mt-4 bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-full shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center uppercase tracking-widest text-sm ${rtl ? 'flex-row-reverse' : ''} ${hasStockIssues ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading || hasStockIssues}
                >
                  {loading ? (
                    <>
                      <Loader2 className={`w-5 h-5 animate-spin ${rtl ? 'ml-2' : 'mr-2'}`} />
                      {paymentMethod === 'paymob' ? t('redirecting_paymob') : t('place_order')}
                    </>
                  ) : (
                    paymentMethod === 'paymob' ? t('pay_now') : t('place_order')
                  )}
                  {!loading && <ArrowRight className={`w-5 ${rtl ? 'mr-2 rotate-180' : 'ml-2'}`} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
