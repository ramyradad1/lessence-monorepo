import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import CollectionProductGrid from "./CollectionProductGrid";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  const supabase = createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, name_en, name_ar, description, description_en, description_ar")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "Category Not Found | L'Essence" };

  const name = locale === 'ar' ? (category.name_ar || category.name_en || category.name) : (category.name_en || category.name);
  const description = locale === 'ar' ? (category.description_ar || category.description_en || category.description) : (category.description_en || category.description);

  return {
    title: `${name} Collection | Luxury Fragrances | L'Essence`,
    description: description,
    openGraph: {
      title: `${name} Collection | L'Essence`,
      description: description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = params;
  const supabase = createClient();
  const t = await getTranslations('common');
  
  // Fetch Category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) {
    notFound();
  }

  // Fetch Products in this Category
  const { data: products } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const name = locale === 'ar' ? (category.name_ar || category.name_en || category.name) : (category.name_en || category.name);
  const description = locale === 'ar' ? (category.description_ar || category.description_en || category.description) : (category.description_en || category.description);

  return (
    <main className="bg-background-dark min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-fg-faint mb-8 rtl:flex-row-reverse">
            <a href={`/${locale}`} className="hover:text-white transition-colors">{t('home')}</a>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <a href={`/${locale}/collections`} className="hover:text-white transition-colors">{t('collections')}</a>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="text-fg-muted">{name}</span>
          </div>

          <div className="mb-12">
            <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2 block">{t('scent_collection')}</span>
            <h1 className="text-5xl font-sans text-white mb-4 italic">{name}</h1>
            {description && (
              <p className="text-fg-muted max-w-2xl text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {!products || products.length === 0 ? (
            <div className="py-20 text-center border border-white/5 rounded-2xl bg-surface-dark/20">
              <p className="text-fg-faint italic">{t('no_fragrances_in_collection')}</p>
              <a href={`/${locale}/shop`} className="text-primary hover:text-white underline text-xs font-bold tracking-widest uppercase mt-4 inline-block transition-colors">
                {t('explore_all_scents')}
              </a>
            </div>
          ) : (
              <CollectionProductGrid products={products} />
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
