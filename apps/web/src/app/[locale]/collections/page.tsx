import React from 'react';
import Link from 'next/link';
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RevealOnScroll from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  title: "Fragrance Collections | L'Essence Luxury Perfumes",
  description: "Explore our curated scent collections, from fresh Citrus to deep Woody and romantic Floral fragrances.",
};

interface Props {
  params: { locale: string };
}

export default async function CollectionsPage({ params }: Props) {
  const { locale } = params;
  const supabase = createClient();
  const t = await getTranslations('common');
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <main className="bg-background-dark min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll delay={0.1}>
            <div className="text-center mb-16">
              <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2 block">{t('olfactory_families')}</span>
              <h1 className="text-5xl md:text-6xl font-sans text-white italic">{t('the_collections')}</h1>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories?.map((category) => {
              const name = locale === 'ar' ? (category.name_ar || category.name_en || category.name) : (category.name_en || category.name);
              const description = locale === 'ar' ? (category.description_ar || category.description_en || category.description) : (category.description_en || category.description);

              return (
                <RevealOnScroll key={category.id} delay={0.2}>
                  <Link
                    href={`/${locale}/collections/${category.slug}`}
                    className="group relative h-96 block overflow-hidden rounded-2xl border border-white/5 hover:border-primary/30 transition-all bg-surface-dark/40"
                  >
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-surface-dark to-black/20 flex items-center justify-center">
                        <span className="text-8xl opacity-10 grayscale group-hover:grayscale-0 transition-all duration-500">🌿</span>
                      </div>
                    )}

                    <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <h2 className="text-3xl font-sans text-white mb-2 group-hover:text-primary transition-colors">{name}</h2>
                      <p className="text-fg-muted text-sm mb-6 line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100 italic">
                        {description}
                      </p>
                      <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-[10px] rtl:flex-row-reverse">
                        {t('explore_collection')} <ChevronRight size={12} className="rtl:rotate-180" />
                      </div>
                    </div>
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
