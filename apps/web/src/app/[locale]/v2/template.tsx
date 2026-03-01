"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1], // Custom sophisticated cubic-bezier for a luxury feel
      }}
    >
      {children}
    </motion.div>
  );
}
