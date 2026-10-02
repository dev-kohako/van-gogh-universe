"use client";

import { Box, Maximize } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGsap } from "@/hooks/useGsap";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { PaintingImageProps } from "@/types/paintingDetails.type";

const MAX_TILT = 7;

/**
 * The painting hung on the wall in a gilded frame under a picture light. It is
 * hung with a small swing when the page opens and tilts towards the pointer.
 */
export function PaintingImage({
  painting,
  onShow3D,
  onOpenFullscreen,
  onPrefetch3D,
}: PaintingImageProps) {
  const scopeRef = useRef<HTMLElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const ratio = painting.width / painting.height;

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      return;
    }

    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      // The picture light flickers on…
      .fromTo(
        "[data-light]",
        { autoAlpha: 0 },
        {
          keyframes: { autoAlpha: [0, 0.7, 0.2, 0.9, 0.5, 1] },
          duration: 0.9,
          ease: "none",
        },
      )
      // …while the frame is lowered onto its nail and swings into place.
      .fromTo(
        "[data-frame]",
        {
          autoAlpha: 0,
          y: -70,
          rotationX: 32,
          transformPerspective: 1400,
          transformOrigin: "50% 0%",
        },
        { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.5 },
        0.1,
      )
      .fromTo(
        "[data-frame]",
        { rotation: 3 },
        { rotation: 0, duration: 2.4, ease: "elastic.out(1, 0.25)" },
        0.35,
      )
      .from("[data-shadow]", { opacity: 0, scale: 0.8, duration: 1.4 }, 0.4)
      .fromTo(
        "[data-stage-action]",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 },
        0.8,
      );
  }, scopeRef);

  // Tilt towards the pointer, with a glare sliding across the varnish.
  useEffect(() => {
    const scope = scopeRef.current;
    const tilt = tiltRef.current;
    const glare = glareRef.current;
    if (!scope || !tilt || !glare) return;
    if (!hasFinePointer() || prefersReducedMotion()) return;

    gsap.set(tilt, { transformPerspective: 1100 });
    const rotateX = gsap.quickTo(tilt, "rotationX", {
      duration: 0.6,
      ease: "power3",
    });
    const rotateY = gsap.quickTo(tilt, "rotationY", {
      duration: 0.6,
      ease: "power3",
    });
    const glareX = gsap.quickTo(glare, "xPercent", {
      duration: 0.6,
      ease: "power3",
    });

    const area = scope.querySelector<HTMLElement>("[data-tilt-area]");
    if (!area) return;

    const handleMove = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY(x * MAX_TILT * 2);
      rotateX(-y * MAX_TILT * 2);
      glareX(-x * 60);
      gsap.to(glare, { opacity: 1, duration: 0.4, overwrite: "auto" });
    };
    const handleLeave = () => {
      rotateX(0);
      rotateY(0);
      glareX(0);
      gsap.to(glare, { opacity: 0, duration: 0.6, overwrite: "auto" });
    };

    area.addEventListener("pointermove", handleMove);
    area.addEventListener("pointerleave", handleLeave);
    return () => {
      area.removeEventListener("pointermove", handleMove);
      area.removeEventListener("pointerleave", handleLeave);
      gsap.killTweensOf([tilt, glare]);
    };
  }, []);

  return (
    <section
      ref={scopeRef}
      aria-label="Visualizador da pintura"
      className="relative flex w-full flex-col items-center [--stage-h:58dvh] sm:[--stage-h:62dvh] lg:[--stage-h:calc(100dvh-15.5rem)]"
    >
      {/* Warm picture light above the frame. */}
      <div
        data-light
        data-reveal
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-[calc(100%+6rem)] w-[150%] -translate-x-1/2 bg-[radial-gradient(ellipse_45%_50%_at_50%_0%,var(--wall-light),transparent_75%)]"
      />

      <div data-tilt-area className="relative flex w-full justify-center py-2">
        <div
          data-frame
          data-reveal
          className="relative"
          style={{
            width: `min(100%, calc(var(--stage-h) * ${ratio.toFixed(4)} + 2.5rem))`,
          }}
        >
          {/* Soft shadow on the wall, cast by the light above. */}
          <div
            data-shadow
            aria-hidden="true"
            className="absolute inset-x-[4%] -bottom-6 top-[12%] rounded-[50%] bg-black/45 blur-2xl dark:bg-black/70"
          />
          <div ref={tiltRef} className="gilded-frame relative">
            <button
              type="button"
              onClick={onOpenFullscreen}
              aria-label={`Ver ${painting.alt} em tela cheia`}
              className="gilded-frame__liner group/image relative block w-full cursor-zoom-in overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className="relative block w-full overflow-hidden bg-muted"
                style={{ aspectRatio: ratio }}
              >
                <Image
                  src={painting.imagePainting}
                  alt={painting.alt}
                  fill
                  priority
                  placeholder={painting.blurDataURL ? "blur" : "empty"}
                  blurDataURL={painting.blurDataURL}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  onLoad={() => setLoaded(true)}
                  className={cn(
                    "object-cover transition-[filter,transform] duration-700",
                    loaded ? "blur-0" : "blur-sm",
                  )}
                />
                {/* Sight-edge shadow and varnish glare. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 shadow-[inset_0_2px_10px_rgb(0_0_0/0.45)]"
                />
                <div
                  ref={glareRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-[200%] bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.16)_48%,transparent_60%)] opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/35 text-zinc-50 opacity-100 backdrop-blur-md transition-opacity duration-300 lg:opacity-0 lg:group-hover/image:opacity-100 lg:group-focus-visible/image:opacity-100"
                >
                  <Maximize className="h-4 w-4" />
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-md items-center gap-2">
        <Button
          data-stage-action
          data-reveal
          onClick={onShow3D}
          onPointerEnter={onPrefetch3D}
          onFocus={onPrefetch3D}
          onTouchStart={onPrefetch3D}
          className="group/3d relative flex-1 overflow-hidden pb-1"
          aria-label={`Visualizar ${painting.alt} em 3D`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover/3d:translate-x-[450%]"
          />
          <Box
            className="-mt-0.5 transition-transform duration-500 group-hover/3d:rotate-[360deg]"
            aria-hidden="true"
          />
          Visualizar em 3D
        </Button>
        <Button
          data-stage-action
          data-reveal
          variant="outline"
          size="icon"
          onClick={onOpenFullscreen}
          aria-label="Abrir em tela cheia"
          className="bg-background/60 backdrop-blur-sm"
        >
          <Maximize className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
