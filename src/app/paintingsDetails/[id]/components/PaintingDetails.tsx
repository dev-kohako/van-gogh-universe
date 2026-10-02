"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
// Registers the plugin used by the `scrollTrigger` option below.
import "@/lib/scrollTrigger";
import { capitalizeFirst, cn } from "@/lib/utils";
import type { PaintingDetailsProps } from "@/types/paintingDetails.type";
import { PaintingPalette } from "./PaintingPalette/PaintingPalette";

/** Museum placard: title, story and the technical sheet of the painting. */
export function PaintingDetails({ painting }: PaintingDetailsProps) {
  const scopeRef = useRef<HTMLElement>(null);

  const details = [
    { label: "Título original:", value: painting.originalTitle, wide: true },
    { label: "Data:", value: painting.datePainting },
    { label: "Dimensões:", value: painting.physicalDimensions },
    { label: "Local:", value: painting.local, wide: true },
    { label: "Materiais:", value: painting.materials },
    { label: "Estilo:", value: painting.style },
    { label: "Período:", value: painting.period },
    { label: "Gênero:", value: painting.genre },
  ];

  const colors = (painting.palette ?? []).filter((color) => color.hex);
  const words = painting.namePainting.split(/\s+/);

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      return;
    }

    const scope = scopeRef.current;
    if (!scope) return;

    gsap
      .timeline({
        defaults: { ease: "expo.out" },
        delay: 0.35,
        // On small screens the placard is below the painting: it is revealed
        // when scrolled into view.
        scrollTrigger: { trigger: scope, start: "top 88%", once: true },
      })
      .set("[data-title]", { autoAlpha: 1 })
      .fromTo(
        "[data-eyebrow]",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.8 },
      )
      .from(
        "[data-title-word]",
        { yPercent: 120, rotate: 3, duration: 1.1, stagger: 0.06 },
        0.05,
      )
      .fromTo(
        "[data-placard]",
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 },
        0.3,
      )
      .from(
        "[data-field]",
        { opacity: 0, y: 14, duration: 0.7, stagger: 0.05 },
        0.45,
      );
  }, scopeRef);

  return (
    <article
      ref={scopeRef}
      aria-label="Detalhes da pintura"
      className="flex flex-col gap-5 lg:gap-6 short:gap-3.5"
    >
      <header className="space-y-2">
        <p
          data-eyebrow
          data-reveal
          className="text-xs uppercase tracking-[0.2em] text-gold sm:tracking-[0.3em]"
        >
          Vincent van Gogh · {painting.datePainting}
        </p>
        <h1
          id="painting-title"
          data-title
          data-reveal
          className="text-balance text-[clamp(2.1rem,4.2vw,4rem)] font-bold leading-[1.02] tracking-tight short:text-[clamp(1.9rem,3.4vw,3rem)]"
        >
          {words.map((word, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: words can repeat
              key={index}
              className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-top"
            >
              <span data-title-word className="inline-block">
                {word}
              </span>
              {index < words.length - 1 && " "}
            </span>
          ))}
        </h1>
      </header>

      {painting.description && (
        <p
          data-placard
          data-reveal
          className="text-pretty text-base leading-relaxed text-foreground/80 short:text-sm"
        >
          {painting.description}
        </p>
      )}

      <dl
        data-placard
        data-reveal
        className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border/70 py-4 short:gap-y-2 short:py-3"
      >
        {details.map((item) =>
          item.value ? (
            <div
              key={item.label}
              data-field
              className={cn("min-w-0", item.wide && "col-span-2")}
            >
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {item.label.replace(":", "")}
              </dt>
              <dd className="mt-0.5 text-sm sm:text-base short:text-sm">
                {capitalizeFirst(item.value)}
              </dd>
            </div>
          ) : null,
        )}
      </dl>

      {colors.length > 0 && (
        <div data-placard data-reveal>
          <PaintingPalette colors={colors} />
        </div>
      )}
    </article>
  );
}
