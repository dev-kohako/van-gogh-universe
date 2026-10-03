"use client";

import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
import { Image as ImageIcon } from "lucide-react";
import { useRef } from "react";
import { EmptySection } from "@/components/empty-section";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { revealPaintings } from "@/lib/reveal";
import { ScrollTrigger } from "@/lib/scrollTrigger";
import type { GalleryClientProps } from "@/types/galleryTypes.type";
import { GalleryCard } from "./components/GalleryCard";

const TITLE = "Galeria";

export function GalleryClient({ paintings }: GalleryClientProps) {
  const scopeRef = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      return;
    }

    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .set("[data-gallery-title]", { autoAlpha: 1 })
      .from("[data-letter]", {
        yPercent: 120,
        rotate: 8,
        duration: 1.1,
        stagger: 0.05,
      })
      .fromTo(
        "[data-gallery-subtitle]",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.9 },
        0.35,
      );

    // Reading progress along the top of the page.
    gsap.fromTo(
      "[data-progress]",
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.4 },
      },
    );

    // Each painting is unveiled as it scrolls into view, row by row.
    ScrollTrigger.batch("[data-gallery-item]", {
      start: "top bottom-=40",
      once: true,
      onEnter: (batch) => {
        revealPaintings(batch, { stagger: 0.07 });
      },
    });
  }, scopeRef);

  return (
    <main
      ref={scopeRef}
      className="mx-auto w-full max-w-7xl px-[6%] pb-10 pt-12 md:pl-24 md:pr-10 md:pt-16 xl:pl-28 2xl:px-10"
    >
      <div
        data-progress
        className="fixed inset-x-0 top-0 z-40 h-[3px] origin-left bg-gold shadow-[0_0_12px_var(--gold)]"
        aria-hidden="true"
      />

      <header className="mb-10 text-center">
        <h1
          id="gallery-title"
          data-gallery-title
          data-reveal
          aria-label={TITLE}
          className="flex justify-center overflow-hidden pb-[0.1em] text-5xl font-bold sm:text-7xl"
        >
          {TITLE.split("").map((letter, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: letters repeat
              key={index}
              data-letter
              aria-hidden="true"
              className="inline-block"
            >
              {letter}
            </span>
          ))}
        </h1>
        <p
          data-gallery-subtitle
          data-reveal
          className="mt-3 text-lg text-muted-foreground"
        >
          Uma coleção para contemplar, explorar e apreciar em cada detalhe.
        </p>
      </header>

      {paintings.length > 0 ? (
        <section aria-labelledby="gallery-title" className="w-full">
          <div>
            <LightGallery
              speed={500}
              plugins={[lgThumbnail, lgZoom]}
              exThumbImage="data-thumb"
              elementClassNames="columns-2 gap-3 sm:gap-5 md:columns-3 lg:columns-4 xl:columns-5"
            >
              {paintings.map((painting, i) => (
                <GalleryCard key={painting.id} painting={painting} index={i} />
              ))}
            </LightGallery>
          </div>
        </section>
      ) : (
        <EmptySection
          icon={<ImageIcon aria-hidden="true" className="h-16 w-16" />}
          title="Nenhuma Pintura Encontrada"
          description="Sem obras no momento."
          onClear={() => window.location.reload()}
          buttonText="Recarregar Página"
        />
      )}
    </main>
  );
}
