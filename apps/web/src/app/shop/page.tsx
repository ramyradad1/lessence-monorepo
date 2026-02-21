"use client";
import { useState, useEffect } from "react";
import { useProducts, useCategories, useSearch, useFavorites, useAuth } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import { webProductsStorage } from "@/lib/productsStorage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Search, X, SlidersHorizontal } from "lucide-react";

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { products, loading: productsLoading, error: productsError } = useProducts(
    supabase,
    activeCategory === "all" ? undefined : activeCategory,
    webProductsStorage
  );
  const { categories, loading: catsLoading } = useCategories(supabase);
  const { results: searchResults, loading: searchLoading, search, clear } = useSearch(supabase);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => search(searchQuery), 300);
      return () => clearTimeout(timer);
    } else {
      clear();
    }
  }, [searchQuery]);

  const displayProducts = searchQuery.length >= 2 ? searchResults : products;
  const isLoading = searchQuery.length >= 2 ? searchLoading : productsLoading;

  const allCategories = [
    { id: "all", name: "All Scents", slug: "all", icon: "", sort_order: 0 },
    ...categories,
  ];

  return (
    <main className="bg-background-dark min-h-screen">
      <Navbar />

      <div className="pt-28 pb-20">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-primary text-xs font-bold tracking-widest uppercase">The Collection</span>
              <h1 className="text-4xl md:text-5xl font-display text-white mt-2">Our Fragrances</h1>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="SEARCH BY NAME, BRAND, SCENT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-dark border border-white/10 rounded-full pl-12 pr-10 py-3 text-xs tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); clear(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {allCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setActiveCategory(cat.slug); setSearchQuery(""); clear(); }}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all border ${
                  activeCategory === cat.slug
                    ? "bg-primary text-black border-primary"
                    : "bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-surface-dark/50 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : productsError ? (
            <div className="text-center py-20">
              <p className="text-red-400/80 text-sm mb-2">Something went wrong</p>
              <p className="text-white/30 text-xs">{productsError}</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-white/10" />
              </div>
              <h3 className="text-xl font-display text-white/60 mb-2">
                {searchQuery ? "No Results Found" : "No Products Yet"}
              </h3>
              <p className="text-white/30 text-sm">
                {searchQuery
                  ? `We couldn't find anything matching "${searchQuery}".`
                  : "Check back soon for new arrivals."}
              </p>
            </div>
          ) : (
            <>
              {searchQuery.length >= 2 && (
                <p className="text-white/30 text-xs tracking-widest uppercase mb-6">
                  {displayProducts.length} result{displayProducts.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
