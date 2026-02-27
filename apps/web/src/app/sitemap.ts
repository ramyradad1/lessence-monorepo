import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lessence-perfumes.vercel.app';
  const locales = ['en', 'ar'];

  // Fetch all active products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true);

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug');

  // Fetch collections
  const { data: collections } = await supabase
    .from('collections')
    .select('slug');

  // Helper: generate alternates for each locale
  const withAlternates = (path: string) => ({
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `${baseUrl}/${locale}${path}`])
    ),
  });

  // Static pages
  const staticPaths = ['', '/shop', '/collections', '/about', '/journal'];
  const staticPages: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}/en${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/shop' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : path === '/shop' ? 0.9 : 0.7,
    alternates: withAlternates(path),
  }));

  // Gender-filtered pages
  const genderPages: MetadataRoute.Sitemap = ['women', 'men'].map((gender) => ({
    url: `${baseUrl}/en/shop?gender=${gender}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
    alternates: withAlternates(`/shop?gender=${gender}`),
  }));

  // Product type pages
  const typePages: MetadataRoute.Sitemap = ['original', 'simulation'].map((type) => ({
    url: `${baseUrl}/en/shop?productType=${type}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
    alternates: withAlternates(`/shop?productType=${type}`),
  }));

  // Product URLs
  const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${baseUrl}/en/shop/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: withAlternates(`/shop/${product.slug}`),
  }));

  // Category URLs
  const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${baseUrl}/en/shop?category=${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: withAlternates(`/shop?category=${category.slug}`),
  }));

  // Collection URLs
  const collectionUrls: MetadataRoute.Sitemap = (collections || []).map((collection) => ({
    url: `${baseUrl}/en/collections/${collection.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: withAlternates(`/collections/${collection.slug}`),
  }));

  return [
    ...staticPages,
    ...genderPages,
    ...typePages,
    ...productUrls,
    ...categoryUrls,
    ...collectionUrls,
  ];
}
