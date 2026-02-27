"use client";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";
import { motion } from "framer-motion";

export default function GenderShowcase() {
  const t = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const sections = [
    {
      key: 'women',
      title: t('for_her'),
      subtitle: t('womens_fragrances'),
      description: t('explore_women'),
      href: '/shop?gender=women',
      cta: t('shop_women'),
      gradient: 'from-rose-950/40 via-pink-900/20 to-transparent',
      accentColor: 'rgba(244, 143, 177, 0.15)',
      borderColor: 'border-pink-400/10 hover:border-pink-400/30',
      textAccent: 'text-pink-300',
      btnBg: 'bg-pink-400/10 hover:bg-pink-400/20 text-pink-300',
      icon: '✿',
    },
    {
      key: 'men',
      title: t('for_him'),
      subtitle: t('mens_fragrances'),
      description: t('explore_men'),
      href: '/shop?gender=men',
      cta: t('shop_men'),
      gradient: 'from-blue-950/40 via-slate-900/20 to-transparent',
      accentColor: 'rgba(96, 165, 250, 0.12)',
      borderColor: 'border-blue-400/10 hover:border-blue-400/30',
      textAccent: 'text-blue-300',
      btnBg: 'bg-blue-400/10 hover:bg-blue-400/20 text-blue-300',
      icon: '♦',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
      <RevealOnScroll delay={0.1}>
        <div className="text-center mb-10 md:mb-14">
          <span className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-4 block">
            {t('shop_by_category')}
          </span>
          <h2 className="text-3xl md:text-5xl font-sans text-white italic">
            {t('explore_categories')}
          </h2>
          <div className="section-divider mt-6" />
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {sections.map((section, index) => (
          <RevealOnScroll key={section.key} delay={0.2 + index * 0.15}>
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Link
                href={section.href}
                className={`group relative block overflow-hidden rounded-3xl border ${section.borderColor} transition-all duration-500 h-[320px] md:h-[400px]`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient}`} />
                
                {/* Ambient glow */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: section.accentColor }}
                />

                {/* Decorative icon */}
                <div className="absolute top-6 right-6 text-5xl opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700 select-none">
                  {section.icon}
                </div>

                {/* Glass surface */}
                <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px]" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-10">
                  <span className={`text-[10px] font-bold tracking-[0.25em] uppercase mb-3 ${section.textAccent}`}>
                    {section.subtitle}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-sans text-white mb-3 group-hover:text-white/90 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-fg-muted text-sm leading-relaxed mb-6 max-w-xs opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                    {section.description}
                  </p>
                  <div className={`inline-flex items-center gap-2 self-start px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.15em] ${section.btnBg} transition-all duration-300`}>
                    {section.cta}
                    <ArrowRight size={14} className={`${isRTL ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform duration-300`} />
                  </div>
                </div>

                {/* Bottom edge glow */}
                <div className="absolute bottom-0 left-[10%] right-[10%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${section.accentColor}, transparent)` }}
                />
              </Link>
            </motion.div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
