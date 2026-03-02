"use client";
import React, { memo, useState } from "react";
import { Product, formatCurrency } from "@lessence/core";
import { Link } from "@/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";
import LuxuryButton from "./LuxuryButton";
import { useCart } from "@/context/CartContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80";

function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { addToCart } = useCart();
  const locale = useLocale();
  const [imgSrc, setImgSrc] = useState(product.image_url || FALLBACK_IMAGE);

  const defaultSize = product.size_options?.[0]?.size || "50ml";

  const name = locale === 'ar' ? (product.name_ar || product.name_en || product.name || "") : (product.name_en || product.name || "");
  const subtitle = locale === 'ar' ? (product.subtitle_ar || product.subtitle_en || product.subtitle || "") : (product.subtitle_en || product.subtitle || "");

  return (
    <div className={`group relative flex flex-col items-center text-center ${compact ? 'w-[200px] flex-none snap-center' : 'w-full'}`}>
      
      {/* Card Image Container with Podium effect */}
      <Link href={`/v2/products/${product.slug}`} className="block w-full cursor-pointer relative">
        <div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-md transition-colors duration-500"
          style={{ background: 'var(--v2-product-bg)', border: '1px solid var(--v2-border)' }}
        >
          <Image
            src={imgSrc}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-6 transition-transform duration-[800ms] group-hover:scale-110"
            style={{ filter: `drop-shadow(0 20px 20px var(--v2-product-shadow))` }}
            priority={product.is_new}
            onError={() => { if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE); }}
          />
          
          {/* Subtle gold glow behind product */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[var(--v2-gold-glow)]" />
          
          {/* Corner accents */}
          {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map((cls, i) => (
            <div key={i} className={`absolute ${cls} w-4 h-4 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 m-2`} />
          ))}
        </div>
      </Link>

      {/* Info Section */}
      <div className="pt-6 pb-2 w-full flex flex-col items-center">
        <h3 className="font-serif text-lg md:text-xl mb-1 uppercase tracking-widest text-[var(--v2-text)]">{name}</h3>
        <p className="text-[10px] uppercase tracking-[0.2em] mb-4 text-[var(--v2-text-faint)]">{subtitle}</p>
        
        <div className="flex flex-col items-center gap-3 w-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 pt-2 border-t border-[var(--v2-border)]">
          <p className="font-serif italic text-lg text-[var(--v2-gold-text)]">{formatCurrency(product.price, locale)}</p>
          <LuxuryButton 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, defaultSize); }}
            className="w-full max-w-[160px]"
          >
            Add to Bag
          </LuxuryButton>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);
