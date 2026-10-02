"use client";

import { motion } from "framer-motion";
import { ArtLoader } from "@/components/ui/art-loader";

export default function Loading() {
  return (
    <motion.section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen w-full items-center justify-center px-4 md:pl-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
    >
      <ArtLoader label="Carregando conteúdo..." />
    </motion.section>
  );
}
