"use client";

import copy from "copy-to-clipboard";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
// Registers the plugin used by the `scrollTrigger` option below.
import "@/lib/scrollTrigger";
import { formatShare } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { PaletteProps } from "@/types/paintingDetails.type";
import { ColorSwatch } from "./ColorSwatch";

export function PaintingPalette({ colors }: PaletteProps) {
  const scopeRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleCopyToClipboard = (color: string) => {
    if (copy(color.toUpperCase())) {
      toast.success(`Cor ${color.toUpperCase()} copiada com sucesso!`);
    } else {
      toast.error("Falha ao copiar a cor.");
    }
  };

  const totalShare = colors.reduce((sum, color) => sum + color.share, 0) || 1;

  // The bar is painted from left to right, then the swatches drop in.
  useGsap(() => {
    if (prefersReducedMotion()) return;
    gsap
      .timeline({
        delay: 0.9,
        scrollTrigger: {
          trigger: scopeRef.current,
          start: "top 92%",
          once: true,
        },
      })
      .from("[data-segment]", {
        scaleX: 0,
        transformOrigin: "0% 50%",
        duration: 0.7,
        ease: "power3.inOut",
        stagger: 0.12,
      })
      .from(
        "[data-swatch]",
        {
          y: 16,
          scale: 0.4,
          opacity: 0,
          duration: 0.8,
          ease: "back.out(2.2)",
          stagger: 0.07,
        },
        0.15,
      );
  }, scopeRef);

  return (
    <section
      ref={scopeRef}
      aria-labelledby="palette-heading"
      className="w-full max-w-md"
    >
      <div className="mb-3 short:mb-2">
        <h2
          id="palette-heading"
          className="text-lg font-semibold text-foreground"
        >
          Paleta de cores
        </h2>
        <p className="text-sm text-muted-foreground">
          Cores predominantes extraídas da obra. Clique para copiar.
        </p>
      </div>

      {/* Bar and swatches share the same width, so both ends line up. */}
      <div
        className="mb-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`Proporção das cores: ${colors
          .map((color) => `${color.hex} ${formatShare(color.share)}`)
          .join(", ")}`}
      >
        {colors.map((color, index) => (
          <span
            key={color.hex}
            data-segment
            className={cn(
              "h-full min-w-1 transition-opacity duration-300 first:rounded-l-full last:rounded-r-full",
              activeIndex !== null && activeIndex !== index && "opacity-35",
            )}
            style={{
              backgroundColor: color.hex,
              flexGrow: color.share / totalShare,
              flexBasis: 0,
            }}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => setActiveIndex(null)}
          />
        ))}
      </div>

      <div className="flex w-full items-start justify-between gap-1">
        {colors.map((color, index) => (
          <div key={color.hex} data-swatch>
            <ColorSwatch
              color={color.hex}
              share={color.share}
              onCopy={handleCopyToClipboard}
              active={activeIndex === index}
              onActiveChange={(active) => setActiveIndex(active ? index : null)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
