import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ProductDetailClient from "./ProductDetailClient";
import { notFound } from "next/navigation";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, subtitle, description, image_url, slug")
    .eq("slug", params.slug)
    .single();

  if (!product) return { title: "Product Not Found | L'Essence" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lessence-perfumes.vercel.app";

  return {
    title: `${product.name} | ${product.subtitle} | L'Essence`,
    description: product.description,
    openGraph: {
      title: `${product.name} | L'Essence`,
      description: product.description,
      images: [
        {
          url: product.image_url,
          width: 800,
          height: 1000,
          alt: product.name,
        }
      ],
      url: `${baseUrl}/shop/${product.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | L'Essence`,
      description: product.description,
      images: [product.image_url],
    },
    alternates: {
      canonical: `${baseUrl}/shop/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!product) {
    notFound();
  }

  // Structured Data (JSON-LD)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lessence-perfumes.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "L'Essence",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/shop/${product.slug}`,
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
