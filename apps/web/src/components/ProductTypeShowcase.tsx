"use client";
import { useProductSearch, useAuth, useFavorites } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import ProductCard from "./ProductCard";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import RevealOnScroll from "./RevealOnScroll";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function ProductTypeSection({
  type,
  title,
  description,
  icon: Icon,
  accentColor,
  badgeColor,
  href,
}: {
  type: 'original' | 'simulation';
  title: string;
  description: string;
  icon: typeof Crown;
  accentColor: string;
  badgeColor: string;
  href: string;
}) {
  const { products, loading } = useProductSearch(supabase, {
    productTypes: [type],
    sortBy: 'newest',
  });
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);
  const locale = useLocale();
  const t = useTranslations('common');
  const isRTL = locale === 'ar';

  const displayProducts = products.slice(0, 6);

  if (loading) {
    return (
      <div className="flex gap-5 overflow-hidden px-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[220px] md:w-[260px] flex-none">
            <div className="aspect-[3/4] shimmer-warm rounded-2xl" />
            <div className="mt-4 h-4 shimmer-warm rounded-full w-28 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (displayProducts.length === 0) return null;

  return (
    <div className="space-y-6">
      <RevealOnScroll delay={0.1}>
        <div className="flex items-center justify-between px-4 md:px-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${badgeColor} flex items-center justify-center`}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-sans text-white">
                {title}
              </h3>
              <p className="text-fg-faint text-xs mt-0.5 max-w-sm hidden md:block">
                {description}
              </p>
            </div>
          </div>
          <Link
            href={href}
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] hover:text-primary transition-colors duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ color: accentColor }}
          >
            {t('view_collection')}
            <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={0.2}>
        <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:px-0 pb-4 no-scrollbar">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              compact
            />
          ))}
        </div>
      </RevealOnScroll>
    </div>
  );
}

export default function ProductTypeShowcase() {
  const t = useTranslations('common');

  return (
    <section className="w-full max-w-7xl mx-auto px-0 md:px-8 py-12 md:py-20 space-y-16">
      <RevealOnScroll delay={0.1}>
        <div className="text-center mb-6">
          <span className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-4 block">
            {t('exclusive')}
          </span>
          <h2 className="text-3xl md:text-5xl font-sans text-white italic">
            {t('shop_by_category')}
          </h2>
          <div className="section-divider mt-6" />
        </div>
      </RevealOnScroll>

      <ProductTypeSection
        type="original"
        title={t('original_perfumes')}
        description={t('discover_original')}
        icon={Crown}
        accentColor="#d4af37"
        badgeColor="bg-amber-500/10 text-amber-400"
        href="/shop?productType=original"
      />

      <ProductTypeSection
        type="simulation"
        title={t('simulation_perfumes')}
        description={t('discover_simulation')}
        icon={Sparkles}
        accentColor="#a78bfa"
        badgeColor="bg-violet-500/10 text-violet-400"
        href="/shop?productType=simulation"
      />
    </section>
  );
}
