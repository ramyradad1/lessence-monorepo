"use client";
import { Link } from "@/navigation";
import { Facebook, Instagram, Twitter, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useStoreSettings } from "@/context/StoreSettingsContext";


export default function Footer() {
  const t = useTranslations('common');
  const { settings } = useStoreSettings();

  return (
    <footer className="relative bg-background-deep border-t border-white/[0.04]">
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <div className="section-divider max-w-full mx-auto" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          {/* Brand Column — Centered on mobile */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-6">
              <Image src="/logo.png" alt="L'Essence" width={180} height={50} className="object-contain" />
            </div>

            <p className="text-fg-faint leading-relaxed mb-8 font-light text-sm max-w-xs">
              {t('footer_description')}
            </p>

            {/* Social Icons */}
            <div className="flex space-x-3">
              {settings.identity.social_links.instagram && (
                <Link
                  href={settings.identity.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white/[0.03] rounded-full text-fg-faint hover:text-primary hover:bg-primary/10 transition-all duration-300 border border-white/[0.04] hover:border-primary/20"
                >
                  <Instagram size={16} strokeWidth={1.5} />
                </Link>
              )}
              {settings.identity.social_links.facebook && (
                <Link
                  href={settings.identity.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white/[0.03] rounded-full text-fg-faint hover:text-primary hover:bg-primary/10 transition-all duration-300 border border-white/[0.04] hover:border-primary/20"
                >
                  <Facebook size={16} strokeWidth={1.5} />
                </Link>
              )}
              {settings.identity.social_links.tiktok && (
                <Link
                  href={settings.identity.social_links.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white/[0.03] rounded-full text-fg-faint hover:text-primary hover:bg-primary/10 transition-all duration-300 border border-white/[0.04] hover:border-primary/20"
                >
                  <Twitter size={16} strokeWidth={1.5} />
                </Link>
              )}
            </div>
          </div>

          {/* Collection Links */}
          <div className="text-center md:text-left">
            <h4 className="text-fg font-semibold uppercase tracking-[0.2em] text-[11px] mb-6">{t('collection')}</h4>
            <ul className="space-y-4 text-fg-faint text-sm">
              <li><Link href="/shop" className="hover:text-primary transition-colors duration-300 font-light">{t('signature_scents')}</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors duration-300 font-light">{t('limited_edition')}</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors duration-300 font-light">{t('discovery_sets')}</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors duration-300 font-light">{t('home_fragrance')}</Link></li>
            </ul>
          </div>

          {/* Concierge Links */}
          <div className="text-center md:text-left">
            <h4 className="text-fg font-semibold uppercase tracking-[0.2em] text-[11px] mb-6">{t('concierge')}</h4>
            <ul className="space-y-4 text-fg-faint text-sm">
              <li><Link href="/profile" className="hover:text-primary transition-colors duration-300 font-light">{t('track_your_order')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors duration-300 font-light">{t('shipping_returns')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors duration-300 font-light">{t('contact_expert')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors duration-300 font-light">{t('faq')}</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center md:text-left">
            <h4 className="text-fg font-semibold uppercase tracking-[0.2em] text-[11px] mb-6">{t('newsletter')}</h4>
            <p className="text-fg-faint text-sm mb-6 font-light leading-relaxed">{t('newsletter_description')}</p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder={t('newsletter_placeholder')}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-full px-6 py-3.5 text-xs text-fg placeholder:text-fg-faint/50 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all duration-300"
              />
              <button aria-label="Subscribe to newsletter" title="Subscribe" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-fg-faint hover:text-primary transition-colors duration-300">
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-fg-faint text-[10px] uppercase tracking-[0.2em]">
            {t('all_rights_reserved')}
          </p>
          <div className="flex space-x-8 text-fg-faint text-[10px] uppercase tracking-[0.2em]">
            <Link href="/about" className="hover:text-fg transition-colors duration-300">{t('privacy_policy')}</Link>
            <Link href="/about" className="hover:text-fg transition-colors duration-300">{t('terms_of_service')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
