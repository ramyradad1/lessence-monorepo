"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProductBySlug } from "@/services/products.service";
import { Product, formatCurrency, isRTL } from "@lessence/core";
import LuxuryButton from "@/components/v2/LuxuryButton";
import { useCart } from "@/context/CartContext";
import { useLocale } from "next-intl";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80";

export default function V2ProductDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await getProductBySlug(supabase, slug);
        setProduct(data as unknown as Product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchDetails();
  }, [slug]);

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><div className="w-8 h-8 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div></div>;
  if (!product) return <div className="min-h-[70vh] flex items-center justify-center text-white font-serif uppercase tracking-widest">Product Not Found</div>;

  const defaultSize = product.size_options?.[0]?.size || "50ml";
  const name = locale === 'ar' ? (product.name_ar || product.name_en || product.name || "") : (product.name_en || product.name || "");
  const desc = locale === 'ar' ? (product.description_ar || product.description_en || product.description || "") : (product.description_en || product.description || "");

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 w-full flex flex-col md:flex-row gap-16 min-h-[85vh] items-center">
      {/* Product Image Column */}
      <div className="w-full md:w-1/2 flex justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 rounded-full blur-[80px]" />
        <div className="relative w-full max-w-md aspect-[4/5] bg-gradient-to-br from-[#1c1a14] to-[#0a0907] border border-white/5 rounded-md p-10 shadow-2xl">
          <Image
            src={product.image_url || FALLBACK_IMAGE}
            alt={name}
            fill
            className="object-contain p-12 drop-shadow-[0_40px_40px_rgba(0,0,0,0.9)] animate-float"
          />
        </div>
      </div>

      {/* Product Info Column */}
      <div className="w-full md:w-1/2 flex flex-col items-start pt-10 md:pt-0 pb-16">
        <span className="text-primary tracking-[0.3em] text-[10px] uppercase font-bold mb-4 block">Limited Collection</span>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white uppercase tracking-widest leading-tight mb-2">
          {name}
        </h1>
        <p className="text-primary text-2xl font-serif italic mb-10">{formatCurrency(product.price, locale)}</p>
        
        <div className="w-16 h-[1px] bg-primary/50 mb-10" />
        
        <p className="text-fg-faint leading-loose text-sm tracking-wide mb-12 max-w-xl">
          {desc}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <LuxuryButton 
            size="lg" 
            fullWidth 
            onClick={() => addToCart(product, defaultSize)}
          >
            Add to Bag
          </LuxuryButton>
        </div>

        {/* Accents/Notes */}
        {product.scent_profiles && product.scent_profiles.length > 0 && (
          <div className="mt-16 pt-10 border-t border-white/10 w-full max-w-md">
            <h4 className="text-xs uppercase tracking-[0.3em] text-white/50 mb-6">Olfactory Notes</h4>
            <div className="flex flex-wrap gap-3">
              {product.scent_profiles.map((note, idx) => (
                <div key={idx} className="px-4 py-2 border border-primary/20 bg-primary/5 text-primary text-[10px] uppercase tracking-widest rounded-sm">
                  {locale === 'ar' ? (note.name_ar || note.name) : (note.name_en || note.name)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
