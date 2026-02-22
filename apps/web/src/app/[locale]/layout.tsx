import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "../globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import WebAuthProvider from "@/components/AuthProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  style: "italic",
});

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale;
  const isAr = locale === 'ar';
  
  return {
    title: isAr ? "ليسنس | عطور فاخرة" : "L'Essence | Luxury Fragrances",
    description: isAr 
      ? "اختبر قمة الحرفية في عالم العطور. عطور فاخرة وحرفية للفرد العصري."
      : "Experience the pinnacle of olfactory craftsmanship. High-end, artisanal perfumes for the modern individual.",
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
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} className="dark scroll-smooth">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased text-white selection:bg-primary/30 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProviderWrapper>
            <WebAuthProvider>
              <CartProvider>
                {children}
                <CartDrawer />
              </CartProvider>
            </WebAuthProvider>
          </QueryProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
