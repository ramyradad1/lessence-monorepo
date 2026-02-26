"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(5px)" }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // Smooth luxury curve
      }}
      className="w-full h-full min-h-screen"
    >
      {children}
    </motion.main>
  );
}
