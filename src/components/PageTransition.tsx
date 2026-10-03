"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Navigate = (href: string, label?: string) => void;

const PageTransitionContext = createContext<{ navigate: Navigate } | null>(
  null,
);

/** Navigates with the curtain transition (falls back to a plain push). */
export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  const router = useRouter();
  return context ?? { navigate: (href: string) => router.push(href) };
}

const ROUTE_LABELS: [RegExp, string][] = [
  [/^\/$/, "Início"],
  [/^\/gallery/, "Galeria"],
  [/^\/paintingsDetails/, "Obra"],
  [/^\/paintings/, "Pinturas"],
  [/^\/about/, "Sobre"],
];

export function getRouteLabel(pathname: string) {
  return ROUTE_LABELS.find(([pattern]) => pattern.test(pathname))?.[1] ?? "";
}

/** Links Next.js serves as files, not pages (e.g. lightbox images). */
function isPageLink(url: URL) {
  return (
    url.origin === window.location.origin &&
    !url.pathname.startsWith("/_next") &&
    !url.pathname.startsWith("/assets")
  );
}

/**
 * Page exits and entrances: a dark curtain rises over the page with the name
 * of the destination, the route changes behind it, then it lifts away.
 * Internal links are intercepted automatically; code navigates with
 * `usePageTransition().navigate`. Links inside `[data-transition-manual]`
 * decide for themselves.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const phase = useRef<"idle" | "covering" | "covered" | "revealing">("idle");
  const target = useRef<string | null>(null);
  const safety = useRef<gsap.core.Tween | null>(null);
  const [label, setLabel] = useState("");

  const reveal = useCallback(() => {
    const curtain = curtainRef.current;
    if (!curtain) return;
    safety.current?.kill();
    phase.current = "revealing";
    gsap
      .timeline({
        onComplete: () => {
          phase.current = "idle";
          gsap.set(curtain, { display: "none" });
        },
      })
      .to(labelRef.current, {
        yPercent: -40,
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.in",
      })
      .to(
        curtain,
        { yPercent: -100, duration: 0.75, ease: "power4.inOut" },
        0.05,
      );
  }, []);

  const navigate = useCallback<Navigate>(
    (href, destinationLabel) => {
      const url = new URL(href, window.location.href);
      const curtain = curtainRef.current;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      if (!curtain || prefersReducedMotion() || phase.current !== "idle") {
        router.push(href);
        return;
      }

      phase.current = "covering";
      target.current = url.pathname;
      setLabel(destinationLabel ?? getRouteLabel(url.pathname));
      router.prefetch(href);

      gsap.set(curtain, { display: "flex", yPercent: 100 });
      gsap
        .timeline({
          onComplete: () => {
            phase.current = "covered";
            router.push(href);
            // Never leave the visitor behind the curtain.
            safety.current = gsap.delayedCall(6, reveal);
          },
        })
        .to(curtain, { yPercent: 0, duration: 0.6, ease: "power4.inOut" })
        .fromTo(
          labelRef.current,
          { yPercent: 60, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" },
          0.25,
        );
    },
    [router, reveal],
  );

  // The new page has rendered behind the curtain: lift it.
  useEffect(() => {
    if (phase.current === "covered" && pathname === target.current) {
      reveal();
    }
  }, [pathname, reveal]);

  // Intercept clicks on internal links before next/link handles them.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (
        !anchor ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download") ||
        anchor.closest("[data-transition-manual]")
      ) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (!isPageLink(url) || url.pathname === window.location.pathname) {
        return;
      }
      event.preventDefault();
      navigate(
        url.pathname + url.search + url.hash,
        anchor.dataset.transitionLabel,
      );
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [navigate]);

  const value = useMemo(() => ({ navigate }), [navigate]);

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="page-curtain fixed inset-0 z-[90] hidden items-center justify-center"
      >
        <p
          ref={labelRef}
          className="text-gilded max-w-[90vw] truncate px-6 pb-2 font-brush text-6xl sm:text-7xl"
        >
          {label}
        </p>
      </div>
    </PageTransitionContext.Provider>
  );
}
