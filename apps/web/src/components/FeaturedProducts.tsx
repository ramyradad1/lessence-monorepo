"use client";
import { useProducts, useAuth, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function FeaturedProducts() {
  const { products, loading } = useProducts(supabase);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const t = useTranslations('common');

  // Prefer new arrivals, fall back to latest products
  const newArrivals = products.filter(p => p.is_new);
  const featured = newArrivals.length > 0 ? newArrivals.slice(0, 4) : products.slice(0, 4);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-surface-dark/50 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );

  return (
    <section className="bg-background-dark py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary text-xs font-bold tracking-widest uppercase">
              {newArrivals.length > 0 ? t('new_arrivals') : t('curated_for_you')}
            </span>
            <h2 className="text-4xl font-display text-white mt-2">{t('signature_scents')}</h2>
          </div>
          <Link href="/shop" className="text-white/60 hover:text-primary transition-colors uppercase text-xs tracking-widest font-bold">
            {t('view_all_collection')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featured.map((product) => (
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
