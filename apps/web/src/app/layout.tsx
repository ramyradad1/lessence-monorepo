import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import WebAuthProvider from "@/components/AuthProvider";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  style: "italic",
});

export const metadata: Metadata = {
  title: "L'Essence | Luxury Fragrances",
  description: "Experience the pinnacle of olfactory craftsmanship. High-end, artisanal perfumes for the modern individual.",
};

import QueryProviderWrapper from "@/components/QueryProviderWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased text-white selection:bg-primary/30`}>
        <QueryProviderWrapper>
          <WebAuthProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
          </WebAuthProvider>
        </QueryProviderWrapper>
      </body>
    </html>
  );
}
