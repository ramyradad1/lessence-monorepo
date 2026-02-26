"use client";
import React from 'react';
import Navbar from "@/components/Navbar";
import RevealOnScroll from "@/components/RevealOnScroll";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-sans text-white mb-12 uppercase tracking-widest text-center">Our Story</h1>
        <div className="space-y-8 text-white/70 leading-relaxed text-lg text-center font-light">
            <RevealOnScroll delay={0.2}>
              <p>
                Born from a passion for the rarest essences, L&apos;Essence is more than a perfume house.
                It is a sanctuary for scent-seekers and a tribute to the art of fine perfumery.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.4}>
              <div className="h-px w-32 bg-primary/20 mx-auto my-12" />
            </RevealOnScroll>
            <RevealOnScroll delay={0.6}>
              <p>
                Every fragrance in our collection is a chapter of a story untold,
                crafted with precision and a commitment to timeless elegance.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.8}>
              <p className="italic text-primary/60">&ldquo;Elegance is the only beauty that never fades.&rdquo;</p>
            </RevealOnScroll>
        </div>
        </div>
      </div>
    </>
  );
}
