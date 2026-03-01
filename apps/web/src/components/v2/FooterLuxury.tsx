"use client";

import React from "react";
import { Link } from "@/navigation";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCategories } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";

export default function FooterLuxury() {
  const t = useTranslations('common');
  const { categories } = useCategories(supabase);
  const d = new Date().getFullYear();

  return (
    <footer
      className="w-full pt-20 pb-8 relative overflow-hidden"
      style={{ backgroundColor: 'var(--v2-bg)', borderTop: '1px solid var(--v2-border)', color: 'var(--v2-text)' }}
    >
      {/* Glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 rounded-full blur-[100px] pointer-events-none bg-[var(--v2-section-glow)]" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-10">
        <div className="md:col-span-1">
          <Link href="/v2" className="block text-2xl font-serif tracking-[0.25em] mb-4 text-[var(--v2-text)]">L&apos;ESSENCE</Link>
          <p className="text-[11px] leading-loose mb-6 text-[var(--v2-text-faint)]">
            {t('footer_tagline') || 'Crafting elegant, timeless scents for the modern aesthete. Experience true luxury in every drop.'}
          </p>
          <div className="flex gap-4">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a key={i} href="#" aria-label={Icon.displayName || 'social'} className="p-2 rounded-full transition-colors" style={{ color: 'var(--v2-text-secondary)', border: '1px solid var(--v2-border)' }}>
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-serif tracking-widest uppercase text-sm mb-6 text-[var(--v2-gold-text)]">{t('explore')}</h4>
          <ul className="space-y-4 flex flex-col">
            <li><Link href="/v2/shop" className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">{t('all_scents')}</Link></li>
            {categories?.slice(0, 4).map((category) => (
              <li key={category.id}>
                <Link href={`/v2/shop?category=${category.slug}`} className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">
                  {category.name}
                </Link>
              </li>
            ))}
            <li><Link href="/v2/collections" className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">{t('collections')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif tracking-widest uppercase text-sm mb-6 text-[var(--v2-gold-text)]">{t('support')}</h4>
          <ul className="space-y-4 flex flex-col">
            <li><Link href="/v2/about" className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">{t('our_story')}</Link></li>
            <li><Link href="/faq" className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">{t('faq')}</Link></li>
            <li><Link href="/shipping" className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">{t('shipping')}</Link></li>
            <li><Link href="/contact" className="text-xs uppercase tracking-wider transition-colors text-[var(--v2-text-faint)]">{t('contact')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif tracking-widest uppercase text-sm mb-6 text-[var(--v2-gold-text)]">{t('newsletter_title') || 'Newsletter'}</h4>
          <p className="text-[11px] mb-4 text-[var(--v2-text-faint)]">{t('newsletter_desc') || 'Subscribe to receive exclusive offers and updates.'}</p>
          <div className="flex pb-2 focus-within:border-primary transition-colors" style={{ borderBottom: '1px solid var(--v2-border-hover)' }}>
            <input 
              type="email" 
              placeholder={t('email_placeholder') || 'YOUR EMAIL'} 
              className="bg-transparent border-none outline-none w-full text-xs tracking-widest uppercase"
              style={{ color: 'var(--v2-text)', '--tw-placeholder-opacity': 1 } as React.CSSProperties}
            />
            <button className="text-[10px] uppercase font-bold tracking-widest transition-colors text-[var(--v2-gold-text)]">
              {t('subscribe') || 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10 border-t border-[var(--v2-border)]">
        <p className="text-[10px] tracking-widest uppercase text-[var(--v2-text-faint)]">&copy; {d} L&apos;ESSENCE. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[10px] tracking-widest uppercase transition-colors text-[var(--v2-text-faint)]">Privacy Policy</Link>
          <Link href="/terms" className="text-[10px] tracking-widest uppercase transition-colors text-[var(--v2-text-faint)]">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
