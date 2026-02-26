import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryFilter from "@/components/CategoryFilter";
import PromoBanner from "@/components/PromoBanner";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { PerformanceTracker } from "@/components/PerformanceTracker";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations('common');

  return (
    <main className="bg-gradient-page min-h-screen text-fg font-sans">
      <PerformanceTracker actionName="home_load" />
      <Navbar />
      <div className="w-full relative overflow-x-hidden flex flex-col items-center">
        <ScrollReveal className="w-full">
          <Hero />
        </ScrollReveal>

        <ScrollReveal className="w-full" delayClass="reveal-delay-1">
          <CategoryFilter />
        </ScrollReveal>

        <ScrollReveal className="w-full" delayClass="reveal-delay-2">
          <FeaturedProducts />
        </ScrollReveal>

        <ScrollReveal className="w-full" delayClass="reveal-delay-1">
          <PromoBanner />
        </ScrollReveal>

        <ScrollReveal className="w-full" delayClass="reveal-delay-2">
          <RecentlyViewed />
        </ScrollReveal>

        {/* Luxury Quote Section */}
        <ScrollReveal className="w-full">
          <section className="relative w-full py-28 md:py-40">
            {/* Top divider */}
            <div className="section-divider mb-16 md:mb-20" />

            <div className="max-w-4xl mx-auto px-4 text-center">
              <span className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-8 block animate-fade-in">
                {t('philosophy')}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-fg leading-tight italic text-shimmer">
                {t('luxury_quote')}
              </h2>
              <div className="section-divider mt-12" />
            </div>

            {/* Decorative ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
          </section>
        </ScrollReveal>

        <ScrollReveal className="w-full">
          <Footer />
        </ScrollReveal>
      </div>
    </main>
  );
}
