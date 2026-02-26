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
import { useStoreSettings } from "@/context/StoreSettingsContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80";

interface ProductDetailClientProps {
  initialProduct: Product;
  normalizations: { original_value: string; normalized_en?: string; normalized_ar?: string }[];
}

export default function ProductDetailClient({ initialProduct: product, normalizations }: ProductDetailClientProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
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
  const { settings } = useStoreSettings();

  useEffect(() => {
    if (product && settings.features.recently_viewed) {
      addRecentlyViewed(product.id);
    }
  }, [product, addRecentlyViewed, settings.features.recently_viewed]);

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

  const getNormalizedSize = (originalValue: string | number) => {
    if (!originalValue) return originalValue;
    const term = String(originalValue).trim().toLowerCase();
    const mapping = normalizations.find(n => n.original_value.toLowerCase() === term);
    if (!mapping) return originalValue;
    return locale === 'ar' ? (mapping.normalized_ar || mapping.normalized_en || originalValue) : (mapping.normalized_en || originalValue);
  };

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

      <div className="pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-fg-muted rtl:flex-row-reverse">
            <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
            <ChevronRight size={10} className="rtl:rotate-180" />
            <Link href="/shop" className="hover:text-white transition-colors">{t('fragrances')}</Link>
            <ChevronRight size={10} className="rtl:rotate-180" />
            <span className="text-fg">{name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="w-full md:w-1/2 px-4 md:px-0">
              <div className="relative aspect-[4/5] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm bg-surface-dark group">
                <Image
                  src={imageErrors[selectedImage] ? FALLBACK_IMAGE : allImages[selectedImage]}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 480px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={() => {
                    setImageErrors(prev => ({ ...prev, [selectedImage]: true }));
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                {product.is_new && (
                  <div className={`absolute bottom-4 ${rtl ? 'right-4' : 'left-4'} bg-black/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest z-20`}>
                    {tc('new_arrival') || tc('new')}
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
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mt-3">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`relative aspect-square w-16 flex-none rounded-lg overflow-hidden transition-all ${selectedImage === i ? "ring-2 ring-primary border-transparent" : "opacity-60 hover:opacity-100"}`}
                    >
                      <Image
                        src={imageErrors[i] ? FALLBACK_IMAGE : img}
                        alt={`${name} ${i + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onError={() => setImageErrors(prev => ({ ...prev, [i]: true }))}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className={`w-full md:w-1/2 space-y-8 pt-4 md:pt-10 px-6 md:px-0 ${rtl ? 'text-right' : 'text-left'}`}>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <h1 className="text-4xl font-normal text-white italic leading-tight">
                    {name.split(' ')[0]} <span className="not-italic font-medium block text-primary">{name.substring(name.indexOf(' ') + 1)}</span>
                  </h1>
                  <div className="flex flex-col flex-none items-end pt-2">
                    <span className="text-2xl font-medium text-white">{formatCurrency(currentPrice, locale)}</span>
                    <div className="flex flex-row items-center gap-0.5 text-primary text-sm rtl:flex-row-reverse">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < product.rating ? "text-primary fill-primary" : "text-fg-faint"} />
                      ))}
                      <span className={`text-fg-muted text-xs ${rtl ? 'mr-1' : 'ml-1'}`}>
                        ({product.review_count})
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-fg-muted text-lg font-light italic">{subtitle}</p>
                {variants && variants[selectedVariantIdx]?.sku && (
                  <p className="text-fg-faint text-xs font-mono mt-1">SKU: {variants[selectedVariantIdx].sku}</p>
                )}
              </div>

              {/* Variant / Size Selector */}
              <div className="py-2">
                <div className="flex justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-fg-muted">{t('select_variant') || 'Select Size'}</label>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${stockStatus === 'in_stock' ? 'text-green-400 bg-green-400/10'
                    : stockStatus === 'low_stock' ? 'text-amber-400 bg-amber-400/10'
                      : 'text-red-400 bg-red-400/10'
                    }`}>
                    {tc(stockStatus === 'in_stock' ? 'in_stock' : stockStatus === 'low_stock' ? 'low_stock' : 'out_of_stock_label')}
                  </span>
                </div>

                <div className="flex p-1 bg-surface-dark rounded-lg border border-white/10">
                  {variants ? variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariantIdx(i)}
                      className={`flex-1 py-3 px-4 rounded-md shadow-sm transition-all text-sm font-medium ${
                        selectedVariantIdx === i
                        ? "bg-primary text-black"
                        : "text-fg-muted hover:text-white"
                        } ${v.stock_qty <= 0 ? 'opacity-50 line-through' : ''}`}
                    >
                      {getNormalizedSize(v.size_ml)}ml
                    </button>
                  )) : sizes.map((s: { size: string; price: number }, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariantIdx(i)}
                      className={`flex-1 py-3 px-4 rounded-md shadow-sm transition-all text-sm font-medium ${selectedVariantIdx === i
                        ? "bg-primary text-black"
                        : "text-fg-muted hover:text-white"
                      }`}
                    >
                      {getNormalizedSize(s.size)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10 w-full" />

              {/* Scent Profiles */}
              {profiles.length > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-fg-muted mb-4 block">{t('scent_profile') || 'Scent Profile'}</label>
                  <div className="grid grid-cols-3 gap-4">
                    {profiles.map((p: { icon?: string; name_ar?: string; name_en?: string; name: string }, i: number) => (
                      <div key={i} className="flex flex-col items-center justify-center p-4 bg-surface-dark rounded-xl border border-white/5 shadow-sm">
                        <span className="text-3xl text-primary mb-2 block">{p.icon || '🌿'}</span>
                        <span className="text-sm font-medium text-fg">
                          {locale === 'ar' ? (p.name_ar || p.name) : (p.name_en || p.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fragrance Notes Visual Breakdown */}
              {(notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0) && (
                <div className="pb-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-fg-muted mb-4 block">{t('scent_notes') || 'Fragrance Notes'}</label>
                  <div className={`relative ${rtl ? 'pr-6 border-r mr-3' : 'pl-6 border-l ml-3'} border-white/10 space-y-8`}>
                    {[
                      { label: t('top_notes') || 'Top Notes', desc: locale === 'ar' ? "الانطباع الأول" : "The initial impression", items: notes.top, accent: true },
                      { label: t('heart_notes') || 'Heart Notes', desc: locale === 'ar' ? "قلب العطر" : "The core of the fragrance", items: notes.heart, accent: false },
                      { label: t('base_notes') || 'Base Notes', desc: locale === 'ar' ? "الذكرى الدائمة" : "The lasting memory", items: notes.base, accent: false },
                    ].map((note, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute ${rtl ? '-right-[31px]' : '-left-[31px]'} top-0 w-4 h-4 rounded-full bg-background-dark border-2 ${note.accent ? 'border-primary' : 'border-white/20'}`} />
                        <h3 className="text-base font-semibold text-white leading-none mb-1">{note.label}</h3>
                        <p className="text-fg-muted text-sm italic">{note.desc}</p>
                        <div className={`mt-3 flex flex-wrap gap-2 ${rtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          {note.items.map((item: string, j: number) => (
                            <span key={j} className="inline-flex items-center px-3 py-1 rounded-full bg-surface-dark text-xs text-fg">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Text */}
              <div className="pb-10 md:pb-20">
                <p className="text-fg-muted leading-relaxed font-sans text-sm">{description}</p>
              </div>

              {/* CTA */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding || stockStatus === 'out_of_stock'}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                  isAdding
                    ? "bg-green-500 text-white"
                  : stockStatus === 'out_of_stock'
                    ? "hidden"
                    : "bg-primary text-black hover:bg-white"
                }`}
              >
                {isAdding ? t('added_to_bag') : (
                  <>
                    <ShoppingCart size={16} />
                    {t('add_to_bag_with_price', { price: formatCurrency(currentPrice, locale) })}
                  </>
                )}
              </button>

              {/* Notify Me – Back in Stock */}
              {settings.features.back_in_stock_alerts && stockStatus === 'out_of_stock' && (
                <button
                  onClick={async () => {
                    if (variants) {
                      const variantId = variants[selectedVariantIdx]?.id;
                      if (!variantId) return;
                      const ok = await subscribe(product.id, variantId);
                      if (ok) setNotifySuccess(true);
                    }
                  }}
                  disabled={bisLoading || (variants && isSubscribed(product.id, variants[selectedVariantIdx]?.id)) || notifySuccess}
                  className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all border ${(variants && isSubscribed(product.id, variants[selectedVariantIdx]?.id)) || notifySuccess
                    ? "bg-green-500/10 text-green-400 border-green-500/30 cursor-default"
                    : "bg-surface-dark text-white border-white/20 hover:border-primary hover:text-primary"
                    }`}
                >
                  <Bell size={16} />
                  {(variants && isSubscribed(product.id, variants[selectedVariantIdx]?.id)) || notifySuccess
                    ? t('notified_success')
                    : t('notify_me')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {settings.features.reviews && <ProductReviews productId={product.id} />}
      </div>

      {settings.features.related_products && <RelatedProducts currentProduct={product} />}
      {settings.features.recently_viewed && <RecentlyViewed currentProductId={product.id} />}

      <Footer />

      {/* Sticky bottom CTA bar (Mobile) – Stitch style */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#12100c]/90 backdrop-blur-md border-t border-white/10 z-40 md:hidden">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || stockStatus === 'out_of_stock'}
          className={`w-full py-4 px-6 rounded-xl shadow-lg flex items-center justify-between group transition-all transform active:scale-[0.98] font-bold ${isAdding
            ? "bg-green-500 text-white shadow-green-500/30"
            : stockStatus === 'out_of_stock'
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-primary text-black shadow-primary/30 hover:bg-primary/90"
            }`}
        >
          <span className="text-lg">
            {isAdding ? t('added_to_bag') : stockStatus === 'out_of_stock' ? tc('out_of_stock_label') : t('add_to_bag')}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatCurrency(currentPrice, locale)}</span>
            {stockStatus !== 'out_of_stock' && <ChevronRight size={20} />}
          </div>
        </button>
      </div>
    </main>
  );
}
