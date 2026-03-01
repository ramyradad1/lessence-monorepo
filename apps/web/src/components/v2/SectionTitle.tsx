import React from "react";
import RevealOnScroll from "../RevealOnScroll";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export default function SectionTitle({
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionTitleProps) {
  return (
    <RevealOnScroll delay={0.1}>
      <div className={`flex flex-col mb-10 md:mb-16 ${align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left"} ${className}`}>
        {subtitle && (
          <span className="text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase mb-4 block animate-fade-in text-shimmer text-[var(--v2-gold-text)]">
            {subtitle}
          </span>
        )}
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif italic tracking-wide text-[var(--v2-text)]">
          {title}
        </h2>
        
        {/* Decorative Divider */}
        {align === "center" && (
          <div className="flex items-center gap-4 mt-8 opacity-70">
            <div className="w-12 h-[1px]" style={{ background: `linear-gradient(to right, transparent, var(--v2-gold))` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ border: `1px solid var(--v2-gold)` }} />
            <div className="w-12 h-[1px]" style={{ background: `linear-gradient(to left, transparent, var(--v2-gold))` }} />
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}
