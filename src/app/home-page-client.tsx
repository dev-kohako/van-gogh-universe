"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CarouselSkeleton } from "@/components/ui/carousel-skeleton";
import { SparklesCore } from "@/components/ui/sparkles";
import { useGsap } from "@/hooks/useGsap";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";
import type { HomePageClientProps } from "@/types/homePage.type";

const PaintingCarousel = lazy(() =>
  import("@/components/PaintingCarousel").then((module) => ({
    default: module.PaintingCarousel,
  })),
);

export function HomePageClient({ paintings }: HomePageClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => setMounted(true), []);

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      return;
    }

    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .set("[data-reveal]", { autoAlpha: 1 })
      // Each word rises out of its own mask, so nothing overflows the page.
      .from("[data-word]", {
        yPercent: 115,
        rotate: 4,
        duration: 1.2,
        stagger: 0.09,
      })
      // "Universe" is painted in with a single brush stroke.
      .fromTo(
        "[data-brush]",
        { clipPath: "inset(-30% 100% -30% 0%)" },
        {
          clipPath: "inset(-30% 0% -30% 0%)",
          duration: 1.4,
          ease: "power2.inOut",
        },
        0.35,
      )
      .from("[data-brush]", { y: 14, duration: 1.4 }, 0.35)
      .from(
        "[data-intro]",
        { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1 },
        0.6,
      )
      .from(
        "[data-carousel]",
        {
          y: 60,
          scale: 0.92,
          rotateX: 14,
          autoAlpha: 0,
          transformPerspective: 1200,
          transformOrigin: "50% 100%",
          duration: 1.6,
        },
        0.7,
      )
      .from(
        "[data-cta]",
        { y: 20, autoAlpha: 0, duration: 0.9, stagger: 0.12 },
        1.05,
      );
  }, scopeRef);

  // Magnetic call-to-action on devices with a mouse.
  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta || !hasFinePointer() || prefersReducedMotion()) return;
    const moveX = gsap.quickTo(cta, "x", { duration: 0.5, ease: "power3" });
    const moveY = gsap.quickTo(cta, "y", { duration: 0.5, ease: "power3" });
    const handleMove = (event: PointerEvent) => {
      const rect = cta.getBoundingClientRect();
      moveX((event.clientX - rect.left - rect.width / 2) * 0.25);
      moveY((event.clientY - rect.top - rect.height / 2) * 0.35);
    };
    const handleLeave = () => {
      moveX(0);
      moveY(0);
    };
    cta.addEventListener("pointermove", handleMove);
    cta.addEventListener("pointerleave", handleLeave);
    return () => {
      cta.removeEventListener("pointermove", handleMove);
      cta.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <div ref={scopeRef} className="contents">
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

      <header className="mt-6 lg:mt-0">
        <h1
          data-reveal
          className="flex flex-col items-center text-5xl font-bold font-josefin sm:text-6xl"
        >
          <span className="flex gap-[0.25em] overflow-hidden pt-[0.1em] pb-[0.15em] -my-[0.1em]">
            <span data-word className="inline-block">
              Van
            </span>
            <span data-word className="inline-block">
              Gogh
            </span>
          </span>
          <span
            data-brush
            className="text-6xl sm:text-7xl font-brush bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-700 text-transparent bg-clip-text -mt-9 sm:-mt-11 px-4"
          >
            Universe
          </span>
        </h1>
        <p
          data-intro
          data-reveal
          className="text-lg leading-relaxed font-josefin max-w-2xl mx-auto mt-4 text-foreground/85"
        >
          Explore a genialidade e a emoção de um dos maiores mestres da arte em
          uma galeria digital interativa e acessível.
        </p>
      </header>

      <section
        aria-labelledby="carousel-heading"
        className="w-full z-10 my-6 sm:my-8"
      >
        <h2 id="carousel-heading" className="sr-only">
          Galeria de destaque de obras de Van Gogh
        </h2>
        <div data-carousel data-reveal>
          <Suspense fallback={<CarouselSkeleton />}>
            <PaintingCarousel paintings={paintings} />
          </Suspense>
        </div>
      </section>

      <section className="mb-6 md:mb-12" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="sr-only">
          Convite para explorar a galeria completa
        </h2>
        <p
          data-cta
          data-reveal
          className="text-lg font-josefin max-w-2xl mx-auto leading-relaxed text-foreground/85"
        >
          Arte, história e inspiração em cada pincelada. <br />
          Comece agora sua jornada pelo universo de Van Gogh.
        </p>

        <div data-cta data-reveal className="flex justify-center gap-3 mt-6">
          <Button
            asChild
            size="lg"
            className="group/cta relative overflow-hidden text-base font-josefin pb-1.5 shadow-[0_12px_32px_-14px_var(--gold)]"
          >
            <Link
              ref={ctaRef}
              href="/paintings"
              aria-label="Explorar todas as obras de Van Gogh"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-[450%]"
              />
              Explorar Obras
              <ArrowRight
                className="mb-0.5 transition-transform duration-300 group-hover/cta:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
