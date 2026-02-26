'use client';

import Link from 'next/link';
import { XCircle, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { isRTL } from '@lessence/core';

export default function CheckoutCancelPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const rtl = isRTL(locale);

  return (
    <div className={`min-h-screen bg-[#181611] flex flex-col items-center justify-center py-12 px-4 ${rtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full space-y-8 bg-[#1e1b16] p-10 rounded-3xl border border-white/5 text-center relative overflow-hidden">
        <div className={`absolute -top-24 ${rtl ? '-left-24' : '-right-24'} w-48 h-48 bg-red-900/20 rounded-full blur-3xl opacity-50`} />
        
        <div className="relative z-10">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-900/30 mb-8">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-light text-white mb-4">
            {t('payment_cancelled')}
          </h2>
          
          <p className="text-fg-muted text-lg mb-8">
            {t('payment_cancelled_message')}
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${rtl ? 'sm:flex-row-reverse' : ''}`}>
            <Link href="/checkout" className={`inline-flex items-center justify-center bg-[#f4c025] text-black px-6 h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all ${rtl ? 'flex-row-reverse' : ''}`}>
              {t('try_again')} <ArrowRight className={`${rtl ? 'mr-2 rotate-180' : 'ml-2'} w-4 h-4`} />
            </Link>
            <Link href="/shop" className="inline-flex items-center justify-center border border-white/20 text-white px-6 h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all">
              {t('continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
