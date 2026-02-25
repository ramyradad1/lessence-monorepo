"use client";
import { useAuth, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "@/components/ProductCard";
import { Product } from "@lessence/core";

interface CollectionProductGridProps {
  products: Product[];
}

export default function CollectionProductGrid({ products }: CollectionProductGridProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={isFavorite(product.id)}
          onToggleFavorite={() => toggleFavorite(product.id)}
        />
      ))}
    </div>
  );
}
