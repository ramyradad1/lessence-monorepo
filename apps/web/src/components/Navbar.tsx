"use client";
import Link from "next/link";
import { ShoppingBag, Search, User, Menu, Bell, TrendingDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@lessence/supabase";
import { useAuth } from "@lessence/supabase";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

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
        aria-label="Notifications"
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
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-primary hover:text-white transition-colors uppercase tracking-widest"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} className="text-white/10" />
                <p className="text-white/40 text-xs uppercase tracking-widest">No notifications yet</p>
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

  return (
    <nav className="fixed top-0 w-full z-40 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-display tracking-widest text-primary uppercase">
          L&apos;Essence <span className="text-[8px] opacity-20">v1.0.2</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8 text-white/70">
          <Link href="/shop" className="hover:text-primary transition-colors">Fragrances</Link>
          <Link href="/collections" className="hover:text-primary transition-colors">Collections</Link>
          <Link href="/about" className="hover:text-primary transition-colors">Our Story</Link>
          <Link href="/journal" className="hover:text-primary transition-colors">Journal</Link>
        </div>

        <div className="flex items-center space-x-5 text-white">
          <Link href="/shop" className="hover:text-primary transition-colors" aria-label="Search"><Search size={22} /></Link>
          <Link href="/profile" className="hover:text-primary transition-colors" aria-label="Account"><User size={22} /></Link>

          {/* Bell – only when logged in */}
          {user && <NotificationBell userId={user.id} />}

          <button onClick={() => setIsCartOpen(true)} className="relative hover:text-primary transition-colors" aria-label="Shopping bag">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden hover:text-primary transition-colors" aria-label="Menu"><Menu size={22} /></button>
        </div>
      </div>
    </nav>
  );
}
