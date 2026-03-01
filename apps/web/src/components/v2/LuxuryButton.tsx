"use client";
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface LuxuryButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function LuxuryButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: LuxuryButtonProps) {
  const baseClasses = "relative overflow-hidden font-sans font-semibold uppercase tracking-[0.15em] transition-all duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] flex items-center justify-center gap-2 rounded-none";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary-light to-primary hover:shadow-[0_8px_32px_rgba(212,167,106,0.4)] hover:-translate-y-1 hover:scale-[1.02]",
    outline: "bg-transparent hover:shadow-[0_0_24px_rgba(212,167,106,0.15)] hover:border-[#c9a96e]",
    ghost: "bg-transparent hover:text-[#c9a96e]",
  };

  const sizes = {
    sm: "px-6 py-2.5 text-[10px]",
    md: "px-8 py-3.5 text-xs",
    lg: "px-10 py-4.5 text-sm",
  };

  // Determine inline styles based on variant
  const variantStyles: React.CSSProperties = 
    variant === "primary"
      ? { color: 'var(--v2-text-inverted)' }
      : variant === "outline"
      ? { color: 'var(--v2-text)', border: '1px solid var(--v2-border-hover)' }
      : { color: 'var(--v2-text-secondary)' };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? "w-full" : ""} 
        ${className || ""}
      `}
      style={variantStyles}
      {...(props as any)}
    >
      {/* Primary hover shine effect */}
      {variant === "primary" && (
        <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer-gold_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[1000ms] pointer-events-none" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
