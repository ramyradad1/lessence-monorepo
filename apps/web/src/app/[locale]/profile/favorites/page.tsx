"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useFavorites } from "@lessence/supabase";
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Heart, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import { Product } from "@lessence/core";
import { Link } from "@/navigation";

export default function FavoritesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("profile");
  const locale = useLocale();
  const rtl = locale === "ar";

  const { favoriteIds, loading: favLoading, toggleFavorite, isFavorite } =
    useFavorites(supabase, user?.id, webFavoritesStorage);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchFavoritedProducts = useCallback(async () => {
    const ids = Array.from(favoriteIds);
    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .in("id", ids)
        .eq("is_active", true);

      if (!error && data) {
        setProducts(data as Product[]);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, [favoriteIds]);

  useEffect(() => {
    if (!favLoading) {
      fetchFavoritedProducts();
    }
  }, [favLoading, fetchFavoritedProducts]);

  // Redirect guests to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const isPageLoading = isLoading || favLoading || loadingProducts;

  return (
    <>
      <Navbar />
      <div className={`min-h-screen bg-background-dark pt-32 pb-20 px-4 ${rtl ? "rtl" : "ltr"}`}>
        <div className="max-w-5xl mx-auto">
          {/* Back link */}
          <Link
            href="/profile"
            className={`inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest mb-8 ${rtl ? "flex-row-reverse" : ""}`}
          >
            <ArrowLeft size={14} className={rtl ? "rotate-180" : ""} />
            {t("my_account")}
          </Link>

          {/* Header */}
          <div className={`flex items-center gap-3 mb-10 ${rtl ? "flex-row-reverse" : ""}`}>
            <Heart size={28} className="text-primary" />
            <h1 className="font-display text-4xl text-white">{t("my_favorites")}</h1>
          </div>

          {isPageLoading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Heart size={32} className="text-white/20" />
              </div>
              <p className="text-white/40 text-sm">{t("favorites_empty")}</p>
              <Link
                href="/shop"
                className="bg-primary text-black px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
              >
                {t("view_favorites")}
              </Link>
            </div>
          ) : (
            /* Product grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={isFavorite(product.id)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
