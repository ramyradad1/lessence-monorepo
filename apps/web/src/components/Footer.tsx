"use client";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background-dark border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-display text-primary uppercase tracking-widest mb-6">L&apos;Essence</h2>
            <p className="text-white/40 leading-relaxed mb-6 font-light">
              Crafting olfactory experiences that transcend time. Luxury fragrances for the modern connoisseur.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="p-2 bg-white/5 rounded-full text-white/60 hover:text-primary transition-colors"><Instagram size={18} /></Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full text-white/60 hover:text-primary transition-colors"><Facebook size={18} /></Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full text-white/60 hover:text-primary transition-colors"><Twitter size={18} /></Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Collection</h4>
            <ul className="space-y-4 text-white/40 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Signature Scents</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Limited Edition</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Discovery Sets</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Home Fragrance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Concierge</h4>
            <ul className="space-y-4 text-white/40 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Track Your Order</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Expert</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Newsletter</h4>
            <p className="text-white/40 text-sm mb-4">Join our inner circle for exclusive previews.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
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
            © 2026 L&apos;ESSENCE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex space-x-8 text-white/20 text-[10px] uppercase tracking-widest">
            <Link href="#" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
