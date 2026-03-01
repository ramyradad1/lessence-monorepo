import NavbarLuxury from "@/components/v2/NavbarLuxury";
import FooterLuxury from "@/components/v2/FooterLuxury";
import { V2ThemeProvider } from "@/components/v2/V2ThemeProvider";
import SmoothScroll from "@/components/v2/SmoothScroll";
import "@/styles/v2-theme.css";

export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <V2ThemeProvider>
      <SmoothScroll>
        <div className="min-h-screen font-sans flex flex-col bg-[var(--v2-bg)] text-[var(--v2-text)]">
          <NavbarLuxury />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <FooterLuxury />
        </div>
      </SmoothScroll>
    </V2ThemeProvider>
  );
}
