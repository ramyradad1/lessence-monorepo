"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getFeaturedProducts } from "@/services/products.service";
import { getCategories } from "@/services/categories.service";
import { Product, formatCurrency } from "@lessence/core";
import LuxuryButton from "@/components/v2/LuxuryButton";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useTranslations, useLocale } from "next-intl";
import GenderShowcase from "@/components/GenderShowcase";
import ShopCollection from "@/components/v2/ShopCollection";
import RecentlyViewed from "@/components/RecentlyViewed";
import { Variants } from "framer-motion";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80";

/* ── Reusable animation variants ── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }
  })
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const }
  })
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(201,169,110,0.1)",
      "0 0 40px rgba(201,169,110,0.2)",
      "0 0 20px rgba(201,169,110,0.1)",
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
  }
};

export default function V2HomePage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Array<{id: string; name: string; name_en: string; slug: string; image_url: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [products, cats] = await Promise.all([
          getFeaturedProducts(supabase, 4),
          getCategories(supabase)
        ]);
        setBestSellers((products || []) as unknown as Product[]);
        setCollections((cats || []).filter((c: {slug: string}) => c.slug !== 'all').slice(0, 4));
      } catch (error) {
        console.error("Error loading V2 home page data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-[background:var(--v2-bg-gradient,var(--v2-bg))]">
      
      {/* ============================================ */}
      {/* 1. HERO SECTION - Triple Arch with Podiums   */}
      {/* ============================================ */}
      <section className="relative w-full min-h-[70vh] md:min-h-[85vh] flex flex-col justify-end overflow-hidden bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))]">
        {/* Animated background gradient */}
        <motion.div 
          className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom,var(--v2-bg-card),var(--v2-bg-elevated),var(--v2-bg))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        
        {/* Animated gold particle dots */}
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#c9a96e]/30 rounded-full"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            />
          ))}
        </div>
        
        <div className="relative z-10 w-full max-w-[1300px] mx-auto px-4 flex items-end justify-center pb-0 min-h-[55vh] md:min-h-[70vh]">
          
          {/* Left Column - hidden on mobile/tablet */}
          <motion.div 
            className="hidden lg:flex flex-col items-center w-[30%] relative min-h-[45vh] xl:min-h-[55vh]"
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
          >
            {/* Left Arch Border with glow animation */}
            <div className="absolute top-0 w-[85%] mx-auto left-0 right-0 h-3/4">
              <motion.div 
                className="w-full h-full border-2 border-[#c9a96e]/25 rounded-t-full border-b-0"
                {...glowPulse}
              />
              <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-[#c9a96e]/5 to-transparent" />
            </div>
            {/* Gold vertical accent bars */}
            <motion.div 
              className="absolute left-0 top-[10%] w-[3px] h-[55%] bg-gradient-to-b from-[#c9a96e]/40 via-[#c9a96e]/20 to-transparent"
              initial={{ height: 0 }}
              animate={{ height: "55%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            />
            <motion.div 
              className="absolute right-0 top-[10%] w-[3px] h-[55%] bg-gradient-to-b from-[#c9a96e]/40 via-[#c9a96e]/20 to-transparent"
              initial={{ height: 0 }}
              animate={{ height: "55%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            />
            
            {/* Text content with stagger */}
            <motion.div 
              className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 mt-12"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <h2 className="text-2xl xl:text-4xl font-serif text-[#c9a96e]/80 uppercase tracking-[0.15em] text-center leading-snug">
                {t('exclusive_scents') || 'EXCLUSIVE SCENTS.'}
              </h2>
              <motion.div 
                className="mt-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LuxuryButton variant="outline" size="sm" className="bg-black/40 backdrop-blur border-[#c9a96e]/40 text-[#c9a96e] text-xs tracking-widest px-6">
                  {t('discover') || 'DISCOVER'}
                </LuxuryButton>
              </motion.div>
            </motion.div>
            
            {/* Podium base */}
            <div className="relative w-full mt-auto">
              <div className="w-[110%] -ml-[5%] h-6 bg-gradient-to-t from-[#1a1a1a] to-[#222] rounded-t-[60%] mx-auto" />
              <div className="w-full h-4 bg-[#111] rounded-t-[50%] mx-auto -mt-1" />
            </div>
          </motion.div>

          {/* Center Column - Main Hero (always visible) */}
          <motion.div 
            className="flex flex-col items-center w-full lg:w-[40%] relative min-h-[50vh] md:min-h-[60vh]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Center Golden Arch */}
            <motion.div 
              className="absolute top-0 w-full h-4/5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <div className="w-full h-full border-[3px] border-[#c9a96e] rounded-t-full border-b-0 shadow-[0_0_40px_rgba(201,169,110,0.15)]" />
              <div className="absolute inset-[3px] rounded-t-full bg-gradient-to-b from-[#1a1508]/60 via-[#12100a]/30 to-transparent" />
            </motion.div>
            
            {/* Gold vertical pillars */}
            <motion.div 
              className="absolute left-0 top-[5%] w-1 bg-gradient-to-b from-[#c9a96e]/50 via-[#c9a96e]/25 to-transparent"
              initial={{ height: 0 }}
              animate={{ height: "65%" }}
              transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
            />
            <motion.div 
              className="absolute right-0 top-[5%] w-1 bg-gradient-to-b from-[#c9a96e]/50 via-[#c9a96e]/25 to-transparent"
              initial={{ height: 0 }}
              animate={{ height: "65%" }}
              transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
            />

            {/* Mobile "Exclusive Scents" text - only on small screens */}
            <motion.div 
              className="lg:hidden relative z-20 text-center mt-16 mb-4 px-4"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <h1 className="text-3xl sm:text-4xl font-serif text-[#c9a96e]/90 uppercase tracking-[0.15em] leading-snug">
                {t('exclusive_scents') || 'EXCLUSIVE SCENTS.'}
              </h1>
            </motion.div>
            
            {/* Center Bottle with floating animation */}
            <motion.div
              className="relative z-20 w-[60%] sm:w-[55%] lg:w-[75%] flex-1 mt-4 lg:mt-10 mb-8"
              initial={{ opacity: 0, y: 60, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div 
                className="relative w-full h-full min-h-[250px] sm:min-h-[300px] md:min-h-[320px]"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image 
                  src={FALLBACK_IMAGE}
                  alt="Signature Perfume"
                  fill
                  className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.9)]"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Mobile CTA buttons */}
            <motion.div 
              className="lg:hidden relative z-20 flex gap-3 mb-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/v2/shop">
                  <LuxuryButton variant="primary" size="sm" className="bg-[#c9a96e] text-black text-xs tracking-widest px-5">SHOP NOW</LuxuryButton>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <LuxuryButton variant="outline" size="sm" className="border-[#c9a96e]/40 text-[#c9a96e] text-xs tracking-widest px-5">DISCOVER</LuxuryButton>
              </motion.div>
            </motion.div>
            
            {/* Master Podium */}
            <div className="relative w-full mt-auto z-20">
              <div className="w-[120%] sm:w-[130%] -ml-[10%] sm:-ml-[15%] h-8 sm:h-10 bg-gradient-to-t from-[#0a0a0a] via-[#151515] to-[#222] rounded-t-[55%] mx-auto shadow-[0_-8px_20px_rgba(0,0,0,0.8)]" />
              <div className="w-[105%] sm:w-[115%] -ml-[2.5%] sm:-ml-[7.5%] h-5 sm:h-6 bg-[#111] rounded-t-[50%] mx-auto -mt-2 border-t border-white/5" />
              <div className="w-full h-3 sm:h-4 bg-[#0a0a0a] rounded-t-[50%] mx-auto -mt-1" />
            </div>
          </motion.div>

          {/* Right Column - hidden on mobile/tablet */}
          <motion.div 
            className="hidden lg:flex flex-col items-center w-[30%] relative min-h-[45vh] xl:min-h-[55vh]"
            variants={slideInRight}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute top-0 w-[85%] mx-auto left-0 right-0 h-3/4">
              <motion.div 
                className="w-full h-full border-2 border-[#c9a96e]/25 rounded-t-full border-b-0"
                {...glowPulse}
              />
              <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-[#c9a96e]/5 to-transparent" />
            </div>
            <motion.div 
              className="absolute left-0 top-[10%] w-[3px] bg-gradient-to-b from-[#c9a96e]/40 via-[#c9a96e]/20 to-transparent"
              initial={{ height: 0 }}
              animate={{ height: "55%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            />
            <motion.div 
              className="absolute right-0 top-[10%] w-[3px] bg-gradient-to-b from-[#c9a96e]/40 via-[#c9a96e]/20 to-transparent"
              initial={{ height: 0 }}
              animate={{ height: "55%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            />
            
            <motion.div 
              className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 mt-12"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <h2 className="text-2xl xl:text-4xl font-serif text-[#c9a96e]/80 uppercase tracking-[0.15em] text-center leading-snug">
                EXCLUSIVE<br/>SCENTS.
              </h2>
              <motion.div 
                className="mt-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LuxuryButton variant="outline" size="sm" className="bg-black/40 backdrop-blur border-[#c9a96e]/40 text-[#c9a96e] text-xs tracking-widest px-6">COLLECTION</LuxuryButton>
              </motion.div>
            </motion.div>
            
            <div className="relative w-full mt-auto">
              <div className="w-[110%] -ml-[5%] h-6 bg-gradient-to-t from-[#1a1a1a] to-[#222] rounded-t-[60%] mx-auto" />
              <div className="w-full h-4 bg-[#111] rounded-t-[50%] mx-auto -mt-1" />
            </div>
          </motion.div>

        </div>

        {/* Stage floor with animated gold line */}
        <div className="relative z-30 w-full h-10 sm:h-12 bg-gradient-to-t from-[#0a0a0a] to-[#111] border-t border-white/5">
          <motion.div 
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "70%" }}
            transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. THE COLLECTION                            */}
      {/* ============================================ */}
      <section className="relative w-full py-14 sm:py-20 bg-[background:var(--v2-bg-gradient,var(--v2-bg))]">
        <ShopCollection />
      </section>

      {/* ============================================ */}
      {/* 3. LUXURY CATEGORIES                         */}
      {/* ============================================ */}
      <section className="relative w-full py-14 sm:py-20 bg-[background:var(--v2-bg-gradient,var(--v2-bg))]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6">
          {/* Title with animation */}
          <RevealOnScroll>
            <div className="flex flex-col items-center mb-10 sm:mb-14">
              <motion.span 
                className="text-[#c9a96e]/50 text-[8px] sm:text-[9px] tracking-[0.4em] sm:tracking-[0.5em] uppercase mb-3"
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.5em" }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                EXPLORE
              </motion.span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-center tracking-[0.08em] sm:tracking-[0.12em] leading-tight uppercase text-[var(--v2-text)]">
                {t('luxury_collections') || 'LUXURY COLLECTIONS.'}
              </h2>
            </div>
          </RevealOnScroll>
          
          {/* Collection cards grid - responsive */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {!loading && collections.map((cat, i) => (
              <motion.div key={cat.id} variants={fadeUp} custom={i}>
                <Link href={`/v2/shop?category=${cat.slug}`} className="block group relative aspect-square overflow-hidden transition-all duration-500 bg-[var(--v2-bg-card)] border border-[var(--v2-border)]">
                  
                  {/* Category Product Image with smooth hover scale */}
                  <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                    <div className="relative w-full h-full opacity-50 group-hover:opacity-80 group-hover:scale-[1.05] transition-all duration-[1000ms] cubic-bezier(0.25, 0.46, 0.45, 0.94)">
                      <Image
                        src={cat.image_url || FALLBACK_IMAGE}
                        alt={cat.name_en || cat.name}
                        fill
                        className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  </div>
                  
                  {/* Decorative circle icon */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center z-20">
                    <span className="text-[#c9a96e] text-[6px] sm:text-[8px] font-serif italic">L&apos;E</span>
                  </div>

                  {/* Bottom overlay with category name */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 sm:pt-16 pb-3 sm:pb-5 px-3 sm:px-5 z-10">
                    <span className="text-[#c9a96e]/50 text-[7px] sm:text-[8px] tracking-[0.3em] sm:tracking-[0.4em] uppercase block mb-0.5 sm:mb-1">Premium</span>
                    <h3 className="text-sm sm:text-xl font-sans text-white/90 tracking-wider group-hover:text-[#c9a96e] transition-colors font-medium truncate">{cat.name_en || cat.name}</h3>
                  </div>

                  {/* Animated border glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border border-[#c9a96e]/10" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ============================================ */}
      {/* 4. BEST SELLERS                              */}
      {/* ============================================ */}
      <section className="relative w-full py-14 sm:py-20 px-4 sm:px-6 bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))]">
        <div className="max-w-[1300px] mx-auto">
          {/* Section Title with animated gold lines */}
          <RevealOnScroll>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
              <motion.div 
                className="h-[1px] flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-l from-[#c9a96e]/50 to-transparent"
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: "100%", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
              <h2 className="text-sm sm:text-base md:text-lg font-sans text-[#c9a96e]/70 uppercase tracking-[0.25em] sm:tracking-[0.35em] text-center whitespace-nowrap">{t('best_sellers')}</h2>
              <motion.div 
                className="h-[1px] flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-r from-[#c9a96e]/50 to-transparent"
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: "100%", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </div>
          </RevealOnScroll>
          
          {loading ? (
            <div className="flex justify-center h-64 items-center">
              <motion.div 
                className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#c9a96e]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {bestSellers.slice(0, 3).map((product, i) => (
                <motion.div key={product.id} variants={scaleUp} custom={i}>
                  <Link href={`/v2/products/${product.slug}`} className="block group relative transition-all duration-[800ms] ease-out overflow-hidden min-h-[350px] sm:min-h-[420px] bg-[var(--v2-bg-card)] border border-[var(--v2-border)]">
                    {/* Number Badge */}
                    <motion.div 
                      className="absolute top-4 left-4 w-7 h-7 bg-[#c9a96e] text-black flex items-center justify-center font-bold text-xs z-20 rounded-sm"
                      initial={{ scale: 0, rotate: -45 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1, type: "spring", bounce: 0.4 }}
                      viewport={{ once: true }}
                    >
                      {i + 1}
                    </motion.div>
                    
                    {/* Product Image with smooth luxury hover zoom */}
                    <div className="absolute inset-0 p-8 sm:p-10 pt-12 sm:pt-14 pb-20 sm:pb-24 flex items-center justify-center">
                      <div className="relative w-full h-full transition-all duration-[1200ms] cubic-bezier(0.25, 0.46, 0.45, 0.94) group-hover:scale-[1.05] group-hover:-translate-y-2">
                        <Image 
                          src={product.image_url || FALLBACK_IMAGE}
                          alt={product.name_en || product.name || ""}
                          fill
                          className="object-contain drop-shadow-[0_25px_35px_var(--v2-product-shadow)]"
                        />
                      </div>
                    </div>

                    {/* Podium */}
                    <div className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 w-[75%] h-3 bg-gradient-to-t from-black/40 to-transparent rounded-[50%]" />
                    
                    {/* Bottom info bar with silkiest animation */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] backdrop-blur-md z-10 transition-colors duration-700 text-[var(--v2-text-faint)] bg-[var(--v2-bg-glass)] border-t border-[var(--v2-border)]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#c9a96e]/70 group-hover:text-[#c9a96e] transition-colors duration-700 truncate font-bold text-[9px] sm:text-[10px]">{product.name_en || product.name}</span>
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity duration-700 text-[var(--v2-text)]">{t('explore')}</span>
                      </div>
                      <span className="text-[#c9a96e] font-bold text-[10px] sm:text-xs tracking-tight">
                        {formatCurrency(product.price, locale)}
                      </span>
                    </div>

                    {/* Hover glow overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[1000ms] pointer-events-none bg-gradient-to-t from-[#c9a96e]/[0.05] to-transparent" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. GENDER SHOWCASE                           */}
      {/* ============================================ */}
      <section className="w-full py-10 bg-[background:var(--v2-bg-gradient,var(--v2-bg))] border-t border-[var(--v2-border)]">
        <GenderShowcase />
      </section>

      {/* Philosophy Quote */}
      <section className="relative w-full py-28 md:py-40 overflow-hidden bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))]">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.span 
            className="text-[#c9a96e] text-[9px] font-semibold tracking-[0.4em] uppercase mb-10 block"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('philosophy') || 'PHILOSOPHY'}
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight italic tracking-wide text-[var(--v2-text)]"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true }}
          >
            &quot;{t('luxury_quote') || 'Luxury is not just felt; it is experienced in every breath of refined elegance.'}&quot;
          </motion.h2>
          <div className="w-24 h-px bg-[#c9a96e]/30 mx-auto mt-12" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#c9a96e]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* BRAND STORY SECTION */}
      <section className="relative w-full py-16 sm:py-24 overflow-hidden bg-[background:var(--v2-bg-gradient,var(--v2-bg))] border-t border-[var(--v2-border)]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            
            <motion.div 
              className="grid grid-cols-2 gap-3 sm:gap-4 order-2 lg:order-1 h-[350px] sm:h-[500px]"
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/5 mt-8 sm:mt-12">
                <Image src={FALLBACK_IMAGE} alt="Artisan 1" fill className="object-cover opacity-80" />
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/5 mb-8 sm:mb-12">
                <Image src={FALLBACK_IMAGE} alt="Artisan 2" fill className="object-cover opacity-80" />
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-start order-1 lg:order-2"
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <span className="text-[#c9a96e] text-[10px] tracking-[0.4em] uppercase mb-4">{t('our_story') || 'OUR STORY'}</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6 sm:mb-8 text-[var(--v2-text)]">
                {t('brand_story_title') || 'Crafting the Impossible.'}
              </h2>
              <p className="text-base sm:text-lg leading-relaxed mb-6 text-[var(--v2-text-secondary)]">
                {t('brand_story_desc') || "Every L'ESSENCE fragrance begins with a whisper of rare ingredients and a vision of absolute perfection. We don't just create perfumes; we capture memories in golden glass."}
              </p>
              <div className="flex pt-4 h-32">
                 <Link href="/v2/about">
                  <LuxuryButton variant="primary" size="lg" className="px-10">
                    {t('read_our_story') || 'Read Our Story'}
                  </LuxuryButton>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. RECENTLY VIEWED                           */}
      {/* ============================================ */}
      <section className="w-full pt-10 pb-20 overflow-hidden bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))] border-t border-[var(--v2-border)]">
        <RecentlyViewed />
      </section>

    </div>
  );
}
