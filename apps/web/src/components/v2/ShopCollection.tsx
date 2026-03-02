"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProducts } from "@/services/products.service";
import { getCategories } from "@/services/categories.service";
import { Product } from "@lessence/core";
import ProductCard from "@/components/v2/ProductCard";
import RevealOnScroll from "@/components/RevealOnScroll";
import SectionTitle from "@/components/v2/SectionTitle";

export default function ShopCollection({ initialCategory = 'all', title = "The Collection" }: { initialCategory?: string, title?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string, name: string, name_en: string, slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      try {
        const [allProds, allCats] = await Promise.all([
          getProducts(supabase),
          getCategories(supabase)
        ]);
        setProducts(allProds as Product[]);
        setCategories(allCats);
      } catch (error) {
        console.error("Shop load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, []);

  const displayedProducts = products.filter(p => {
    if (activeCategory === 'all') return true;
    return (p as unknown as { category?: { slug?: string } }).category?.slug === activeCategory;
  });

  return (
    <div className="w-full flex flex-col items-center pb-20 mt-10">
      {/* Dynamic Title if explicitly provided, else just 'The Collection' */}
      {title && <SectionTitle title={title} subtitle="Explore Our Masterpieces" />}

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-10 sm:mb-16 relative z-10 px-2 sm:px-6">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`px-4 sm:px-6 py-2 rounded-full text-[9px] sm:text-[10px] sm:text-xs font-medium uppercase tracking-widest transition-all duration-300 ${activeCategory === 'all' ? 'bg-[#c9a96e] text-black font-bold border border-[#c9a96e]' : 'border border-[var(--v2-border-hover)] text-[var(--v2-text)] hover:border-[#c9a96e] hover:text-[#c9a96e]'}`}
        >
          All Scents
        </button>
        {categories.map(cat => {
          // Avoid duplicate "All" categories that might come from the API
          const isAllCategory = cat.slug === 'all' || cat.id === 'all' || (cat.name_en && cat.name_en.toLowerCase().includes('all scents'));
          if (isAllCategory) return null;
          
          return (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 sm:px-6 py-2 rounded-full text-[9px] sm:text-[10px] sm:text-xs font-medium uppercase tracking-widest transition-all duration-300 ${activeCategory === cat.slug ? 'bg-[#c9a96e] text-black font-bold border border-[#c9a96e]' : 'border border-[var(--v2-border-hover)] text-[var(--v2-text)] hover:border-[#c9a96e] hover:text-[#c9a96e]'}`}
            >
              {cat.name_en || cat.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center w-full">
          <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#c9a96e] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 w-full max-w-[1300px] mx-auto px-4 sm:px-6">
          {displayedProducts.map((p, i) => (
            <RevealOnScroll key={p.id} delay={(i % 4) * 0.1}>
              <ProductCard product={p} />
            </RevealOnScroll>
          ))}
          {displayedProducts.length === 0 && (
             <div className="col-span-full text-center py-20 tracking-widest uppercase text-sm text-[var(--v2-text-faint)]">
               No products found in this collection.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
