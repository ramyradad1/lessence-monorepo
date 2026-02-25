"use client";
import { useHeroBanner } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export default function Hero() {
  const { banner, loading } = useHeroBanner(supabase);
  const locale = useLocale();
  const t = useTranslations('common');

  if (loading) return <div className="h-screen bg-background-dark animate-pulse" />;
  if (!banner) return null;

  // Use localized fields with fallback to English
  const title = locale === 'ar' ? (banner.title_ar || banner.title_en) : banner.title_en;
  const subtitle = locale === 'ar' ? (banner.subtitle_ar || banner.subtitle_en) : banner.subtitle_en;
  const description = locale === 'ar' ? (banner.description_ar || banner.description_en) : banner.description_en;
  const badgeText = locale === 'ar' ? (banner.badge_text_ar || banner.badge_text_en) : banner.badge_text_en;
  const ctaText = locale === 'ar' ? (banner.cta_text_ar || banner.cta_text_en) : banner.cta_text_en;

  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={banner.image_url} 
          alt={title || ''}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="max-w-2xl bg-background-dark/30 p-8 backdrop-blur-sm rounded-lg border border-white/5">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
            {badgeText}
          </span>
          <h1 className="text-5xl md:text-7xl font-display text-white mb-6 leading-tight">
            {title}
            <span className="block text-primary italic text-3xl md:text-5xl mt-2">{subtitle}</span>
          </h1>
          <p className="text-lg text-white/60 mb-10 leading-relaxed font-light">
            {description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/shop" className="bg-primary text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest flex items-center group hover:bg-white transition-all">
              {ctaText}
              <ArrowRight className={`${locale === 'ar' ? 'mr-2 rotate-180 group-hover:-translate-x-1' : 'ml-2 group-hover:translate-x-1'} transition-transform`} size={18} />
            </Link>
            <Link href="/shop" className="border border-white/20 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
              {t('discover_collections')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
