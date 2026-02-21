"use client";
import { useHeroBanner } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const { banner, loading } = useHeroBanner(supabase);

  if (loading) return <div className="h-screen bg-background-dark animate-pulse" />;
  if (!banner) return null;

  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={banner.image_url} 
          alt={banner.title}
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="max-w-2xl bg-background-dark/30 p-8 backdrop-blur-sm rounded-lg border border-white/5">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
            {banner.badge_text}
          </span>
          <h1 className="text-5xl md:text-7xl font-display text-white mb-6 leading-tight">
            {banner.title}
            <span className="block text-primary italic text-3xl md:text-5xl mt-2">{banner.subtitle}</span>
          </h1>
          <p className="text-lg text-white/60 mb-10 leading-relaxed font-light">
            {banner.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/shop" className="bg-primary text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest flex items-center group hover:bg-white transition-all">
              {banner.cta_text}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
            <Link href="/shop" className="border border-white/20 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
              Discover Collections
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
