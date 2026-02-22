"use client";
import { Link } from "@/navigation";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="bg-background-dark border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="mb-6">
              <img src="/logo.png" alt="L'Essence" className="h-10 w-auto object-contain" />
            </div>

            <p className="text-white/40 leading-relaxed mb-6 font-light">
              {t('footer_description')}
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="p-2 bg-white/5 rounded-full text-white/60 hover:text-primary transition-colors"><Instagram size={18} /></Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full text-white/60 hover:text-primary transition-colors"><Facebook size={18} /></Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full text-white/60 hover:text-primary transition-colors"><Twitter size={18} /></Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">{t('collection')}</h4>
            <ul className="space-y-4 text-white/40 text-sm">
              <li><Link href="/shop" className="hover:text-primary transition-colors">{t('signature_scents')}</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">{t('limited_edition')}</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">{t('discovery_sets')}</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">{t('home_fragrance')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">{t('concierge')}</h4>
            <ul className="space-y-4 text-white/40 text-sm">
              <li><Link href="/profile" className="hover:text-primary transition-colors">{t('track_your_order')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{t('shipping_returns')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{t('contact_expert')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{t('faq')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">{t('newsletter')}</h4>
            <p className="text-white/40 text-sm mb-4">{t('newsletter_description')}</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder={t('newsletter_placeholder')}
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
              />
              <button aria-label="Subscribe to newsletter" title="Subscribe" className="absolute right-2 top-1.5 p-1.5 text-primary">
                <Mail size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-[10px] uppercase tracking-widest">
            {t('all_rights_reserved')}
          </p>
          <div className="flex space-x-8 text-white/20 text-[10px] uppercase tracking-widest">
            <Link href="/about" className="hover:text-white/40 transition-colors">{t('privacy_policy')}</Link>
            <Link href="/about" className="hover:text-white/40 transition-colors">{t('terms_of_service')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
