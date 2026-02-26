"use client";
import { Link } from "@/navigation";
import { useBundles } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function PromoBanner() {
  const { bundles, loading } = useBundles(supabase);
  const locale = useLocale();
  const t = useTranslations('common');

  if (loading || bundles.length === 0) return null;

  const firstBundle = bundles[0];
  const bundleName = locale === 'ar' ? (firstBundle.name_ar || firstBundle.name_en) : firstBundle.name_en;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-white/[0.04] px-8 md:px-12 py-10 md:py-14 glass-card-v2">
        <div className="relative z-10 flex flex-col gap-3 max-w-md">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-[0.25em]">
            {t('exclusive') || 'EXCLUSIVE'}
          </span>
          <h4 className="text-2xl md:text-3xl font-sans text-fg italic">{bundleName || t('gift_sets') || 'Gift Sets'}</h4>
          <p className="text-sm text-fg-faint leading-relaxed">{t('gift_sets_desc') || 'The perfect gift for your loved ones.'}</p>
          <Link
            href="/bundles"
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary hover:text-primary-light transition-colors duration-300 group"
          >
            {t('shop_gifts') || 'Shop Gifts'}
            <ArrowRight size={14} strokeWidth={2} className={`${locale === 'ar' ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform duration-300`} />
          </Link>
        </div>
        {firstBundle.image_url && (
          <div className="relative z-10 h-28 w-28 md:h-36 md:w-36 shrink-0">
            <Image
              src={firstBundle.image_url}
              alt={bundleName || 'Gift set'}
              fill
              sizes="144px"
              className="rounded-xl object-cover shadow-gold rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105"
            />
          </div>
        )}
        {/* Decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-primary/[0.03] rounded-full blur-[60px] pointer-events-none" />
      </div>
    </div>
  );
}
