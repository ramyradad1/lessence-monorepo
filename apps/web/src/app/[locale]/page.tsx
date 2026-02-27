"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryFilter from "@/components/CategoryFilter";
import PromoBanner from "@/components/PromoBanner";
import RecentlyViewed from "@/components/RecentlyViewed";
import GenderShowcase from "@/components/GenderShowcase";
import CategoryGrid from "@/components/CategoryGrid";
import ProductTypeShowcase from "@/components/ProductTypeShowcase";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { PerformanceTracker } from "@/components/PerformanceTracker";

// Registry: maps DB key → component
const SECTION_REGISTRY: Record<string, React.ComponentType | null> = {
  hero: Hero,
  gender_showcase: GenderShowcase,
  category_filter: CategoryFilter,
  category_grid: CategoryGrid,
  featured_products: FeaturedProducts,
  product_type_showcase: ProductTypeShowcase,
  promo_banner: PromoBanner,
  recently_viewed: RecentlyViewed,
  luxury_quote: null, // handled inline
};

// Default order as fallback
const DEFAULT_SECTIONS = [
  { key: "hero", is_visible: true },
  { key: "gender_showcase", is_visible: true },
  { key: "category_filter", is_visible: true },
  { key: "category_grid", is_visible: true },
  { key: "featured_products", is_visible: true },
  { key: "product_type_showcase", is_visible: true },
  { key: "promo_banner", is_visible: true },
  { key: "recently_viewed", is_visible: true },
  { key: "luxury_quote", is_visible: true },
];

interface SectionConfig {
  key: string;
  is_visible: boolean;
}

function LuxuryQuote() {
  const t = useTranslations('common');
  return (
    <section className="relative w-full py-28 md:py-40">
      <div className="section-divider mb-16 md:mb-20" />
      <div className="max-w-4xl mx-auto px-4 text-center">
        <span className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-8 block animate-fade-in">
          {t('philosophy')}
        </span>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-fg leading-tight italic text-shimmer">
          {t('luxury_quote')}
        </h2>
        <div className="section-divider mt-12" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}

export default function Home() {
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);

  useEffect(() => {
    supabase
      .from('homepage_sections')
      .select('key, is_visible')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSections(data);
        }
      });
  }, []);

  return (
    <main className="bg-gradient-page min-h-screen text-fg font-sans overflow-x-hidden">
      <PerformanceTracker actionName="home_load" />
      <Navbar />

      {sections.map((section) => {
        if (!section.is_visible) return null;

        if (section.key === 'luxury_quote') {
          return (
            <ScrollReveal key={section.key} className="w-full">
              <LuxuryQuote />
            </ScrollReveal>
          );
        }

        const Component = SECTION_REGISTRY[section.key];
        if (!Component) return null;

        return (
          <ScrollReveal key={section.key} className="w-full">
            <Component />
          </ScrollReveal>
        );
      })}

      <ScrollReveal className="w-full">
        <Footer />
      </ScrollReveal>
    </main>
  );
}
