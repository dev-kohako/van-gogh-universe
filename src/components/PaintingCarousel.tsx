"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePageTransition } from "@/components/PageTransition";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { PaintingCarouselProps } from "@/types/homePage.type";

/** Seconds each painting stays in front before the ring turns. */
const HOLD = 3.4;
/** Degrees of rotation per dragged pixel. */
const DRAG_FACTOR = 0.18;
/** Movement (px) after which a press is a drag, not a click. */
const CLICK_SLOP = 6;

/** Signed angle in degrees, wrapped to (-180, 180]. */
export function wrapAngle(angle: number) {
  const wrapped = (((angle + 180) % 360) + 360) % 360;
  return wrapped - 180;
}

/** Index of the card facing the visitor for a ring rotation. */
export function getFrontIndex(rotation: number, count: number) {
  const step = 360 / count;
  return ((Math.round(-rotation / step) % count) + count) % count;
}

/**
 * Featured paintings hung on a slowly turning 3D ring. Drag (or use the
 * arrows) to spin it; the painting in front opens its details page.
 */
export function PaintingCarousel({ paintings }: PaintingCarouselProps) {
  const count = paintings.length;
  const step = 360 / count;
  // Ring radius as a multiple of the card width, with a little air between.
  const radiusFactor = 1.12 / (2 * Math.tan(Math.PI / count));

  const stageRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const motion = useRef({
    rotation: 0,
    velocity: 0,
    dragging: false,
    moved: 0,
    /** Autoplay is on hold while the visitor interacts. */
    paused: false,
    resume: null as gsap.core.Tween | null,
  });
  const [front, setFront] = useState(0);
  const { navigate } = usePageTransition();

  // Turns the ring so `rotation` lands on a card.
  const settleTo = useCallback(
    (rotation: number, duration = 1.1, ease = "power3.out") => {
      const state = motion.current;
      gsap.killTweensOf(state, "rotation");
      gsap.to(state, { rotation, duration, ease, overwrite: "auto" });
    },
    [],
  );

  // Autoplay holds while the visitor is interacting.
  const pauseAuto = useCallback((resumeAfter = 3) => {
    const state = motion.current;
    state.paused = true;
    state.resume?.kill();
    state.resume = Number.isFinite(resumeAfter)
      ? gsap.delayedCall(resumeAfter, () => {
          state.paused = false;
        })
      : null;
  }, []);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      const state = motion.current;
      const snapped = Math.round(state.rotation / step) * step;
      settleTo(snapped - direction * step, 0.9);
      pauseAuto();
    },
    [settleTo, step, pauseAuto],
  );

  useGsap(() => {
    const ring = ringRef.current;
    const stage = stageRef.current;
    if (!ring || !stage) return;

    const state = motion.current;
    const reduceMotion = prefersReducedMotion();

    const cards = gsap.utils.toArray<HTMLElement>("[data-ring-card]", ring);
    const setRotation = gsap.quickSetter(ring, "rotationY", "deg");
    const shades = cards.map((card) =>
      gsap.quickSetter(card.querySelector("[data-shade]"), "opacity"),
    );
    const fades = cards.map((card) => gsap.quickSetter(card, "opacity"));
    let lastFront = -1;
    let lastRotation = Number.NaN;
    let visible = true;

    // One ticker applies the rotation and lights the paintings.
    const tick = () => {
      if (!visible || state.rotation === lastRotation) return;
      lastRotation = state.rotation;
      setRotation(state.rotation);
      cards.forEach((_, index) => {
        const angle = Math.abs(wrapAngle(index * step + state.rotation));
        // Paintings turning away from the light grow darker, and those
        // almost edge-on fade out instead of showing as thin slivers.
        shades[index](Math.min(0.8, (angle / 90) ** 1.6 * 0.8));
        fades[index](gsap.utils.clamp(0, 1, (70 - angle) / 22));
      });
      const current = getFrontIndex(state.rotation, count);
      if (current !== lastFront) {
        lastFront = current;
        setFront(current);
      }
    };
    gsap.ticker.add(tick);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(stage);

    // Autoplay: every few seconds the ring turns to the next painting.
    let next: gsap.core.Tween | null = null;
    const advance = () => {
      if (visible && !state.paused && !state.dragging) {
        const snapped = Math.round(state.rotation / step) * step;
        settleTo(snapped - step, 1.6, "power3.inOut");
      }
      next = gsap.delayedCall(HOLD + 1.6, advance);
    };

    if (!reduceMotion) {
      next = gsap.delayedCall(3.1 + HOLD, advance);
      // Entrance: the ring spins in while the paintings rise into place.
      state.rotation = -step * 2.5;
      gsap.to(state, {
        rotation: 0,
        duration: 2.6,
        delay: 0.5,
        ease: "expo.out",
      });
      gsap.fromTo(
        "[data-ring-inner]",
        { autoAlpha: 0, y: 90, rotationX: -55, scale: 0.85 },
        {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          duration: 1.6,
          ease: "expo.out",
          stagger: { each: 0.06, from: "start" },
          delay: 0.45,
        },
      );
    } else {
      gsap.set("[data-ring-inner]", { autoAlpha: 1 });
    }

    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
      next?.kill();
      state.resume?.kill();
    };
  }, stageRef);

  // Drag to spin, with inertia and a snap to the nearest painting.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const state = motion.current;
    let lastX = 0;
    let lastTime = 0;

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      gsap.killTweensOf(state, "rotation");
      state.dragging = true;
      state.moved = 0;
      state.velocity = 0;
      lastX = event.clientX;
      lastTime = performance.now();
      pauseAuto(Number.POSITIVE_INFINITY);
    };
    const handleMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      const now = performance.now();
      const dx = event.clientX - lastX;
      state.moved += Math.abs(dx);
      state.rotation += dx * DRAG_FACTOR;
      state.velocity = (dx * DRAG_FACTOR) / Math.max(1, now - lastTime);
      lastX = event.clientX;
      lastTime = now;
      if (state.moved > CLICK_SLOP) stage.setPointerCapture?.(event.pointerId);
    };
    const handleUp = () => {
      if (!state.dragging) return;
      state.dragging = false;
      // Throw: keep the momentum for ~350 ms, then rest on a painting.
      const thrown = state.rotation + state.velocity * 350;
      settleTo(Math.round(thrown / step) * step, 1.3);
      pauseAuto(3);
    };

    stage.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      stage.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [settleTo, step, pauseAuto]);

  const handleCardClick = (event: React.MouseEvent, index: number) => {
    const state = motion.current;
    // The ring decides what a click does (see data-transition-manual).
    event.preventDefault();
    // A drag is not a click.
    if (state.moved > CLICK_SLOP) return;
    // A side painting is brought to the front first.
    if (index !== front) {
      const current = Math.round(state.rotation / step);
      let offset = (front - index) % count;
      if (offset > count / 2) offset -= count;
      if (offset < -count / 2) offset += count;
      settleTo((current + offset) * step, 1);
      pauseAuto(4);
      return;
    }
    const painting = paintings[index];
    navigate(`/paintingsDetails/${painting.id}`, painting.name);
  };

  const active = paintings[front];

  return (
    <div className="flex w-full flex-col items-center">
      <section
        ref={stageRef}
        data-transition-manual
        aria-roledescription="carrossel"
        aria-label="Obras em destaque"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") goTo(-1);
          if (event.key === "ArrowRight") goTo(1);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse")
            pauseAuto(Number.POSITIVE_INFINITY);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" && !motion.current.dragging) {
            pauseAuto(0.6);
          }
        }}
        className="carousel-stage relative w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={
          {
            "--ring-radius": `calc(var(--card-w) * ${radiusFactor.toFixed(4)})`,
          } as React.CSSProperties
        }
      >
        <div className="carousel-view">
          <div ref={ringRef} className="carousel-track">
            {paintings.map((painting, index) => (
              <div
                key={painting.id}
                data-ring-card
                className="carousel-card"
                style={{
                  transform: `rotateY(${index * step}deg) translateZ(var(--ring-radius))`,
                }}
              >
                <div data-ring-inner data-reveal className="h-full w-full">
                  <Link
                    href={`/paintingsDetails/${painting.id}`}
                    draggable={false}
                    onClick={(event) => handleCardClick(event, index)}
                    tabIndex={index === front ? 0 : -1}
                    aria-label={`Ver detalhes de ${painting.name}`}
                    className="carousel-frame block h-full w-full"
                  >
                    <span className="relative block h-full w-full overflow-hidden">
                      <Image
                        src={painting.src}
                        alt={painting.alt}
                        fill
                        draggable={false}
                        priority={index < 3 || index > count - 3}
                        placeholder={painting.blurDataURL ? "blur" : "empty"}
                        blurDataURL={painting.blurDataURL}
                        sizes="(min-width: 1024px) 420px, 240px"
                        className="pointer-events-none object-cover"
                      />
                      <span
                        data-shade
                        aria-hidden="true"
                        className="absolute inset-0 bg-black"
                      />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => goTo(-1)}
          aria-label="Obra anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:border-gold/70 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <p
          aria-live="polite"
          className="min-w-[14rem] max-w-[60vw] text-center leading-tight"
        >
          <span className="block truncate text-sm font-medium sm:text-base">
            {active?.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {active?.date}
          </span>
        </p>
        <button
          type="button"
          onClick={() => goTo(1)}
          aria-label="Próxima obra"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:border-gold/70 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
