'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBundleBySlug } from '@lessence/supabase';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, ChevronLeft, Check } from 'lucide-react';
import type { BundleItem } from '@lessence/core';

export default function BundlePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { bundle, loading: bundleLoading, error } = useBundleBySlug(supabase, params.slug);
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);

  if (bundleLoading) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col pt-32 pb-24 items-center justify-center">
         <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col pt-32 pb-24 items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold text-white mb-4">Gift Set Not Found</h1>
        <p className="text-white/60 mb-8 max-w-md">We couldn&apos;t find the gift set you&apos;re looking for. It may have been removed or the URL is incorrect.</p>
        <Link href="/" className="bg-[#f4c025] text-black px-8 py-3 rounded-full font-bold tracking-widest uppercase hover:bg-white transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      // Use addToCart from useCartEngine, passing the `bundle` object directly, and flagging as bundle
      await addToCart(bundle, undefined, undefined, true);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      router.push('/checkout');
    } catch (err) {
      console.error('Failed to add bundle to cart:', err);
      alert('Failed to add gift set to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181611] pb-24">
      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-[#181611]/80 backdrop-blur-md z-50 border-b border-white/5 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium tracking-widest uppercase">Back to Store</span>
        </Link>
        <div className="flex-1" />
        <Link href="/" className="text-2xl font-bold text-white tracking-[0.2em]">L&apos;ESSENCE</Link>
        <div className="flex-1" />
      </nav>

      <main className="pt-32 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left Column: Image Gallery (Simplified for bundles) */}
        <div className="space-y-6">
          <div className="relative aspect-[4/5] bg-[#1e1b16] rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            
            {bundle.image_url ? (
               <Image
                 src={bundle.image_url}
                 alt={bundle.name}
                 fill
                 className="object-cover transition-transform duration-700 group-hover:scale-105"
                 priority
               />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    🎁
                </div>
            )}
            
            {/* Gift Set Badge */}
            <div className="absolute top-6 left-6 z-20 bg-[#f4c025] text-black text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase shadow-lg">
                Exclusive Gift Set
            </div>
          </div>
        </div>

        {/* Right Column: Bundle Details */}
        <div className="flex flex-col">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              {bundle.name}
            </h1>
            <div className="text-3xl font-medium text-[#f4c025] mb-6">
              ${bundle.price.toFixed(2)}
            </div>
            {bundle.description && (
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                {bundle.description}
              </p>
            )}
          </div>

          <div className="bg-[#1e1b16] rounded-3xl p-8 border border-white/5 mb-10">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <ShoppingBag className="w-5 h-5 text-[#f4c025]" />
                 This set includes:
             </h3>
             <ul className="space-y-4">
                 {bundle.items?.map((item: BundleItem, index: number) => (
                     <li key={item.id || index} className="flex items-start gap-4">
                         <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center shrink-0 border border-white/5 overflow-hidden relative">
                             {item.product?.image_url ? (
                                  <Image
                                     src={item.product?.image_url}
                                     alt={item.product?.name || "Product image"}
                                     fill
                                     className="object-cover"
                                 />
                             ) : (
                                  <span className="text-2xl">🧴</span>
                             )}
                         </div>
                         <div>
                             <h4 className="text-white font-medium">{item.product?.name}</h4>
                             <div className="text-sm text-white/50 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                 <span>Quantity: {item.quantity}</span>
                                 {item.variant && (
                                     <>
                                         <span>•</span>
                                         <span>Size: {item.variant.size_ml}ml</span>
                                         {item.variant.concentration && (
                                            <>
                                                <span>•</span>
                                                <span>{item.variant.concentration}</span>
                                            </>
                                         )}
                                     </>
                                 )}
                             </div>
                         </div>
                     </li>
                 ))}
             </ul>
          </div>

          {/* Add to Cart Actions */}
          <div className="mt-auto space-y-4">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !bundle.is_active}
              className={`w-full h-16 rounded-full flex items-center justify-center gap-3 font-bold tracking-widest uppercase text-sm transition-all relative overflow-hidden group ${
                !bundle.is_active ? 'bg-white/5 text-white/40 cursor-not-allowed' :
                added ? 'bg-green-500 text-white' :
                'bg-[#f4c025] text-black hover:bg-white hover:scale-[1.02] shadow-[0_0_auto_rgba(244,192,37,0.3)] hover:shadow-[0_0_auto_rgba(255,255,255,0.4)]'
              }`}
            >
              {addingToCart ? (
                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : added ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Cart
                </>
              ) : !bundle.is_active ? (
                'Currently Unavailable'
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Add Set to Cart
                </>
              )}
            </button>
            <p className="text-center text-sm text-white/40 font-medium">Free shipping on all gift sets</p>
          </div>
        </div>
      </main>
    </div>
  );
}
