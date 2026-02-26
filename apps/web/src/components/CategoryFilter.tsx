"use client";
import { useCategories } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function CategoryFilter() {
  const { categories, loading } = useCategories(supabase);
  const locale = useLocale();
  const t = useTranslations('common');

  if (loading || categories.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-8">
      {/* Centered pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/shop"
          className="whitespace-nowrap rounded-full bg-primary/10 border border-primary/20 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary shadow-sm transition-all duration-300 hover:bg-primary/15 hover:shadow-gold"
        >
          {t('all_scents') || 'All Scents'}
        </Link>
        {categories
          .filter(cat => cat.slug !== 'all' && cat.name_en !== 'All Scents')
          .map((cat) => {
          const catName = locale === 'ar' && cat.name_ar ? cat.name_ar : (cat.name_en || cat.name);
          return (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="whitespace-nowrap rounded-full bg-transparent px-6 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-fg-faint hover:text-fg border border-white/[0.06] hover:border-primary/20 hover:bg-white/[0.02] transition-all duration-300"
            >
              {catName}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
