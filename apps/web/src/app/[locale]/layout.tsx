import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import WebAuthProvider from "@/components/AuthProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import PushNotificationManager from "@/components/PushNotificationManager";
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import { AnimatePresence } from 'framer-motion';

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale;
  const isAr = locale === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lessence-perfumes.vercel.app';

  const title = isAr ? "ليسنس | عطور فاخرة" : "L'Essence | Luxury Fragrances";
  const description = isAr
    ? "اكتشف أرقى العطور الفاخرة والمحاكاة في مصر. عطور رجالية وحريمية أصلية بأفضل الأسعار. توصيل سريع لجميع المحافظات."
    : "Discover the finest luxury & simulation perfumes in Egypt. Original men's & women's fragrances at the best prices. Fast delivery nationwide.";
  const keywords = isAr
    ? "عطور, عطور فاخرة, عطور رجالي, عطور حريمي, عطور أصلية, عطور محاكاة, برفيوم, ليسنس, عطور مصر, توصيل عطور, افضل عطور"
    : "perfumes, luxury perfumes, men perfumes, women perfumes, original perfumes, simulation perfumes, fragrance, L'Essence, Egypt perfumes, perfume delivery, best perfumes Egypt";

  return {
    title: {
      default: title,
      template: `%s | L&apos;ESSENCE`,
    },
    description,
    keywords,
    authors: [{ name: "L'Essence Perfumes" }],
    creator: "L'Essence",
    publisher: "L'Essence Perfumes",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'en': `${baseUrl}/en`,
        'ar': `${baseUrl}/ar`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: "L&apos;ESSENCE",
      locale: isAr ? 'ar_EG' : 'en_US',
      alternateLocale: isAr ? 'en_US' : 'ar_EG',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "L'Essence - Luxury Fragrances",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add your verification codes here when ready
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
    },
    other: {
      'geo.region': 'EG',
      'geo.placename': 'Egypt',
      'geo.position': '30.0444;31.2357',
      'ICBM': '30.0444, 31.2357',
      'content-language': locale,
    },
  };
}

import QueryProviderWrapper from "@/components/QueryProviderWrapper";

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lessence-perfumes.vercel.app';

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: "L&apos;ESSENCE",
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
    description: locale === 'ar'
      ? "ليسنس - أرقى العطور الفاخرة والمحاكاة في مصر"
      : "L&apos;ESSENCE - Premium luxury & simulation perfumes in Egypt",
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
      addressLocality: "Cairo",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 30.0444,
      longitude: 31.2357,
    },
    areaServed: {
      "@type": "Country",
      name: "Egypt",
    },
    priceRange: "$$",
    paymentAccepted: "Cash, Credit Card",
    currenciesAccepted: "EGP",
    sameAs: [],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "L&apos;ESSENCE",
    url: baseUrl,
    inLanguage: [locale === 'ar' ? 'ar-EG' : 'en-US'],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/${locale}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={locale} dir={direction} className="scroll-smooth">
      <body className={`${sans.variable} font-sans antialiased text-fg selection:bg-primary/20 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <QueryProviderWrapper>
            <WebAuthProvider>
              <StoreSettingsProvider>
                <CartProvider>
                  <PushNotificationManager />
                  <AnimatePresence mode="wait">
                    {children}
                  </AnimatePresence>
                  <CartDrawer />
                </CartProvider>
              </StoreSettingsProvider>
            </WebAuthProvider>
          </QueryProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
