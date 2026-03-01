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
      href: '/v2/shop?gender=women',
      cta: t('shop_women'),
      gradient: 'from-[#663b46]/20 via-[#4a2b33]/10 to-transparent',
      accentColor: 'rgba(201, 169, 110, 0.15)',
      borderColor: 'var(--v2-border)',
      hoverBorderColor: 'var(--v2-border-hover)',
      textAccent: 'var(--v2-gold)',
      btnBg: 'bg-[#c9a96e]/10 hover:bg-[#c9a96e]/20',
      btnText: 'var(--v2-gold)',
      icon: '✿',
    },
    {
      key: 'men',
      title: t('for_him'),
      subtitle: t('mens_fragrances'),
      description: t('explore_men'),
      href: '/v2/shop?gender=men',
      cta: t('shop_men'),
      gradient: 'from-[#2a3b4c]/20 via-[#1f2b38]/10 to-transparent',
      accentColor: 'rgba(201, 169, 110, 0.15)',
      borderColor: 'var(--v2-border)',
      hoverBorderColor: 'var(--v2-border-hover)',
      textAccent: 'var(--v2-gold)',
      btnBg: 'bg-[#c9a96e]/10 hover:bg-[#c9a96e]/20',
      btnText: 'var(--v2-gold)',
      icon: '♦',
    },
  ];

  return (
    <section className="w-full max-w-[1300px] mx-auto px-4 md:px-8 py-12 md:py-20">
      <RevealOnScroll delay={0.1}>
        <div className="text-center mb-10 md:mb-14">
          <span className="text-[9px] font-semibold tracking-[0.4em] uppercase mb-4 block text-[var(--v2-gold)]">
            {t('shop_by_category')}
          </span>
          <h2 className="text-3xl md:text-5xl font-serif italic tracking-wide text-[var(--v2-text)]">
            {t('explore_categories') || 'Explore Our World'}
          </h2>
          <div className="w-24 h-px bg-[#c9a96e]/30 mx-auto mt-8" />
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {sections.map((section, index) => (
          <RevealOnScroll key={section.key} delay={0.2 + index * 0.15}>
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full"
            >
              <Link
                href={section.href}
                className="group relative block overflow-hidden rounded-[2rem] border transition-all duration-500 h-[320px] md:h-[400px]"
                style={{ backgroundColor: 'var(--v2-bg-card)', borderColor: section.borderColor }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = section.hoverBorderColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = section.borderColor}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-50`} />
                
                {/* Ambient glow */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: section.accentColor }}
                />

                {/* Decorative icon */}
                <div className="absolute top-6 right-8 mb-4 text-5xl transition-opacity duration-700 select-none" style={{ color: 'var(--v2-border-hover)', opacity: 0.5 }}>
                  {section.icon}
                </div>

                {/* Glass surface */}
                <div className="absolute inset-0 transition-colors duration-500 group-hover:bg-white/[0.02] backdrop-blur-[1px]" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-10">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase mb-3 transition-colors" style={{ color: section.textAccent }}>
                    {section.subtitle}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-serif mb-3 transition-colors text-[var(--v2-text)]">
                    {section.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6 max-w-xs transition-opacity duration-500 opacity-80 group-hover:opacity-100 text-[var(--v2-text-secondary)]">
                    {section.description}
                  </p>
                  <div className={`inline-flex items-center gap-2 self-start px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${section.btnBg}`} style={{ color: section.btnText }}>
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
