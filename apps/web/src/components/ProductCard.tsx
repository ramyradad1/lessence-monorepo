"use client";
import { memo, useState } from "react";
import { Product, formatCurrency, isRTL } from "@lessence/core";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "@/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80";

function ProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
  compact = false,
}: {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
    compact?: boolean;
}) {
  const { addToCart } = useCart();
  const locale = useLocale();
  const t = useTranslations('common');
  const [imgSrc, setImgSrc] = useState(product.image_url || FALLBACK_IMAGE);

  const defaultSize = product.size_options?.[0]?.size || "50ml";
  const rtl = isRTL(locale);

  // Localized fields with robust fallbacks
  const name = locale === 'ar' ? (product.name_ar || product.name_en || product.name || "") : (product.name_en || product.name || "");
  const subtitle = locale === 'ar' ? (product.subtitle_ar || product.subtitle_en || product.subtitle || "") : (product.subtitle_en || product.subtitle || "");

  // Determine stock status
  const getStockStatus = () => {
    if (product.variants && product.variants.length > 0) {
      const allOutOfStock = product.variants.every(v => v.stock_qty <= 0);
      if (allOutOfStock) return 'out_of_stock';
      return 'in_stock';
    }
    const productExt = product as Product & { stock_qty?: number };
    if (productExt.stock_qty !== undefined) {
      if (productExt.stock_qty <= 0) return 'out_of_stock';
      return 'in_stock';
    }
    return 'in_stock';
  };
  const stockStatus = getStockStatus();

  // Compact card for horizontal scroll
  if (compact) {
    return (
      <div className="group relative flex w-[180px] flex-none snap-center flex-col gap-3">
        <Link href={`/shop/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface">
            <Image
              src={imgSrc}
              alt={name}
              fill
              sizes="180px"
              className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
              onError={() => { if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE); }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
                aria-label={t('toggle_favorite')}
                className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-all duration-300 hover:bg-black/40 z-10"
              >
                <Heart size={14} strokeWidth={1.5} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
            )}
            {product.is_new && (
              <span className="absolute bottom-2.5 left-2.5 inline-block px-2.5 py-0.5 bg-primary/90 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full text-background-dark z-10">
                {t('new')}
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-col gap-1 px-0.5">
          <h4 className="text-sm font-semibold text-fg truncate">{name}</h4>
          <p className="text-[11px] text-fg-faint">{subtitle}</p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm font-bold text-fg">{formatCurrency(product.price, locale)}</span>
            {stockStatus !== 'out_of_stock' ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, defaultSize); }}
                aria-label={t('add_to_cart')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-background-dark hover:shadow-gold transition-all duration-300 hover:scale-110"
              >
                <ShoppingCart size={14} strokeWidth={1.5} />
              </button>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-fg-faint cursor-not-allowed">
                <ShoppingCart size={14} strokeWidth={1.5} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full product card (desktop grid)
  return (
    <div className="group relative bg-surface rounded-2xl overflow-hidden border border-white/[0.04] hover:border-primary/30 transition-all duration-500 text-left rtl:text-right shadow-warm-sm hover:shadow-warm-lg hover:-translate-y-2 glow-border">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="aspect-[3/4] relative overflow-hidden bg-surface-muted">
          <Image
            src={imgSrc}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
            priority={product.is_new}
            onError={() => {
              if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
            }}
          />
          {product.is_new && (
            <div className={`absolute top-4 ${rtl ? 'right-4' : 'left-4'} bg-primary text-background-dark text-[9px] font-bold px-3 py-1 rounded-full uppercase z-10 tracking-[0.15em]`}>
              {t('new')}
            </div>
          )}
          {product.is_sale && (
            <div className={`absolute top-4 ${product.is_new ? (rtl ? 'right-16' : 'left-16') : (rtl ? 'right-4' : 'left-4')} bg-rose-500/90 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase z-10 tracking-[0.15em]`}>
              Sale
            </div>
          )}
          {product.is_featured && (
            <div className={`absolute bottom-4 ${rtl ? 'right-4' : 'left-4'} bg-primary/80 backdrop-blur-sm text-background-dark text-[9px] font-bold px-3 py-1 rounded-full uppercase z-10 pointer-events-none tracking-[0.15em]`}>
              Featured
            </div>
          )}
          {/* Hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>

      {/* Action buttons overlay */}
      <div className={`absolute top-4 ${rtl ? 'left-4' : 'right-4'} flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-y-2 group-hover:translate-y-0`}>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
            className="bg-black/20 backdrop-blur-md p-2.5 rounded-full hover:bg-black/40 transition-all duration-300"
            aria-label={t('toggle_favorite')}
          >
            <Heart size={16} strokeWidth={1.5} className={isFavorite ? "text-red-500 fill-red-500" : "text-white"} />
          </button>
        )}
        {stockStatus !== 'out_of_stock' ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, defaultSize); }}
            className="bg-primary p-2.5 rounded-full text-background-dark hover:scale-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
            aria-label={t('add_to_cart')}
          >
            <ShoppingCart size={16} strokeWidth={1.5} />
          </button>
        ) : (
          <div
            className="bg-white/10 p-2.5 rounded-full text-fg-faint cursor-not-allowed"
            aria-label={t('out_of_stock')}
            title={t('out_of_stock')}
          >
            <ShoppingCart size={16} strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2.5 gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-fg truncate">{name}</h3>
            <p className="text-[11px] text-fg-faint uppercase tracking-[0.1em] truncate mt-0.5">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-primary font-bold whitespace-nowrap">{formatCurrency(product.price, locale)}</p>
            {product.variants && product.variants[0]?.compare_at_price && product.variants[0].compare_at_price > product.price && (
              <p className="text-[10px] text-fg-faint line-through decoration-red-500/50 whitespace-nowrap">
                {formatCurrency(product.variants[0].compare_at_price, locale)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-0.5 mb-3 rtl:space-x-reverse">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} strokeWidth={1.5} className={i < product.rating ? "text-primary fill-primary" : "text-fg-faint/30"} />
          ))}
          <span className={`text-[10px] text-fg-faint ${rtl ? 'mr-2' : 'ml-2'}`}>({product.review_count})</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {product.scent_profiles?.slice(0, 2).map((note, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.03] text-fg-faint px-2.5 py-1 rounded-full border border-white/[0.04]">
              {locale === 'ar' ? (note.name_ar || note.name) : (note.name_en || note.name)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);
