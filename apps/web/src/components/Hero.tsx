"use client";
import { useHeroBanner } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";
import { motion } from "framer-motion";

export default function Hero() {
  const { banner, loading } = useHeroBanner(supabase);
  const locale = useLocale();
  const t = useTranslations('common');

  if (loading) return (
    <div className="relative h-[90vh] min-h-[600px] w-full flex items-center justify-center">
      <div className="absolute inset-0 bg-surface-muted animate-pulse shimmer-warm" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="h-4 w-32 shimmer-warm rounded-full" />
        <div className="h-16 w-80 shimmer-warm rounded-xl" />
        <div className="h-4 w-60 shimmer-warm rounded-full mt-2" />
      </div>
    </div>
  );
  if (!banner) return null;

  // Use localized fields with fallback to English
  const title = locale === 'ar' ? (banner.title_ar || banner.title_en) : banner.title_en;
  const subtitle = locale === 'ar' ? (banner.subtitle_ar || banner.subtitle_en) : banner.subtitle_en;
  const description = locale === 'ar' ? (banner.description_ar || banner.description_en) : banner.description_en;
  const badgeText = locale === 'ar' ? (banner.badge_text_ar || banner.badge_text_en) : banner.badge_text_en;
  const ctaText = locale === 'ar' ? (banner.cta_text_ar || banner.cta_text_en) : banner.cta_text_en;

  return (
    <section className="relative h-[90vh] min-h-[650px] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={banner.image_url} 
          alt={title || ''}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105"
        />
        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#12100c]/70 via-[#12100c]/30 to-[#12100c]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12100c]/30 via-transparent to-[#12100c]/30" />
        {/* Bottom fade for seamless transition */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#1a1710] to-transparent" />
      </div>

      {/* Decorative gold glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none z-[1]"
      />

      {/* Centered Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-8 text-center flex flex-col items-center">
        <RevealOnScroll delay={0.1}>
          <span className="inline-block px-5 py-1.5 rounded-full border border-primary/20 bg-primary/[0.06] text-primary text-[10px] font-semibold tracking-[0.25em] uppercase mb-8">
            {badgeText}
          </span>
        </RevealOnScroll>

        {/* Title */}
        <RevealOnScroll delay={0.2}>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-sans text-white mb-4 leading-[1.1] tracking-tight">
            {title}
          </h1>
        </RevealOnScroll>

        {/* Subtitle */}
        <RevealOnScroll delay={0.3}>
          <span className="block text-shimmer text-2xl sm:text-3xl md:text-5xl font-sans italic mb-8">
            {subtitle}
          </span>
        </RevealOnScroll>

        {/* Description */}
        <RevealOnScroll delay={0.4}>
          <p className="text-base md:text-lg text-fg-muted mb-12 leading-relaxed font-light max-w-lg mx-auto">
            {description}
          </p>
        </RevealOnScroll>

        {/* Gold divider */}
        <RevealOnScroll delay={0.5}>
          <div className="section-divider mb-12" />
        </RevealOnScroll>

        {/* Buttons */}
        <RevealOnScroll delay={0.6}>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/shop"
                className="group relative bg-gradient-to-r from-primary-light to-primary text-background-dark px-10 py-4 rounded-full font-semibold uppercase tracking-[0.15em] text-sm flex items-center justify-center shadow-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-500 overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  {ctaText}
                  <ArrowRight className={`${locale === 'ar' ? 'mr-3 rotate-180 group-hover:-translate-x-1' : 'ml-3 group-hover:translate-x-1'} transition-transform duration-300`} size={16} strokeWidth={2} />
                </span>
                {/* Shine sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/collections"
                className="group border border-white/10 text-fg px-10 py-4 rounded-full font-semibold uppercase tracking-[0.15em] text-sm flex items-center justify-center hover:bg-white/[0.03] hover:border-primary/30 hover:text-white transition-all duration-500"
              >
                {t('discover_collections')}
              </Link>
            </motion.div>
          </div>
        </RevealOnScroll>
      </div>

      {/* Scroll indicator */}
      <RevealOnScroll delay={0.8} yOffset={0}>
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-transparent animate-float" />
        </motion.div>
      </RevealOnScroll>
    </section>
  );
}
