'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const showWhatsapp = searchParams.get('whatsapp') === 'true';
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const t = useTranslations('checkout');

  useEffect(() => {
    if (sessionId) {
      clearCart();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181611]">
        <Loader2 className="w-8 h-8 animate-spin text-[#f4c025]" />
      </div>
    );
  }

  const orderRef = sessionId ? (sessionId.split('_')[1] || sessionId) : '';

  return (
    <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-[#1e1b16] p-10 rounded-3xl border border-white/5 text-center relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-900/20 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-900/30 mb-8">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-light text-white mb-4">
            {t('order_confirmed')}
          </h2>
          
          <p className="text-fg-muted text-lg mb-8">
            {t('thank_you_msg')}
          </p>
          
          {sessionId && (
            <p className="text-sm text-fg-faint mb-10 break-all font-mono">
              {t('order_ref')} {orderRef}
            </p>
          )}

          {showWhatsapp && sessionId && (
            <div className="mb-10 p-6 rounded-2xl bg-green-900/20 border border-green-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-green-400 font-medium mb-4">{t('whatsapp_msg')}</p>
              <a
                href={`https://wa.me/201000000000?text=${encodeURIComponent(t('order_success_message', { orderRef }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-green-500 text-white px-6 h-12 rounded-full font-bold tracking-wide w-full hover:bg-green-400 transition-all"
              >
                {t('confirm_whatsapp')}
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/profile" className="inline-flex items-center justify-center border border-white/20 text-white px-6 h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all">
              {t('view_history')}
            </Link>
            <Link href="/shop" className="inline-flex items-center justify-center bg-[#f4c025] text-black px-6 h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all">
              {t('continue_shopping')} <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#181611]">
        <Loader2 className="w-8 h-8 animate-spin text-[#f4c025]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
