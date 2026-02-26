"use client";
import { useEffect } from "react";
import { useProducts, useAuth, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import RevealOnScroll from "./RevealOnScroll";

export default function FeaturedProducts() {
  const { products, loading, error, refetch } = useProducts(supabase);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const t = useTranslations('common');

  // Auto-retry on error after a short delay
  useEffect(() => {
    if (error && !loading) {
      const timer = setTimeout(() => refetch(), 2000);
      return () => clearTimeout(timer);
    }
  }, [error, loading, refetch]);

  // Prefer new arrivals, fall back to latest products
  const newArrivals = products.filter(p => p.is_new);
  const featured = newArrivals.length > 0 ? newArrivals.slice(0, 8) : products.slice(0, 8);

  if (loading) return (
    <div className="px-4 py-12">
      <div className="flex gap-5 overflow-hidden justify-center">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[220px] md:w-[260px] flex-none">
            <div className="aspect-[3/4] shimmer-warm rounded-2xl" />
            <div className="mt-4 h-4 shimmer-warm rounded-full w-28 mx-auto" />
            <div className="mt-2 h-3 shimmer-warm rounded-full w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {/* Section Header — Centered */}
      <RevealOnScroll delay={0.1}>
        <div className="flex flex-col items-center text-center px-4 mb-6 mt-8 md:mt-16">
          {newArrivals.length > 0 && (
            <span className="text-[10px] font-semibold tracking-[0.25em] text-primary uppercase mb-3">
              {t('new_arrivals') || 'NEW ARRIVALS'}
            </span>
          )}
          <h2 className="text-3xl md:text-5xl font-sans text-white italic tracking-wide">
            {t('signature_scents') || 'Signature Scents'}
          </h2>
          <div className="section-divider mt-6 mb-2" />
        </div>
      </RevealOnScroll>

      {/* View All link */}
      <RevealOnScroll delay={0.2}>
        <div className="flex justify-center mb-4">
          <Link href="/shop" className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-fg-faint hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary/30 pb-1">
            {t('view_all_collection') || 'VIEW ALL COLLECTION'}
          </Link>
        </div>
      </RevealOnScroll>

      {/* Desktop: Grid layout / Mobile: Horizontal scroll */}
      <div className="hidden md:block px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-7">
          {featured.slice(0, 4).map((product, i) => (
            <RevealOnScroll key={product.id} delay={0.1 + i * 0.1}>
              <ProductCard
                product={product}
                isFavorite={isFavorite(product.id)}
                onToggleFavorite={() => toggleFavorite(product.id)}
              />
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <RevealOnScroll delay={0.2} className="md:hidden">
        <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              compact
            />
          ))}
        </div>
      </RevealOnScroll>
    </div>
  );
}
