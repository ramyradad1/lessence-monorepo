import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ProductDetailClient from "./ProductDetailClient";
import { notFound } from "next/navigation";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, name_en, name_ar, subtitle, subtitle_en, subtitle_ar, description, description_en, description_ar, image_url, slug")
    .eq("slug", slug)
    .single();

  if (!product) return { title: "Product Not Found | L'Essence" };

  const name = locale === 'ar' ? (product.name_ar || product.name_en || product.name) : (product.name_en || product.name);
  const subtitle = locale === 'ar' ? (product.subtitle_ar || product.subtitle_en || product.subtitle) : (product.subtitle_en || product.subtitle);
  const description = locale === 'ar' ? (product.description_ar || product.description_en || product.description) : (product.description_en || product.description);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lessence-perfumes.vercel.app";

  return {
    title: `${name} | ${subtitle} | L'Essence`,
    description: description,
    openGraph: {
      title: `${name} | L'Essence`,
      description: description,
      images: [
        {
          url: product.image_url,
          width: 800,
          height: 1000,
          alt: name,
        }
      ],
      url: `${baseUrl}/${locale}/shop/${product.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | L'Essence`,
      description: description,
      images: [product.image_url],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/shop/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = params;
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!product) {
    notFound();
  }

  const name = locale === 'ar' ? (product.name_ar || product.name_en || product.name) : (product.name_en || product.name);
  const description = locale === 'ar' ? (product.description_ar || product.description_en || product.description) : (product.description_en || product.description);

  // Structured Data (JSON-LD)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lessence-perfumes.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    image: product.image_url,
    description: description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "L'Essence",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/${locale}/shop/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating || 5,
      reviewCount: product.review_count || 1,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
