"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useProductSearch, useCategories, useFavorites, useAuth } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Extract the actual shop content to a child component to wrap in Suspense
function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("q") || "";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const genderTarget = searchParams.get("gender") || "";
  const inStockOnly = searchParams.get("inStock") === "true";
  const sortBy = searchParams.get("sort") || "newest";

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Local state for filters in the modal/sidebar before applying
  const [draftState, setDraftState] = useState({
    minPrice: minPrice || "",
    maxPrice: maxPrice || "",
    gender: genderTarget,
    inStock: inStockOnly,
    sort: sortBy,
  });

  const { products, loading: productsLoading, error: productsError } = useProductSearch(supabase, {
    searchQuery: searchQuery,
    categorySlugs: activeCategory !== "all" ? [activeCategory] : undefined,
    genderTargets: genderTarget ? [genderTarget] : undefined,
    minPrice: minPrice,
    maxPrice: maxPrice,
    inStockOnly: inStockOnly,
    sortBy: sortBy as any,
  });

  const { categories } = useCategories(supabase);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateParams({ q: localSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const allCategories = [
    { id: "all", name: "All Scents", slug: "all", icon: "", sort_order: 0 },
    ...categories,
  ];

  const applyFilters = () => {
    updateParams({
      minPrice: draftState.minPrice ? String(draftState.minPrice) : null,
      maxPrice: draftState.maxPrice ? String(draftState.maxPrice) : null,
      gender: draftState.gender || null,
      inStock: draftState.inStock ? "true" : null,
      sort: draftState.sort,
    });
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftState({
      minPrice: "",
      maxPrice: "",
      gender: "",
      inStock: false,
      sort: "newest",
    });
    updateParams({
      minPrice: null,
      maxPrice: null,
      gender: null,
      inStock: null,
      sort: "newest",
    });
    setIsFilterOpen(false);
  };

  return (
    <>
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-primary text-xs font-bold tracking-widest uppercase">The Collection</span>
              <h1 className="text-4xl md:text-5xl font-display text-white mt-2">Our Fragrances</h1>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="SEARCH BY NAME, SCENT..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-surface-dark border border-white/10 rounded-full pl-12 pr-10 py-3 text-xs tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setDraftState({
                    minPrice: minPrice || "",
                    maxPrice: maxPrice || "",
                    gender: genderTarget,
                    inStock: inStockOnly,
                    sort: sortBy,
                  });
                  setIsFilterOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-surface-dark border border-white/10 hover:border-white/30 text-white rounded-full px-5 py-3 transition-colors text-xs tracking-widest uppercase font-bold whitespace-nowrap"
              >
                <SlidersHorizontal size={16} />
                Filters
                {(minPrice || maxPrice || genderTarget || inStockOnly || sortBy !== 'newest') && (
                  <span className="w-2 h-2 rounded-full bg-primary ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {allCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  updateParams({ category: cat.slug === "all" ? null : cat.slug });
                }}
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
          {productsLoading ? (
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
            ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-white/10" />
              </div>
              <h3 className="text-xl font-display text-white/60 mb-2">
                    No Results Found
              </h3>
              <p className="text-white/30 text-sm">
                    Try adjusting your filters or search query.
              </p>
                  <button
                    onClick={clearFilters}
                    className="mt-6 text-primary hover:text-primary-light transition-colors text-xs font-bold tracking-widest uppercase underline"
                  >
                    Clear all filters
                  </button>
            </div>
          ) : (
            <>
                    {(searchQuery || minPrice || maxPrice || genderTarget || activeCategory !== "all") && (
                <p className="text-white/30 text-xs tracking-widest uppercase mb-6">
                        {products.length} result{products.length !== 1 ? "s" : ""} found
                </p>
              )}
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
            </>
          )}
        </div>
      </div>

      {/* Filter Modal Edge/Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-sm h-full bg-background-dark border-l border-white/10 p-6 flex flex-col pt-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display text-white">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-white/50 hover:text-white" title="Close filters">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-8">
              {/* Sort By */}
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-3">Sort By</label>
                <div className="relative">
                  <select
                    title="Sort products"
                    value={draftState.sort}
                    onChange={(e) => setDraftState(prev => ({ ...prev, sort: e.target.value }))}
                    className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="best_rated">Best Rated</option>
                    <option value="most_popular">Most Popular</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-3">Price Range ($)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftState.minPrice}
                    onChange={(e) => setDraftState(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-white/20"
                  />
                  <span className="text-white/30">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftState.maxPrice}
                    onChange={(e) => setDraftState(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-3">Gender Target</label>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'All', value: '' },
                    { label: 'Unisex', value: 'unisex' },
                    { label: 'Women', value: 'women' },
                    { label: 'Men', value: 'men' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${draftState.gender === option.value ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                        {draftState.gender === option.value && <div className="w-2 h-2 bg-black rounded-sm" />}
                      </div>
                      <span className="text-sm text-white/80 group-hover:text-white transition-colors">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* In Stock Only */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${draftState.inStock ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                    {draftState.inStock && <div className="w-2 h-2 bg-black rounded-sm" />}
                  </div>
                  <span className="text-sm font-bold tracking-widest uppercase text-white/80 group-hover:text-white transition-colors">In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex gap-4 mt-auto">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 bg-primary text-black py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-primary-light transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ShopPage() {
  return (
    <main className="bg-background-dark min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={
          <div className="pt-40 flex justify-center">
            <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
          </div>
        }>
          <ShopContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
