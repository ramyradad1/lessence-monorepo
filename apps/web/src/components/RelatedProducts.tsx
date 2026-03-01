"use client";
import { useAuth, useRelatedProducts, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import { Product } from "@lessence/core";
import { useTranslations } from "next-intl";
import { useStoreSettings } from "@/context/StoreSettingsContext";

interface RelatedProductsProps {
  currentProduct: Product;
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const tc = useTranslations('common');
  const { settings } = useStoreSettings();

  const { relatedProducts, loading } = useRelatedProducts(
    supabase,
    currentProduct.id,
    currentProduct.category_id,
    currentProduct.price,
    currentProduct.scent_profiles || [],
    4
  );

  if (!settings.features.related_products) {
    return null;
  }

  if (loading) {
    return (
      <section className="bg-background-dark py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary text-xs font-bold tracking-widest uppercase">{tc('curated_for_you')}</span>
              <h2 className="text-4xl font-sans text-white mt-2">{tc('you_may_also_like')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-surface-dark/50 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-background-dark py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary text-xs font-bold tracking-widest uppercase">{tc('curated_for_you')}</span>
            <h2 className="text-4xl font-sans text-white mt-2">{tc('you_may_also_like')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {relatedProducts.map((product) => (
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
