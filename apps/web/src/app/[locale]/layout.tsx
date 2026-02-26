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
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} className="scroll-smooth">
      <body className={`${sans.variable} font-sans antialiased text-fg selection:bg-primary/20 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
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
