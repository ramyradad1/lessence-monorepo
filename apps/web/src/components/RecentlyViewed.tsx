"use client";
import { useEffect, useState } from "react";
import { useAuth, useRecentlyViewed, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webRecentlyViewedStorage } from "@/lib/recentlyViewedStorage";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import { Product } from "@lessence/core";
import { useTranslations } from "next-intl";
import { useStoreSettings } from "@/context/StoreSettingsContext";

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const { user } = useAuth();
  const { recentlyViewedIds, loading: hookLoading } = useRecentlyViewed(supabase, user?.id, webRecentlyViewedStorage);
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('common');
  const { settings } = useStoreSettings();

  useEffect(() => {
    async function fetchProducts() {
      // Filter out the current product being viewed
      const idsToFetch = recentlyViewedIds.filter(id => id !== currentProductId);
      
      if (idsToFetch.length === 0) {
        setProducts([]);
        return;
      }
      
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', idsToFetch);
        
      if (!error && data) {
        // Sort data to match the order of recentlyViewedIds
        const sortedData = [...data].sort((a, b) => {
          return idsToFetch.indexOf(a.id) - idsToFetch.indexOf(b.id);
        });
        setProducts(sortedData);
      }
      setLoading(false);
    }
    
    fetchProducts();
  }, [recentlyViewedIds, currentProductId]);

  if (!settings.features.recently_viewed) {
    return null;
  }

  if (hookLoading || loading) {
    return null;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 w-full max-w-7xl mx-auto mb-16 md:mb-24">
      {/* Gold divider */}
      <div className="section-divider mb-8 md:mb-12" />

      {/* Section Header — Centered */}
      <div className="flex flex-col items-center text-center px-4 mb-8">
        <span className="text-[10px] font-semibold tracking-[0.25em] text-primary uppercase mb-3">
          {t('your_history') || 'YOUR HISTORY'}
        </span>
        <h2 className="text-3xl md:text-5xl font-sans text-white italic tracking-wide">
          {t('recently_viewed') || 'Recently Viewed'}
        </h2>
        <div className="section-divider mt-6" />
      </div>

      {/* Desktop: Grid layout / Mobile: Horizontal scroll */}
      <div className="hidden md:block px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-7">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
            />
          ))}
        </div>
      </div>

      <div className="md:hidden flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={isFavorite(product.id)}
            onToggleFavorite={() => toggleFavorite(product.id)}
            compact
          />
        ))}
      </div>
    </section>
  );
}
