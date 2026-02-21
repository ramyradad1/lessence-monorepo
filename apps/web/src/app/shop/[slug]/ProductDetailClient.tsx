"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import { webRecentlyViewedStorage } from "@/lib/recentlyViewedStorage";
import { useAuth, useFavorites, useRecentlyViewed, useBackInStock } from "@lessence/supabase";
import { useCart } from "@/context/CartContext";
import { Product } from "@lessence/core";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/ProductReviews";
import RecentlyViewed from "@/components/RecentlyViewed";
import RelatedProducts from "@/components/RelatedProducts";
import { Star, Heart, ShoppingCart, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface ProductDetailClientProps {
  initialProduct: Product;
}

export default function ProductDetailClient({ initialProduct: product }: ProductDetailClientProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const { addRecentlyViewed } = useRecentlyViewed(supabase, user?.id, webRecentlyViewedStorage);
  const { isSubscribed, subscribe, loading: bisLoading } = useBackInStock(supabase, user?.id);
  const [notifySuccess, setNotifySuccess] = useState(false);

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

  const isOutOfStock = variants ? variants[selectedVariantIdx]?.stock_qty <= 0 : false;

  return (
    <main className="bg-background-dark min-h-screen">
      <Navbar />

      <div className="pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/shop" className="hover:text-white transition-colors">Fragrances</Link>
            <ChevronRight size={12} />
            <span className="text-white/60">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-dark group">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {product.is_new && (
                <div className="absolute top-6 left-6 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded uppercase">
                  New
                </div>
              )}
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-6 right-6 p-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                aria-label="Toggle favorite"
              >
                <Heart
                  size={20}
                  className={isFavorite(product.id) ? "text-red-500 fill-red-500" : "text-white"}
                />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-8 pt-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-display text-white leading-tight">{product.name}</h1>
                <p className="text-white/40 text-lg mt-1 uppercase tracking-wider">{product.subtitle}</p>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-3xl text-white font-bold">${currentPrice}</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < product.rating ? "text-primary fill-primary" : "text-white/20"} />
                  ))}
                  <span className="text-white/30 text-xs ml-2">({product.review_count} reviews)</span>
                </div>
              </div>

              {/* Variant / Size Selector */}
              <div>
                <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-3">Select Variant</span>
                <div className="flex gap-3 flex-wrap">
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
                      {v.size_ml}ml {v.concentration} — ${v.price}
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
                      {s.size} — ${s.price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scent Profiles */}
              {profiles.length > 0 && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-4">Scent Profile</span>
                  <div className="flex gap-4">
                    {profiles.map((p: { name: string; icon?: string }, i: number) => (
                      <div key={i} className="flex-1 text-center py-4 bg-surface-dark rounded-xl border border-white/5">
                        <span className="text-2xl mb-2 block">🌿</span>
                        <span className="text-sm text-white/80">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-white/50 leading-relaxed">{product.description}</p>

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
                {isAdding ? "Added to Bag ✓" : (
                  <>
                    <ShoppingCart size={16} />
                    {isOutOfStock ? "Out of Stock" : `Add to Bag — $${currentPrice}`}
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
                    ? "You'll Be Notified ✓"
                    : 'Notify Me When Available'}
                </button>
              )}
            </div>
          </div>

          {/* Fragrance Notes */}
          {(notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0) && (
            <div className="mt-20">
              <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2 block">The Journey</span>
              <h2 className="text-3xl font-display text-white mb-8">Fragrance Notes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Top Notes", desc: "The initial impression", items: notes.top },
                  { label: "Heart Notes", desc: "The core of the fragrance", items: notes.heart },
                  { label: "Base Notes", desc: "The lasting memory", items: notes.base },
                ].map((note, i) => (
                  <div key={i} className="glass-effect p-6 rounded-2xl border border-white/5">
                    <h3 className="text-white font-display text-lg mb-1">{note.label}</h3>
                    <p className="text-white/30 text-xs italic mb-4">{note.desc}</p>
                    <div className="flex flex-wrap gap-2">
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
