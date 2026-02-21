import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", params.slug)
    .single();

  if (!category) return { title: "Category Not Found | L'Essence" };

  return {
    title: `${category.name} Collection | Luxury Fragrances | L'Essence`,
    description: category.description,
    openGraph: {
      title: `${category.name} Collection | L'Essence`,
      description: category.description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const supabase = createClient();
  
  // Fetch Category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!category) {
    notFound();
  }

  // Fetch Products in this Category
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <main className="bg-background-dark min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/30 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
            <ChevronRight size={12} />
            <span className="text-white/60">{category.name}</span>
          </div>

          <div className="mb-12">
            <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2 block">Scent Collection</span>
            <h1 className="text-5xl font-display text-white mb-4 italic">{category.name}</h1>
            {category.description && (
              <p className="text-white/50 max-w-2xl text-lg leading-relaxed">
                {category.description}
              </p>
            )}
          </div>

          {!products || products.length === 0 ? (
            <div className="py-20 text-center border border-white/5 rounded-2xl bg-surface-dark/20">
              <p className="text-white/30 italic">No fragrances found in this collection yet.</p>
              <Link href="/shop" className="text-primary hover:text-white underline text-xs font-bold tracking-widest uppercase mt-4 inline-block transition-colors">
                Explore All Scents
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
