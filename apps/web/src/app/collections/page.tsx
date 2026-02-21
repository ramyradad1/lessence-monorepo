"use client";
/** Triggering new build for collections page */
import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function CollectionsPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <Sparkles className="w-16 h-16 text-primary mx-auto mb-8 animate-pulse" />
        <h1 className="text-5xl font-display text-white mb-6 uppercase tracking-widest">Collections</h1>
        <p className="text-white/40 max-w-2xl mx-auto mb-12 text-lg italic">
          "A curated selection of olfactory journeys, coming soon to L'Essence."
        </p>
        <Link 
          href="/shop" 
          className="inline-block bg-primary text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-primary/90 transition-all transform hover:scale-105"
        >
          Explore All Fragrances
        </Link>
      </div>
    </div>
  );
}
