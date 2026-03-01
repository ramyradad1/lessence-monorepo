"use client";
import React, { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/navigation";
import { Menu, Search, ShoppingBag, User, Globe, Bell, TrendingDown, X, Sun, Moon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth, useNotifications, useCollections, useCategories } from "@lessence/supabase";
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from "@/lib/supabase";
import { formatCurrency } from '@lessence/core';
import { motion, AnimatePresence } from "framer-motion";
import { useV2Theme } from "./V2ThemeProvider";

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations('common');
  const locale = useLocale();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(supabase, userId);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full transition-all duration-300 text-[var(--v2-text-secondary)]"
        aria-label={t('notifications')}
      >
        <Bell size={18} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[var(--v2-gold)]"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--v2-gold)]"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl text-left bg-[var(--v2-bg-glass)] border border-[var(--v2-border)]"
          >
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--v2-border-subtle)' }}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--v2-text)]">{t('notifications')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-[9px] uppercase tracking-widest font-bold transition-colors text-[var(--v2-gold-text)]"
                >
                  {t('mark_all_read')}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto" style={{ borderColor: 'var(--v2-border-subtle)' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Bell size={20} strokeWidth={1.5} style={{ color: 'var(--v2-text-faint)' }} />
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--v2-text-faint)]">{t('no_notifications')}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-5 py-4 cursor-pointer transition-all duration-300"
                    style={{ backgroundColor: !n.is_read ? 'var(--v2-gold-glow)' : 'transparent' }}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'back_in_stock' ? 'bg-blue-500/10' : ''}`} style={n.type !== 'back_in_stock' ? { backgroundColor: 'var(--v2-gold-glow)' } : {}}>
                        {n.type === 'back_in_stock'
                          ? <Bell size={12} className="text-blue-400" strokeWidth={1.5} />
                          : <TrendingDown size={12} style={{ color: 'var(--v2-gold-text)' }} strokeWidth={1.5} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-snug" style={{ color: !n.is_read ? 'var(--v2-text)' : 'var(--v2-text-secondary)', fontWeight: !n.is_read ? 500 : 400 }}>
                          {n.title}
                        </p>
                        <p className="text-[10px] mt-1 leading-relaxed text-[var(--v2-text-faint)]">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {n.type === 'price_drop' && n.data?.new_price && (
                            <>
                              <span className="text-[10px] font-bold text-[var(--v2-gold-text)]">
                                {formatCurrency(n.data.new_price, locale)}
                              </span>
                              <span className="text-[10px] line-through text-[var(--v2-text-faint)]">
                                {formatCurrency(n.data.old_price, locale)}
                              </span>
                            </>
                          )}
                          <span className="text-[9px] ml-auto uppercase tracking-tighter font-mono text-[var(--v2-text-faint)]">
                            {n.created_at ? formatRelativeTime(n.created_at) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NavbarLuxury() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useV2Theme();

  const { collections } = useCollections(supabase);
  const { categories } = useCategories(supabase);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  const filteredCategories = categories?.filter((c: { slug: string; id: string; name_en?: string; name?: string }) => c.slug !== 'all' && c.id !== 'all' && !(c.name_en && c.name_en.toLowerCase().includes('all scents')));

  const navLinks = [
    { name: t('all_scents'), href: "/v2/shop" },
    ...(filteredCategories?.slice(0, 2).map((c: { slug: string; id: string; name_en?: string; name?: string }) => ({ name: c.name_en || c.name, href: `/v2/shop?category=${c.slug}` })) || []),
    ...(collections?.slice(0, 1).map(c => ({ name: (c as { name_en?: string; title?: string }).name_en || (c as { name_en?: string; title?: string }).title || 'Collection', href: `/v2/collections#${c.slug}` })) || []),
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled ? 'backdrop-blur-md py-3' : 'bg-transparent border-transparent py-6'}`}
      style={scrolled ? { backgroundColor: 'var(--v2-bg-glass)', borderColor: 'var(--v2-border)' } : {}}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Left: Mobile Menu & Desktop Links */}
        <div className="flex-1 flex items-center gap-4 lg:gap-6">
          <button 
            aria-label="Open menu" 
            className="hover:text-primary transition-colors lg:hidden text-[var(--v2-text)]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu strokeWidth={1} />}
          </button>
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-[10px] font-semibold tracking-[0.2em] hover:text-primary uppercase transition-colors relative group text-[var(--v2-text-secondary)]"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* Center: Brand Logo */}
        <div className="flex-shrink-0 text-center">
          <Link href="/v2" className="block text-2xl md:text-3xl font-serif tracking-[0.25em] relative group text-[var(--v2-text)]">
            L&apos;ESSENCE
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-500" />
          </Link>
          <span className="block text-[8px] tracking-[0.4em] uppercase mt-1 text-[var(--v2-gold-text)]">Luxury Fragrances</span>
        </div>

        {/* Right: Icons */}
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-300 text-[var(--v2-text-secondary)]"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-300 text-[var(--v2-text-secondary)]"
            aria-label="Switch Language"
          >
            <Globe size={16} strokeWidth={1.5} />
            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{locale === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          <button aria-label="Search" className="transition-colors text-[var(--v2-text-secondary)]">
            <Search size={18} strokeWidth={1.5} />
          </button>
          
          <Link href="/v2/profile" className="hidden sm:block transition-colors text-[var(--v2-text-secondary)]">
            <User size={18} strokeWidth={1.5} />
          </Link>

          {user && <NotificationBell userId={user.id} />}

          <button 
            onClick={() => setIsCartOpen(true)}
            className="transition-colors relative p-1 text-[var(--v2-text-secondary)]"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: 'var(--v2-gold)', color: 'var(--v2-text-inverted)' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu Backdrop & Content */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] lg:hidden backdrop-blur-2xl px-6 pt-24 bg-[var(--v2-bg-overlay)]"
            >
              <div className="flex flex-col gap-8 text-left">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      href={link.href} 
                      onClick={() => setIsMenuOpen(false)}
                      className="text-2xl font-serif tracking-widest hover:text-primary uppercase text-[var(--v2-text)]"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="w-full h-px my-4 bg-[var(--v2-border)]" />
                
                <div className="flex flex-col gap-6">
                  <Link href="/v2/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-[var(--v2-text-secondary)]">
                    <User size={20} />
                    <span className="text-sm uppercase tracking-widest">{t('profile')}</span>
                  </Link>
                  <button onClick={() => { toggleLanguage(); setIsMenuOpen(false); }} className="flex items-center gap-4 text-[var(--v2-text-secondary)]">
                    <Globe size={20} />
                    <span className="text-sm uppercase tracking-widest">{locale === 'ar' ? 'English' : 'العربية'}</span>
                  </button>
                  <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="flex items-center gap-4 text-[var(--v2-text-secondary)]">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="text-sm uppercase tracking-widest">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </nav>
  );
}
