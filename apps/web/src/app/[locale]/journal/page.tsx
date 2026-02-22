"use client";
import React from 'react';
import Navbar from "@/components/Navbar";

export default function JournalPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-display text-white mb-12 uppercase tracking-widest text-center">Journal</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <div className="h-64 bg-white/5 animate-pulse" />
              <div className="p-8">
                <div className="text-xs text-primary uppercase tracking-widest mb-4">Olfactory Notes</div>
                <h3 className="text-xl font-medium text-white mb-4 group-hover:text-primary transition-colors">The Art of Layering</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">Discover the hidden secrets of mixing rare essences to create your own signature trail...</p>
                <span className="text-xs text-white/20">Coming Spring 2024</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </>
  );
}
