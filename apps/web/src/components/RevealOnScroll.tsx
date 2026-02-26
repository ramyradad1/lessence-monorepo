"use client";

import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";

export interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  once?: boolean;
}

export default function RevealOnScroll({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 40,
  className = "",
  once = true,
}: RevealOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom luxury cubic bezier
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
