"use client";
import { useEffect, useState } from "react";
import { useAuth, useRecentlyViewed, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webRecentlyViewedStorage } from "@/lib/recentlyViewedStorage";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import { Product } from "@lessence/core";
import { useTranslations } from "next-intl";

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const { user } = useAuth();
  const { recentlyViewedIds, loading: hookLoading } = useRecentlyViewed(supabase, user?.id, webRecentlyViewedStorage);
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('common');

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

  if (hookLoading || loading) {
    return null; // Or skeleton
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-background-dark py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary text-xs font-bold tracking-widest uppercase">{t('your_history')}</span>
            <h2 className="text-4xl font-display text-white mt-2">{t('recently_viewed')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
    </section>
  );
}
