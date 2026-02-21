"use client";
import Link from "next/link";
import { ShoppingBag, Search, User, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();

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
