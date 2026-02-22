"use client";
import { Link, usePathname, useRouter } from "@/navigation";
import Image from "next/image";

import { ShoppingBag, Search, User, Menu, Bell, TrendingDown, X, Globe } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@lessence/supabase";
import { useAuth } from "@lessence/supabase";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslations, useLocale } from 'next-intl';

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
        className="relative hover:text-primary transition-colors focus:outline-none"
        aria-label={t('notifications')}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-[#1a1812] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('notifications')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-[10px] text-primary hover:text-white transition-colors uppercase tracking-widest"
              >
                {t('mark_all_read')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} className="text-white/10" />
                <p className="text-white/40 text-xs uppercase tracking-widest">{t('no_notifications')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${!n.is_read ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'back_in_stock' ? 'bg-blue-500/15' : 'bg-green-500/15'
                      }`}>
                      {n.type === 'back_in_stock'
                        ? <Bell size={13} className="text-blue-400" />
                        : <TrendingDown size={13} className="text-green-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${!n.is_read ? "text-white font-semibold" : "text-white/75"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {n.type === 'price_drop' && n.data?.new_price && (
                          <>
                            <span className="text-[10px] text-green-400 font-bold">
                              ${n.data.new_price}
                            </span>
                            <span className="text-[10px] text-white/30 line-through">
                              ${n.data.old_price}
                            </span>
                          </>
                        )}
                        <span className={`text-[10px] text-white/30 ${n.type !== 'price_drop' || !n.data?.new_price ? '' : 'ml-auto'}`}>
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

  const navLinks = [
    { name: t('fragrances'), href: "/shop" },
    { name: t('collections'), href: "/collections" },
    { name: t('our_story'), href: "/about" },
    { name: t('journal'), href: "/journal" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-[100] bg-background-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" onClick={closeMenu} className="relative w-40 h-12 z-[110]">
            <Image src="/logo.png" alt="L'Essence" fill className="object-contain" />

          </Link>


          <div className="hidden md:flex items-center space-x-8 text-white/70">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-5 text-white">
            <button
              onClick={toggleLanguage}
              className="hover:text-primary transition-colors flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10"
              aria-label="Switch Language"
            >
              <Globe size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{locale === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            <Link href="/shop" className="hover:text-primary transition-colors hidden sm:block" aria-label={t('search')}>
              <Search size={22} />
            </Link>
            <Link href="/profile" onClick={closeMenu} className="hover:text-primary transition-colors" aria-label={t('profile')}>
              <User size={22} />
            </Link>

            {/* Bell – only when logged in */}
            {user && <NotificationBell userId={user.id} />}

            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-primary transition-colors" aria-label={t('your_bag')}>
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:text-primary transition-colors z-[110]"
              aria-label={isMenuOpen ? t('close') : t('search')}
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[90] md:hidden bg-[#12100a] transition-all duration-500 ease-in-out ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-10 px-4">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={`text-3xl font-display tracking-[0.2em] text-white hover:text-primary transition-all duration-300 uppercase transform ${isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {link.name}
            </Link>
          ))}
          <div className={`pt-10 flex space-x-10 transition-all duration-500 delay-500 ${isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}>
            <Link href="/shop" onClick={closeMenu} className="text-white/40 hover:text-primary transition-colors flex flex-col items-center gap-2">
              <Search size={24} />
              <span className="text-[10px] uppercase tracking-widest">{t('search')}</span>
            </Link>
            <Link href="/profile" onClick={closeMenu} className="text-white/40 hover:text-primary transition-colors flex flex-col items-center gap-2">
              <User size={24} />
              <span className="text-[10px] uppercase tracking-widest">{t('profile')}</span>
            </Link>
          </div>

          <button
            onClick={toggleLanguage}
            className={`mt-4 px-6 py-2 rounded-full border border-primary text-primary font-bold uppercase tracking-widest text-xs transition-all duration-500 delay-700 ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] pointer-events-none z-[-1]">
          <div className="w-full h-full bg-primary/5 rounded-full blur-[100px]" />
        </div>
      </div>
    </>
  );
}
