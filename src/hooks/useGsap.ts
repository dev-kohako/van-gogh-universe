"use client";

import {
  type DependencyList,
  type RefObject,
  useEffect,
  useLayoutEffect,
} from "react";
import { gsap } from "@/lib/gsap";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Runs GSAP code scoped to `scope` before the browser paints and reverts every
 * tween, ScrollTrigger and inline style it created on cleanup.
 *
 * Elements marked with `data-reveal` start hidden in CSS (no flash before
 * hydration); animate them with `autoAlpha` so they become visible.
 */
export function useGsap(
  setup: gsap.ContextFunc,
  scope: RefObject<Element | null>,
  deps: DependencyList = [],
) {
  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(setup, scope.current ?? undefined);
    return () => context.revert();
  }, deps);
}

/** Makes `data-reveal` elements visible without animating them. */
export function showRevealed(targets: gsap.TweenTarget = "[data-reveal]") {
  gsap.set(targets, { autoAlpha: 1 });
}
