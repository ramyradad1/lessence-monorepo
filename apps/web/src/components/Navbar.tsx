"use client";
import { Link, usePathname, useRouter } from "@/navigation";

import { ShoppingBag, Search, User, Menu, Bell, TrendingDown, X, Globe } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@lessence/supabase";
import { useAuth } from "@lessence/supabase";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';
import Image from "next/image";
import { useCollections, useCategories } from '@lessence/supabase';
import { motion } from "framer-motion";

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
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
        className="relative p-2 rounded-full hover:bg-white/5 transition-all duration-300 hover:text-primary"
        aria-label={t('notifications')}
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 glass-card-v2 rounded-2xl shadow-warm-lg overflow-hidden z-50">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-fg uppercase tracking-[0.2em]">{t('notifications')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-[10px] text-primary hover:text-primary-light transition-colors uppercase tracking-widest"
              >
                {t('mark_all_read')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Bell size={24} className="text-fg-faint/30" strokeWidth={1.5} />
                <p className="text-fg-faint text-[10px] uppercase tracking-[0.2em]">{t('no_notifications')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-all duration-300 ${!n.is_read ? "bg-primary/[0.04] border-l-2 border-primary" : ""}`}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'back_in_stock' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                      }`}>
                      {n.type === 'back_in_stock'
                        ? <Bell size={13} className="text-blue-400" strokeWidth={1.5} />
                        : <TrendingDown size={13} className="text-emerald-400" strokeWidth={1.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${!n.is_read ? "text-fg font-medium" : "text-fg-muted"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-fg-faint mt-0.5 leading-snug">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {n.type === 'price_drop' && n.data?.new_price && (
                          <>
                            <span className="text-[10px] text-emerald-500 font-bold">
                              {formatCurrency(n.data.new_price, locale)}
                            </span>
                            <span className="text-[10px] text-fg-faint line-through">
                              {formatCurrency(n.data.old_price, locale)}
                            </span>
                          </>
                        )}
                        <span className={`text-[10px] text-fg-faint ${n.type !== 'price_drop' || !n.data?.new_price ? '' : 'ml-auto'}`}>
                          {n.created_at ? formatRelativeTime(n.created_at) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  // Fetch dynamic entities
  const { collections } = useCollections(supabase);
  const { categories } = useCategories(supabase);

  // Close menu on navigation
  const closeMenu = () => setIsMenuOpen(false);

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Build dynamic navigation items based on active entities in db
  const dynNavLinks = [
    { name: t('fragrances'), href: "/shop" },
    ...categories.map(c => ({
      name: locale === 'ar' && c.name_ar ? c.name_ar : c.name_en || c.name,
      href: `/shop?category=${c.slug}`
    })),
    { name: t('collections'), href: "/collections" },
    ...collections.filter(c => c.show_on_homepage).map(c => ({
      name: locale === 'ar' && c.name_ar ? c.name_ar : c.name_en,
      href: `/collections/${c.slug}`
    })),
    { name: t('our_story'), href: "/about" },
    { name: t('journal'), href: "/journal" },
  ];

  // Split nav links for symmetric desktop layout
  const leftNavLinks = [
    { name: t('fragrances'), href: "/shop" },
    { name: t('collections'), href: "/collections" },
  ];

  const rightNavLinks = [
    { name: t('our_story'), href: "/about" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-[100] navbar-glass">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* Left Section — Nav Links (Desktop) / Hamburger (Mobile) */}
            <div className="flex-1 flex items-center gap-1">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden flex items-center justify-center p-2.5 rounded-full hover:bg-white/5 transition-all duration-300 text-fg"
                aria-label={isMenuOpen ? t('close') : t('menu')}
              >
                {isMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
              </button>

              <div className="hidden lg:flex items-center gap-10">
                {leftNavLinks.map((link) => (
                  <Link
                    key={link.href + link.name}
                    href={link.href}
                    className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted hover:text-fg transition-colors duration-300 py-1 group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-500 group-hover:w-full" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Center — Logo */}
            <div className="flex items-center justify-center">
              <Link href="/" onClick={closeMenu} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut"
                    }}
                  >
                    <Image
                      src="/logo.png"
                      alt="L'Essence Logo"
                      width={56}
                      height={56}
                      className="object-contain h-10 w-auto md:h-12"
                      priority
                    />
                  </motion.div>
                </motion.div>
              </Link>
            </div>

            {/* Right Section — Nav Links + Actions */}
            <div className="flex-1 flex items-center justify-end gap-1 md:gap-2">
              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-10 mr-8">
                {rightNavLinks.map((link) => (
                  <Link
                    key={link.href + link.name}
                    href={link.href}
                    className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted hover:text-fg transition-colors duration-300 py-1 group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-500 group-hover:w-full" />
                  </Link>
                ))}
              </div>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all duration-300 text-fg-muted hover:text-fg"
                aria-label="Switch Language"
              >
                <Globe size={16} strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{locale === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              {/* Search */}
              <Link href="/shop" className="p-2 rounded-full hover:bg-white/5 transition-all duration-300 text-fg-muted hover:text-fg" aria-label={t('search')}>
                <Search size={20} strokeWidth={1.5} />
              </Link>

              {/* Profile */}
              <Link href="/profile" className="hidden sm:flex p-2 rounded-full hover:bg-white/5 transition-all duration-300 text-fg-muted hover:text-fg" aria-label={t('profile')}>
                <User size={20} strokeWidth={1.5} />
              </Link>

              {/* Bell – only when logged in */}
              {user && <NotificationBell userId={user.id} />}

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-full hover:bg-white/5 transition-all duration-300 text-fg-muted hover:text-fg"
                aria-label={t('your_bag')}
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30 animate-ping"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-3.5 w-3.5 bg-primary text-[8px] font-bold text-background-dark">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[90] md:hidden transition-all duration-500 ease-in-out bg-menu-gradient ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-6 px-4 overflow-y-auto w-full pt-20">
          {dynNavLinks.map((link, index) => (
            <Link
              key={link.href + link.name}
              href={link.href}
              onClick={closeMenu}
              className={`text-xl font-sans tracking-[0.15em] text-fg-muted hover:text-primary transition-all duration-500 uppercase transform ${isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              {link.name}
            </Link>
          ))}

          {/* Animated divider */}
          <div className={`section-divider my-4 transition-all duration-700 delay-500 ${isMenuOpen ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />

          <div className={`flex gap-12 transition-all duration-500 delay-500 ${isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}>
            <Link href="/shop" onClick={closeMenu} className="text-fg-faint hover:text-primary transition-all duration-300 flex flex-col items-center gap-2.5">
              <Search size={22} strokeWidth={1.5} />
              <span className="text-[9px] uppercase tracking-[0.2em]">{t('search')}</span>
            </Link>
            <Link href="/profile" className="text-fg-faint hover:text-primary transition-all duration-300 flex flex-col items-center gap-2.5">
              <User size={22} strokeWidth={1.5} />
              <span className="text-[9px] uppercase tracking-[0.2em]">{t('profile')}</span>
            </Link>
          </div>

          <button
            onClick={toggleLanguage}
            className={`mt-4 px-8 py-2.5 rounded-full border border-primary/30 text-primary font-semibold uppercase tracking-[0.15em] text-xs transition-all duration-500 delay-700 hover:bg-primary/10 hover:border-primary/50 ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[60%] pointer-events-none z-[-1]">
          <div className="w-full h-full bg-primary/[0.03] rounded-full blur-[120px]" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[30%] pointer-events-none z-[-1]">
          <div className="w-full h-full bg-primary/[0.02] rounded-full blur-[80px]" />
        </div>
      </div>
    </>
  );
}
