"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import { webRecentlyViewedStorage } from "@/lib/recentlyViewedStorage";
import { useAuth, useFavorites, useRecentlyViewed, useBackInStock } from "@lessence/supabase";
import { useCart } from "@/context/CartContext";
import { Product, formatCurrency, isRTL } from "@lessence/core";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/ProductReviews";
import RecentlyViewed from "@/components/RecentlyViewed";
import RelatedProducts from "@/components/RelatedProducts";
import { Star, Heart, ShoppingCart, ChevronRight } from "lucide-react";
import { Link } from "@/navigation";
import { Bell } from "lucide-react";
import { PerformanceTracker } from "@/components/PerformanceTracker";
import { useLocale, useTranslations } from "next-intl";

interface ProductDetailClientProps {
  initialProduct: Product;
}

export default function ProductDetailClient({ initialProduct: product }: ProductDetailClientProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const { addRecentlyViewed } = useRecentlyViewed(supabase, user?.id, webRecentlyViewedStorage);
  const { isSubscribed, subscribe, loading: bisLoading } = useBackInStock(supabase, user?.id);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const locale = useLocale();
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const rtl = isRTL(locale);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
    }
  }, [product, addRecentlyViewed]);

  const variants = product.variants?.length && product.variants.length > 0
    ? product.variants
    : undefined;

  const sizes = !variants
    ? (product.size_options?.length > 0
      ? product.size_options
      : [{ size: "50ml", price: product.price }, { size: "100ml", price: Math.round(product.price * 1.44) }])
    : [];

  const currentPrice = variants
    ? (variants[selectedVariantIdx]?.price || product.price)
    : (sizes[selectedVariantIdx]?.price || product.price);

  const notes = product.fragrance_notes || { top: [], heart: [], base: [] };
  const profiles = product.scent_profiles || [];

  // Localized fields
  const name = locale === 'ar' ? (product.name_ar || product.name_en || product.name) : (product.name_en || product.name);
  const subtitle = locale === 'ar' ? (product.subtitle_ar || product.subtitle_en || product.subtitle) : (product.subtitle_en || product.subtitle);
  const description = locale === 'ar' ? (product.description_ar || product.description_en || product.description) : (product.description_en || product.description);

  const handleAddToCart = () => {
    setIsAdding(true);
    if (variants) {
      const selected = variants[selectedVariantIdx];
      addToCart(product, `${selected.size_ml}ml ${selected.concentration}`, selected.id);
    } else {
      addToCart(product, sizes[selectedVariantIdx].size);
    }
    setTimeout(() => setIsAdding(false), 1500);
  };

  const isOutOfStock = variants ? (variants[selectedVariantIdx]?.stock_qty <= 0) : false;

  // Build image gallery from product.images or fallback to single image_url
  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.image_url];

  // Stock status helper
  const getStockStatus = () => {
    if (variants && variants.length > 0) {
      const currentVariant = variants[selectedVariantIdx];
      if (!currentVariant || currentVariant.stock_qty <= 0) return 'out_of_stock';
      if (currentVariant.stock_qty <= (currentVariant.low_stock_threshold || 5)) return 'low_stock';
      return 'in_stock';
    }
    // Fallback: check if product has stock_qty from server join
    const productExt = product as Product & { stock_qty?: number };
    if (productExt.stock_qty !== undefined) {
      if (productExt.stock_qty <= 0) return 'out_of_stock';
      if (productExt.stock_qty <= (product.low_stock_threshold || 5)) return 'low_stock';
      return 'in_stock';
    }
    return 'in_stock';
  };
  const stockStatus = getStockStatus();

  return (
    <main className="bg-background-dark min-h-screen">
      <PerformanceTracker actionName="product_load" />
      <Navbar />

      <div className="pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-white/30 rtl:flex-row-reverse">
            <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <Link href="/shop" className="hover:text-white transition-colors">{t('fragrances')}</Link>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="text-white/60">{name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-dark group">
                <Image
                  src={allImages[selectedImage]}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {product.is_new && (
                  <div className={`absolute top-6 ${rtl ? 'right-6' : 'left-6'} bg-primary text-black text-[10px] font-bold px-3 py-1 rounded uppercase`}>
                    {tc('new')}
                  </div>
                )}
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className={`absolute top-6 ${rtl ? 'left-6' : 'right-6'} p-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors`}
                  aria-label={tc('toggle_favorite')}
                >
                  <Heart
                    size={20}
                    className={isFavorite(product.id) ? "text-red-500 fill-red-500" : "text-white"}
                  />
                </button>
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary' : 'border-white/10 hover:border-white/30'
                        }`}
                    >
                      <Image src={img} alt={`${name} ${i + 1}`} fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className={`space-y-8 pt-4 ${rtl ? 'text-right' : 'text-left'}`}>
              <div>
                <h1 className="text-4xl md:text-5xl font-display text-white leading-tight">{name}</h1>
                <p className="text-white/40 text-lg mt-1 uppercase tracking-wider">{subtitle}</p>
              </div>

              <div className="flex items-center gap-6 rtl:flex-row-reverse">
                <span className="text-3xl text-white font-bold">{formatCurrency(currentPrice, locale)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${stockStatus === 'in_stock' ? 'text-green-400 border-green-400/30 bg-green-400/10'
                  : stockStatus === 'low_stock' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                    : 'text-red-400 border-red-400/30 bg-red-400/10'
                  }`}>
                  {tc(stockStatus === 'in_stock' ? 'in_stock' : stockStatus === 'low_stock' ? 'low_stock' : 'out_of_stock_label')}
                </span>
              </div>
              <div className="flex items-center gap-1 rtl:flex-row-reverse">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < product.rating ? "text-primary fill-primary" : "text-white/20"} />
                ))}
                <span className={`text-white/30 text-xs ${rtl ? 'mr-2' : 'ml-2'}`}>
                  {t('reviews_count', { count: product.review_count })}
                </span>
              </div>

              {/* Variant / Size Selector */}
              <div>
                <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-3">{t('select_variant')}</span>
                <div className="flex gap-3 flex-wrap rtl:flex-row-reverse">
                  {variants ? variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariantIdx(i)}
                      className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                        selectedVariantIdx === i
                          ? "bg-primary text-black border-primary"
                          : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
                        } ${v.stock_qty <= 0 ? 'opacity-50 line-through' : ''}`}
                    >
                      {v.size_ml}ml {v.concentration} — {formatCurrency(v.price, locale)}
                    </button>
                  )) : sizes.map((s: { size: string; price: number }, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariantIdx(i)}
                      className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${selectedVariantIdx === i
                          ? "bg-primary text-black border-primary"
                          : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {s.size} — {formatCurrency(s.price, locale)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scent Profiles */}
              {profiles.length > 0 && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-4">{t('scent_profile')}</span>
                  <div className="flex gap-4 rtl:flex-row-reverse">
                    {profiles.map((p, i: number) => (
                      <div key={i} className="flex-1 text-center py-4 bg-surface-dark rounded-xl border border-white/5">
                        <span className="text-2xl mb-2 block">{p.icon || '🌿'}</span>
                        <span className="text-sm text-white/80">
                          {locale === 'ar' ? (p.name_ar || p.name) : (p.name_en || p.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-white/50 leading-relaxed">{description}</p>

              {/* CTA */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isOutOfStock}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                  isAdding
                    ? "bg-green-500 text-white"
                  : isOutOfStock
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-primary text-black hover:bg-white"
                }`}
              >
                {isAdding ? t('added_to_bag') : (
                  <>
                    <ShoppingCart size={16} />
                    {isOutOfStock ? t('out_of_stock') : t('add_to_bag_with_price', { price: formatCurrency(currentPrice, locale) })}
                  </>
                )}
              </button>

              {/* Notify Me – Back in Stock */}
              {isOutOfStock && variants && (
                <button
                  onClick={async () => {
                    const variantId = variants[selectedVariantIdx]?.id;
                    const ok = await subscribe(product.id, variantId);
                    if (ok) setNotifySuccess(true);
                  }}
                  disabled={bisLoading || isSubscribed(product.id, variants[selectedVariantIdx]?.id) || notifySuccess}
                  className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${isSubscribed(product.id, variants[selectedVariantIdx]?.id) || notifySuccess
                      ? 'border-green-500/30 text-green-400 cursor-default'
                      : 'border-white/20 text-white hover:border-primary hover:text-primary'
                    }`}
                >
                  <Bell size={14} />
                  {isSubscribed(product.id, variants[selectedVariantIdx]?.id) || notifySuccess
                    ? t('notified_success')
                    : t('notify_me')}
                </button>
              )}
            </div>
          </div>

          {/* Fragrance Notes */}
          {(notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0) && (
            <div className={`mt-20 ${rtl ? 'text-right' : 'text-left'}`}>
              <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2 block">{t('the_journey')}</span>
              <h2 className="text-3xl font-display text-white mb-8">{t('scent_notes')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: t('top_notes'), desc: locale === 'ar' ? "الانطباع الأول" : "The initial impression", items: notes.top },
                  { label: t('heart_notes'), desc: locale === 'ar' ? "قلب العطر" : "The core of the fragrance", items: notes.heart },
                  { label: t('base_notes'), desc: locale === 'ar' ? "الذكرى الدائمة" : "The lasting memory", items: notes.base },
                ].map((note, i) => (
                  <div key={i} className="glass-effect p-6 rounded-2xl border border-white/5">
                    <h3 className="text-white font-display text-lg mb-1">{note.label}</h3>
                    <p className="text-white/30 text-xs italic mb-4">{note.desc}</p>
                    <div className={`flex flex-wrap gap-2 ${rtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      {note.items.map((item: string, j: number) => (
                        <span key={j} className="text-[11px] bg-white/5 text-white/60 px-3 py-1.5 rounded-full border border-white/10">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <ProductReviews productId={product.id} />
        </div>
      </div>

      <RelatedProducts currentProduct={product} />
      <RecentlyViewed currentProductId={product.id} />

      <Footer />
    </main>
  );
}
