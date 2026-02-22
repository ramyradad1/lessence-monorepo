import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import { PerformanceTracker } from "@/components/PerformanceTracker";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations('common');

  return (
    <main className="bg-background-dark min-h-screen">
      <PerformanceTracker actionName="home_load" />
      <Navbar />
      <Hero />
      <div className="bg-background-dark">
        <FeaturedProducts />
        <RecentlyViewed />

        {/* Luxury Quote Section */}
        <section className="py-32 border-y border-white/5">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-primary text-xs font-bold tracking-widest uppercase mb-6 block">{t('philosophy')}</span>
            <h2 className="text-3xl md:text-5xl font-display text-white leading-tight italic">
              {t('luxury_quote')}
            </h2>
            <div className="mt-8 h-px w-24 bg-primary/30 mx-auto" />
          </div>
        </section>

        {/* Discovery Section */}
        <section className="py-24 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square">
              <img
                src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1974&auto=format&fit=crop"
                alt="Craftsmanship"
                className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute -bottom-6 -right-6 w-48 h-48 border border-primary/20 rounded-2xl -z-10" />
            </div>
            <div className="pl-0 md:pl-12">
              <h2 className="text-4xl font-display text-white mb-6">{t('artisanal_extraction')}</h2>
              <p className="text-white/40 leading-relaxed mb-8 font-light italic">
                {t('extraction_description')}
              </p>
              <button className="text-primary border-b border-primary/30 pb-2 font-bold uppercase tracking-widest text-xs hover:border-primary transition-all">
                {t('learn_about_process')}
              </button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
