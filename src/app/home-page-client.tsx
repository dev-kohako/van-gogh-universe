"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SparklesCore } from "@/components/ui/sparkles";
import { CarouselSkeleton } from "@/components/ui/carousel-skeleton";
import { HomePageClientProps } from "@/types/homePage.type";

const PaintingCarousel = lazy(() =>
  import("@/components/PaintingCarousel").then((module) => ({
    default: module.PaintingCarousel,
  }))
);

export function HomePageClient({ paintings }: HomePageClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <div
        className="fixed inset-0 w-screen h-dvh pointer-events-none -z-10"
        aria-hidden="true"
      >
        {mounted && resolvedTheme && (
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.6}
            particleDensity={30}
            className="w-full h-full"
            particleColor={resolvedTheme === "dark" ? "#e4e4e7" : "#09090b"}
          />
        )}
      </div>

      <header className="mt-10 lg:mt-0">
        <motion.h1
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="flex flex-col text-5xl font-bold font-josefin sm:text-6xl"
        >
          Van Gogh
          <motion.span
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="text-6xl sm:text-7xl font-brush bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-700 text-transparent bg-clip-text -mt-11"
          >
            Universe
          </motion.span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="text-lg leading-relaxed font-josefin max-w-2xl mx-auto mt-4"
        >
          Explore a genialidade e a emoção de um dos maiores mestres da arte
          em uma galeria digital interativa e acessível.
        </motion.p>
      </header>

      <section
        aria-labelledby="carousel-heading"
        className="w-full z-10 my-8"
      >
        <h2 id="carousel-heading" className="sr-only">
            Galeria de destaque de obras de Van Gogh
        </h2>
        <Suspense fallback={<CarouselSkeleton />}>
          <PaintingCarousel paintings={paintings} />
        </Suspense>
      </section>

      <motion.section
        initial={{ opacity: 0, y: -80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="mb-12"
        aria-labelledby="cta-heading"
      >
        <h2 id="cta-heading" className="sr-only">
            Convite para explorar a galeria completa
        </h2>
        <p className="text-lg font-josefin max-w-2xl mx-auto leading-relaxed">
          Arte, história e inspiração em cada pincelada. <br />
          Comece agora sua jornada pelo universo de Van Gogh.
        </p>

        <div className="flex justify-center gap-3 mt-6">
          <Link href="/paintings" passHref>
            <Button
              size="lg"
              className="text-base font-josefin"
              aria-label="Explorar todas as obras de Van Gogh"
            >
              Explorar Obras
            </Button>
          </Link>
        </div>
      </motion.section>
    </>
  );
}