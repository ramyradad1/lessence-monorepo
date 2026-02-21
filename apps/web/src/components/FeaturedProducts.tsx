"use client";
import { useProducts, useAuth, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import Link from "next/link";

export default function FeaturedProducts() {
  const { products, loading } = useProducts(supabase);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);

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
            <span className="text-primary text-xs font-bold tracking-widest uppercase">Curated For You</span>
            <h2 className="text-4xl font-display text-white mt-2">Signature Scents</h2>
          </div>
          <Link href="/shop" className="text-white/60 hover:text-primary transition-colors uppercase text-xs tracking-widest font-bold">
            View All Collection
          </Link>
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
