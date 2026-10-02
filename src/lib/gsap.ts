import gsap from "gsap";

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.(REDUCED_MOTION).matches)
  );
}

/** True on devices with a mouse or trackpad (hover effects, pointer lamp). */
export function hasFinePointer() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(hover: hover) and (pointer: fine)").matches)
  );
}

export { gsap };
