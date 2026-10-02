"use client";

import { useEffect, useRef } from "react";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";

/**
 * Fixed gallery-wall background shared by every page: plaster texture, a warm
 * picture light and a soft lamp that follows the mouse.
 */
export function GalleryBackdrop() {
  const lampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lamp = lampRef.current;
    if (!lamp || !hasFinePointer() || prefersReducedMotion()) return;

    gsap.set(lamp, { x: window.innerWidth / 2, y: window.innerHeight * 0.2 });
    // quickTo reuses one tween, so following the pointer stays cheap.
    const moveX = gsap.quickTo(lamp, "x", { duration: 1.2, ease: "power3" });
    const moveY = gsap.quickTo(lamp, "y", { duration: 1.2, ease: "power3" });

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      lamp.dataset.active = "true";
      moveX(event.clientX);
      moveY(event.clientY);
    };
    const handleLeave = () => {
      lamp.dataset.active = "false";
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
      gsap.killTweensOf(lamp);
    };
  }, []);

  return (
    <div className="gallery-wall" aria-hidden="true">
      <div ref={lampRef} className="gallery-wall__lamp" />
    </div>
  );
}
