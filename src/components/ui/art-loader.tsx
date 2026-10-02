"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const QUOTES = [
  "Não sei nada com certeza, mas a visão das estrelas me faz sonhar.",
  "Eu sonho com a pintura e depois pinto o meu sonho.",
  "Grandes coisas são feitas por uma série de pequenas coisas reunidas.",
  "Não há nada mais verdadeiramente artístico do que amar as pessoas.",
  "O que seria da vida se não tivéssemos coragem de tentar algo?",
];

const QUOTE_INTERVAL = 4500;

const RINGS = [
  {
    r: 52,
    width: 6,
    stroke: "url(#art-loader-blue)",
    dash: "34 14 10 18 22 12",
    turn: 1,
    duration: 9,
  },
  {
    r: 40,
    width: 5,
    stroke: "#60a5fa",
    dash: "26 12 8 14",
    turn: -1,
    duration: 6,
  },
  {
    r: 29,
    width: 3.5,
    stroke: "#bae6fd",
    dash: "14 10 4 10",
    turn: 1,
    duration: 4,
  },
];

/** Small stars orbiting outside the rings: [cx, cy, radius]. */
const STARS: [number, number, number][] = [
  [60, -6, 2.2],
  [118, 44, 1.6],
  [16, 104, 1.9],
  [104, 108, 1.3],
];

/** Starry Night inspired swirl: brush-stroke rings around a glowing star. */
export function StarrySwirl({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    // GSAP is loaded on demand so it is not part of every page's bundle; the
    // swirl is already visible (static) while it loads.
    import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      const context = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const rings = gsap.utils.toArray<SVGGElement>("[data-ring]");
          const strokes = gsap.utils.toArray<SVGCircleElement>("[data-stroke]");

          // Strokes are "painted" in one after another, then keep swirling.
          gsap
            .timeline()
            .from("[data-star]", {
              scale: 0,
              svgOrigin: "60 60",
              duration: 0.6,
              ease: "back.out(2)",
            })
            .from(
              rings,
              {
                scale: 0.4,
                opacity: 0,
                rotation: -120,
                svgOrigin: "60 60",
                duration: 0.9,
                stagger: 0.12,
                ease: "power3.out",
              },
              "<0.1",
            );

          rings.forEach((ring, i) => {
            gsap.to(ring, {
              rotation: `+=${360 * RINGS[i].turn}`,
              svgOrigin: "60 60",
              duration: RINGS[i].duration,
              ease: "none",
              repeat: -1,
            });
          });

          // Sliding the dash pattern makes the strokes flow like brush marks.
          strokes.forEach((stroke, i) => {
            gsap.to(stroke, {
              strokeDashoffset: (i % 2 ? 1 : -1) * 96,
              duration: 3 + i,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          });

          gsap.to("[data-orbit]", {
            rotation: "+=360",
            svgOrigin: "60 60",
            duration: 14,
            ease: "none",
            repeat: -1,
          });
          gsap.to("[data-twinkle]", {
            opacity: 0.2,
            duration: 0.9,
            ease: "sine.inOut",
            stagger: { each: 0.35, repeat: -1, yoyo: true },
          });

          gsap.to("[data-glow]", {
            scale: 1.18,
            opacity: 0.7,
            svgOrigin: "60 60",
            duration: 1.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });
      }, svg);
      revert = () => context.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 120"
      className={cn("h-32 w-32 sm:h-36 sm:w-36 overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="art-loader-star" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="55%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="art-loader-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
      </defs>

      {RINGS.map((ring) => (
        <g key={ring.r} data-ring>
          <circle
            data-stroke
            cx="60"
            cy="60"
            r={ring.r}
            fill="none"
            stroke={ring.stroke}
            strokeWidth={ring.width}
            strokeLinecap="round"
            strokeDasharray={ring.dash}
          />
        </g>
      ))}

      <g data-orbit>
        {STARS.map(([cx, cy, r]) => (
          <circle
            key={`${cx}-${cy}`}
            data-twinkle
            cx={cx}
            cy={cy}
            r={r}
            fill="#fde68a"
          />
        ))}
      </g>

      <g data-star>
        <circle data-glow cx="60" cy="60" r="22" fill="url(#art-loader-star)" />
        <circle cx="60" cy="60" r="9" fill="#fde047" />
      </g>
    </svg>
  );
}

interface ArtLoaderProps {
  /** Short message under the swirl. */
  label?: string;
  /** 0–100 progress; omit for an indeterminate loader. */
  progress?: number;
  /** Rotates Van Gogh quotes under the label. */
  showQuotes?: boolean;
  className?: string;
}

export function ArtLoader({
  label = "Carregando conteúdo...",
  progress,
  showQuotes = true,
  className,
}: ArtLoaderProps) {
  const reduceMotion = useReducedMotion();
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!showQuotes || reduceMotion) return;
    const id = window.setInterval(
      () => setQuoteIndex((index) => (index + 1) % QUOTES.length),
      QUOTE_INTERVAL,
    );
    return () => window.clearInterval(id);
  }, [showQuotes, reduceMotion]);

  const hasProgress = typeof progress === "number";
  const clamped = hasProgress ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 text-center",
        className,
      )}
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 scale-150 rounded-full bg-blue-500/20 blur-3xl"
        />
        <StarrySwirl />
      </div>

      <div className="flex w-64 max-w-full flex-col items-center gap-3">
        <p className="text-base sm:text-lg font-medium select-none">
          {label}
          {hasProgress && (
            <span className="ml-2 tabular-nums text-muted-foreground">
              {Math.round(clamped)}%
            </span>
          )}
        </p>

        <div
          className="relative h-1 w-full overflow-hidden rounded-full bg-foreground/10"
          {...(hasProgress
            ? {
                role: "progressbar",
                "aria-valuemin": 0,
                "aria-valuemax": 100,
                "aria-valuenow": Math.round(clamped),
                "aria-label": label,
              }
            : { "aria-hidden": true })}
        >
          {hasProgress ? (
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-yellow-400 transition-[width] duration-300 ease-out"
              style={{ width: `${clamped}%` }}
            />
          ) : (
            <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent motion-safe:animate-[art-loader-slide_1.4s_ease-in-out_infinite]" />
          )}
        </div>
      </div>

      {showQuotes && (
        <div className="h-12 max-w-sm px-4" aria-hidden="true">
          <blockquote
            key={quoteIndex}
            className="text-sm italic text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-700"
          >
            “{QUOTES[quoteIndex]}”
            <span className="not-italic"> — Vincent van Gogh</span>
          </blockquote>
        </div>
      )}
    </div>
  );
}
