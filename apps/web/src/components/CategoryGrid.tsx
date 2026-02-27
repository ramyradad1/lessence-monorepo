"use client";
import { useCategories } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";
import { motion } from "framer-motion";

export default function CategoryGrid() {
  const { categories, loading } = useCategories(supabase);
  const locale = useLocale();
  const t = useTranslations('common');
  const isRTL = locale === 'ar';

  if (loading || categories.length === 0) return null;

  // Filter out "all" category
  const displayCategories = categories.filter(
    (cat) => cat.slug !== "all" && cat.name_en !== "All Scents"
  );

  if (displayCategories.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
      <RevealOnScroll delay={0.1}>
        <div className="text-center mb-10 md:mb-14">
          <span className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-4 block">
            {t('shop_by_category')}
          </span>
          <h2 className="text-3xl md:text-5xl font-sans text-white italic">
            {t('the_collections')}
          </h2>
          <div className="section-divider mt-6" />
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {displayCategories.map((cat, index) => {
          const catName =
            locale === "ar" && cat.name_ar
              ? cat.name_ar
              : cat.name_en || cat.name;
          const catDesc =
            locale === "ar" && cat.description_ar
              ? cat.description_ar
              : cat.description_en || cat.description;

          return (
            <RevealOnScroll key={cat.id} delay={0.1 + (index % 4) * 0.1}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="group relative block h-[220px] md:h-[280px] overflow-hidden rounded-2xl border border-white/[0.06] hover:border-primary/20 transition-all duration-500"
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={catName}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-70"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-muted to-surface-dark flex items-center justify-center">
                      <span className="text-5xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        {cat.icon || "🌿"}
                      </span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <h3 className="text-lg md:text-xl font-sans text-white group-hover:text-primary transition-colors duration-300 mb-1">
                      {catName}
                    </h3>
                    {catDesc && (
                      <p className="text-fg-faint text-[11px] line-clamp-2 opacity-0 group-hover:opacity-80 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        {catDesc}
                      </p>
                    )}
                    <div className={`flex items-center gap-1 text-primary text-[10px] font-bold tracking-[0.15em] uppercase mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {t('explore_collection')}
                      <ArrowRight size={10} className={`${isRTL ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`} />
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-primary/[0.08] rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </Link>
              </motion.div>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
