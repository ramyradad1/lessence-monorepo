'use client';

import Link from 'next/link';
import { XCircle, ArrowRight } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-[#1e1b16] p-10 rounded-3xl border border-white/5 text-center relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-900/20 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-900/30 mb-8">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-light text-white mb-4">
            Payment Cancelled
          </h2>
          
          <p className="text-white/40 text-lg mb-8">
            Your payment was not completed. Nothing has been charged to your card.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/checkout" className="inline-flex items-center justify-center bg-[#f4c025] text-black px-6 h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all">
              Try Again <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link href="/shop" className="inline-flex items-center justify-center border border-white/20 text-white px-6 h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
