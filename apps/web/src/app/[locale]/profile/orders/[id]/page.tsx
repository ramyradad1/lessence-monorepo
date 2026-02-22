"use client";

import { useAuth } from "@lessence/supabase";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Package, MapPin, CreditCard, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Order, Address, OrderItem, OrderStatusHistory, ReturnRequest } from "@lessence/core";
import OrderTimeline from "@/components/OrderTimeline";
import { useTranslations, useLocale } from "next-intl";
import { isRTL, formatCurrency } from "@lessence/core";

type DetailedOrder = Order & {
  items: OrderItem[];
  address: Address;
  status_history: OrderStatusHistory[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  shipped: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  delivered: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
  refunded: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export default function OrderDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const t = useTranslations('orders');
  const locale = useLocale();
  const rtl = isRTL(locale);
  
  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchOrder = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (*),
          address:addresses (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setOrder(data);
        
        // Fetch return request if any
        const { data: returnData } = await supabase
          .from('return_requests')
          .select('*')
          .eq('order_id', orderId)
          .single();
        
        if (returnData) {
          setReturnRequest(returnData);
        }
      }
      setLoading(false);
    };

    fetchOrder();
  }, [user, authLoading, orderId, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#181611] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`min-h-screen bg-[#181611] flex flex-col items-center justify-center p-4 ${rtl ? 'rtl' : 'ltr'}`}>
        <p className="text-white/40 mb-6 font-display text-xl">{t('order_not_found')}</p>
        <button onClick={() => router.push('/profile/orders')} className="text-[#f4c025] uppercase tracking-widest text-[10px] font-bold">
          {t('back_to_orders')}
        </button>
      </div>
    );
  }

  const canRequestReturn = order.status === 'delivered';

  return (
    <>
      <Navbar />
      <div className={`min-h-screen bg-background-dark pt-32 pb-20 px-4 ${rtl ? 'rtl text-right' : 'ltr text-left'}`}>
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/profile/orders')}
            className={`flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest font-bold mb-8 ${rtl ? 'flex-row-reverse' : ''}`}
          >
            <ChevronLeft size={16} className={rtl ? 'rotate-180' : ''} />
            {t('back_to_orders')}
          </button>

          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 ${rtl ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <div className={`flex items-center gap-3 mb-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="font-display text-3xl text-white">{order.order_number}</h1>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                  {t(`statuses.${order.status}`)}
                </span>
              </div>
              <p className="text-white/40 text-sm italic">{t('placed_on')} {new Date(order.created_at).toLocaleDateString(locale)}</p>
            </div>

            {canRequestReturn && !returnRequest && (
              <button 
                onClick={() => router.push(`/profile/returns/new/${order.id}`)}
                className={`flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all ${rtl ? 'flex-row-reverse' : ''}`}
              >
                <RotateCcw size={14} />
                {t('request_return')}
              </button>
            )}
          </div>

          {returnRequest && (
            <div className={`glass-effect p-6 rounded-3xl border border-[#f4c025]/20 bg-[#f4c025]/5 mb-10 flex items-center justify-between ${rtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${rtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-[#f4c025]/10 rounded-full flex items-center justify-center">
                  <RotateCcw size={20} className="text-[#f4c025]" />
                </div>
                <div>
                  <h2 className="text-white font-display text-lg">{t('return_request')}</h2>
                  <p className={`text-white/40 text-xs uppercase tracking-widest font-bold ${rtl ? 'text-right' : 'text-left'}`}>
                    {t('status')}: <span className="text-[#f4c025]">{t(`return_statuses.${returnRequest.status}`)}</span>
                  </p>
                </div>
              </div>
              <div className={rtl ? 'text-left' : 'text-right'}>
                <p className="text-white/20 text-[10px] uppercase tracking-widest">{t('requested_on')}</p>
                <p className="text-white/60 text-xs font-medium">{new Date(returnRequest.created_at).toLocaleDateString(locale)}</p>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="glass-effect p-8 rounded-3xl border border-white/5 mb-8">
            <h2 className={`text-lg font-display text-white mb-6 ${rtl ? 'text-right' : 'text-left'}`}>{t('order_status')}</h2>
            <OrderTimeline currentStatus={order.status} history={order.status_history} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="glass-effect p-8 rounded-3xl border border-white/5">
                <div className={`flex items-center gap-3 mb-6 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <Package size={20} className="text-white/60" />
                  <h2 className="text-lg font-display text-white">{t('order_items')}</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {order.items?.map((item) => (
                    <div key={item.id} className={`py-4 flex justify-between items-center gap-4 ${rtl ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <p className={`text-white font-medium mb-1 ${rtl ? 'text-right' : 'text-left'}`}>{item.product_name}</p>
                        <p className={`text-white/40 text-xs ${rtl ? 'text-right' : 'text-left'}`}>{item.selected_size} × {item.quantity}</p>
                      </div>
                      <p className="text-white font-semibold">{formatCurrency(item.price * item.quantity, locale)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                  <div className={`flex justify-between text-sm ${rtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-white/40">{t('subtotal')}</span>
                    <span className="text-white">{formatCurrency(order.subtotal, locale)}</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className={`flex justify-between text-sm ${rtl ? 'flex-row-reverse' : ''}`}>
                      <span className="text-white/40">{t('discount')}</span>
                      <span className="text-emerald-400">-{formatCurrency(order.discount_amount, locale)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold ${rtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-white">{t('total')}</span>
                    <span className="text-[#f4c025]">{formatCurrency(order.total_amount, locale)}</span>
                  </div>
                </div>
              </div>

              {/* Gift Message if any */}
              {order.is_gift && order.gift_message && (
                <div className="glass-effect p-8 rounded-3xl border border-[#f4c025]/20 bg-[#f4c025]/5">
                  <h3 className={`text-xs font-bold text-[#f4c025] uppercase tracking-widest mb-4 ${rtl ? 'text-right' : 'text-left'}`}>{t('gift_message')}</h3>
                  <p className={`text-white/80 italic font-serif text-lg leading-relaxed ${rtl ? 'text-right' : 'text-left'}`}>{order.gift_message}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="glass-effect p-6 rounded-3xl border border-white/5">
                <div className={`flex items-center gap-3 mb-4 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <MapPin size={18} className="text-white/60" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">{t('shipping')}</h2>
                </div>
                {order.address ? (
                  <div className={`text-sm text-white/60 space-y-1 ${rtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-white font-medium mb-2">{order.address.full_name}</p>
                    <p>{order.address.address_line1}</p>
                    {order.address.address_line2 && <p>{order.address.address_line2}</p>}
                    <p>{order.address.city}, {order.address.state} {order.address.postal_code}</p>
                    <p>{order.address.country}</p>
                  </div>
                ) : (
                  <p className={`text-white/40 text-xs ${rtl ? 'text-right' : 'text-left'}`}>{t('address_not_available')}</p>
                )}
              </div>

              {/* Payment Info placeholder */}
              <div className="glass-effect p-6 rounded-3xl border border-white/5">
                <div className={`flex items-center gap-3 mb-4 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <CreditCard size={18} className="text-white/60" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">{t('payment')}</h2>
                </div>
                <p className={`text-white/60 text-sm ${rtl ? 'text-right' : 'text-left'}`}>
                  {t('status')}: <span className="text-white font-medium uppercase text-[10px] ml-1">{order.status === 'pending' ? t('payment_pending') : t('payment_completed')}</span>
                </p>
                <p className={`text-white/40 text-[10px] mt-2 uppercase tracking-widest ${rtl ? 'text-right' : 'text-left'}`}>{t('card_ending')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
