"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { ModeToggle } from "@/components/toggleDarkMode";
import { useGsap } from "@/hooks/useGsap";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { Links } from "@/types/types";
import logo from "../../public/assets/logo.png";
import { links } from "../../public/data/links";

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // "/paintingsDetails/…" belongs to "/paintings" too.
  return pathname.startsWith(href);
}

/** Icon follows the pointer a little, like a magnet, and springs back. */
function useMagnet(ref: React.RefObject<HTMLElement | null>, strength = 0.35) {
  useLayoutEffect(() => {
    const element = ref.current;
    const icon = element?.querySelector<HTMLElement>("[data-magnet]");
    if (!element || !icon || !hasFinePointer() || prefersReducedMotion()) {
      return;
    }

    const moveX = gsap.quickTo(icon, "x", { duration: 0.4, ease: "power3" });
    const moveY = gsap.quickTo(icon, "y", { duration: 0.4, ease: "power3" });

    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      moveX((event.clientX - rect.left - rect.width / 2) * strength);
      moveY((event.clientY - rect.top - rect.height / 2) * strength);
    };
    const handleLeave = () => {
      gsap.to(icon, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.4)",
        overwrite: true,
      });
    };

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
      gsap.killTweensOf(icon);
    };
  }, [ref, strength]);
}

function NavItem({
  link,
  active,
  orientation,
  itemRef,
}: {
  link: Links;
  active: boolean;
  orientation: "vertical" | "horizontal";
  itemRef: (element: HTMLAnchorElement | null) => void;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  useMagnet(ref);

  return (
    <Link
      href={link.href}
      ref={(element) => {
        ref.current = element;
        itemRef(element);
      }}
      aria-current={active ? "page" : undefined}
      data-nav-item
      className={cn(
        "group/nav relative z-10 flex h-11 w-11 items-center justify-center rounded-xl outline-none transition-colors duration-300",
        "focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span data-magnet className="flex">
        {link.icon}
      </span>
      {orientation === "vertical" ? (
        <span
          className={cn(
            "pointer-events-none absolute left-full top-1/2 ml-4 -translate-y-1/2 -translate-x-1 whitespace-nowrap rounded-lg border border-border/70 bg-popover/90 px-3 pb-1 pt-1.5 text-sm text-popover-foreground opacity-0 shadow-lg backdrop-blur-md transition duration-200",
            "group-hover/nav:translate-x-0 group-hover/nav:opacity-100 group-focus-visible/nav:translate-x-0 group-focus-visible/nav:opacity-100",
          )}
        >
          {link.label}
        </span>
      ) : (
        <span className="sr-only">{link.label}</span>
      )}
    </Link>
  );
}

/** Sliding highlight behind the active item: a lit niche with a gilded edge. */
function useActiveIndicator(
  indicatorRef: React.RefObject<HTMLSpanElement | null>,
  itemsRef: React.RefObject<(HTMLAnchorElement | null)[]>,
  activeIndex: number,
  axis: "x" | "y",
) {
  const placed = useRef(false);

  // The rail and the dock are hidden at some widths, so measure again when
  // the layout changes.
  useLayoutEffect(() => {
    const handleResize = () => {
      const item = itemsRef.current[activeIndex];
      if (item && indicatorRef.current) {
        gsap.set(indicatorRef.current, {
          [axis]: axis === "y" ? item.offsetTop : item.offsetLeft,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, axis, indicatorRef, itemsRef]);

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    const item = itemsRef.current[activeIndex];
    if (!indicator) return;

    if (!item) {
      gsap.to(indicator, { autoAlpha: 0, duration: 0.3 });
      return;
    }

    const offset = axis === "y" ? item.offsetTop : item.offsetLeft;
    if (!placed.current || prefersReducedMotion()) {
      placed.current = true;
      gsap.set(indicator, { [axis]: offset, autoAlpha: 1 });
      return;
    }

    // Stretch while travelling, settle with a small overshoot.
    const stretch = axis === "y" ? "scaleY" : "scaleX";
    gsap
      .timeline({ defaults: { overwrite: "auto" } })
      .to(indicator, {
        [axis]: offset,
        autoAlpha: 1,
        duration: 0.55,
        ease: "expo.out",
      })
      .fromTo(
        indicator,
        { [stretch]: 1.35 },
        { [stretch]: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" },
        0,
      );
  }, [activeIndex, axis, indicatorRef, itemsRef]);
}

export function AppSidebar() {
  const pathname = usePathname() ?? "/";
  const activeIndex = links.findIndex((link) =>
    isActiveLink(pathname, link.href),
  );

  const railRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const railIndicator = useRef<HTMLSpanElement>(null);
  const dockIndicator = useRef<HTMLSpanElement>(null);
  const railItems = useRef<(HTMLAnchorElement | null)[]>([]);
  const dockItems = useRef<(HTMLAnchorElement | null)[]>([]);

  useActiveIndicator(railIndicator, railItems, activeIndex, "y");
  useActiveIndicator(dockIndicator, dockItems, activeIndex, "x");

  // Entrance: the rail slides in from the edge, then its items drop in.
  useGsap(() => {
    const rail = railRef.current;
    const dock = dockRef.current;
    if (!rail || !dock) return;

    if (prefersReducedMotion()) {
      gsap.set([rail, dock], { autoAlpha: 1 });
      return;
    }

    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .fromTo(
        rail,
        { x: -96, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 1.1 },
      )
      .from(
        rail.querySelectorAll("[data-nav-item], [data-rail-extra]"),
        { x: -16, opacity: 0, duration: 0.6, stagger: 0.06 },
        0.25,
      )
      .fromTo(
        dock,
        { yPercent: 160, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 1.1 },
        0,
      )
      .from(
        dock.querySelectorAll("[data-nav-item], [data-rail-extra]"),
        { y: 12, opacity: 0, duration: 0.5, stagger: 0.05 },
        0.3,
      );
  }, railRef);

  const surface =
    "border border-border/70 bg-background/70 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.55)] backdrop-blur-md";

  return (
    <>
      <aside
        ref={railRef}
        data-reveal
        aria-label="Menu lateral"
        className={cn(
          "fixed bottom-3 left-3 top-3 z-50 hidden w-[60px] flex-col items-center justify-between rounded-2xl py-3 md:flex",
          surface,
        )}
      >
        <Link
          href="/"
          data-rail-extra
          aria-label="KWK Tech, página inicial"
          className="group/nav relative flex h-11 w-11 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src={logo}
            width={24}
            height={24}
            priority
            alt=""
            className="object-contain invert transition-transform duration-500 group-hover/nav:rotate-[-12deg] group-hover/nav:scale-110 dark:invert-0"
          />
          <span className="pointer-events-none absolute left-full top-1/2 ml-4 -translate-y-1/2 -translate-x-1 whitespace-nowrap rounded-lg border border-border/70 bg-popover/90 px-3 pb-1 pt-1.5 text-sm text-popover-foreground opacity-0 shadow-lg backdrop-blur-md transition duration-200 group-hover/nav:translate-x-0 group-hover/nav:opacity-100">
            © {new Date().getFullYear()} KWK Tech
          </span>
        </Link>

        <nav
          aria-label="Links principais"
          className="relative flex flex-col items-center gap-2"
        >
          <span
            ref={railIndicator}
            aria-hidden="true"
            className="invisible absolute left-0 top-0 h-11 w-11 origin-center rounded-xl bg-foreground/[0.08] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
          >
            <span className="absolute -left-[9px] top-2 bottom-2 w-[3px] rounded-full bg-gold shadow-[0_0_12px_var(--gold)]" />
          </span>
          {links.map((link, index) => (
            <NavItem
              key={link.href}
              link={link}
              orientation="vertical"
              active={index === activeIndex}
              itemRef={(element) => {
                railItems.current[index] = element;
              }}
            />
          ))}
        </nav>

        <div data-rail-extra>
          <ModeToggle className="h-11 w-11 rounded-xl border-0 bg-transparent shadow-none hover:bg-foreground/10 dark:bg-transparent dark:hover:bg-foreground/10" />
        </div>
      </aside>

      <nav
        ref={dockRef}
        data-reveal
        aria-label="Links principais"
        className={cn(
          "fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto flex w-fit items-center gap-1 rounded-2xl p-1.5 md:hidden",
          surface,
        )}
      >
        <div className="relative flex items-center gap-1">
          <span
            ref={dockIndicator}
            aria-hidden="true"
            className="invisible absolute left-0 top-0 h-11 w-11 origin-center rounded-xl bg-foreground/[0.08]"
          >
            <span className="absolute -bottom-[5px] left-3 right-3 h-[3px] rounded-full bg-gold shadow-[0_0_12px_var(--gold)]" />
          </span>
          {links.map((link, index) => (
            <NavItem
              key={link.href}
              link={link}
              orientation="horizontal"
              active={index === activeIndex}
              itemRef={(element) => {
                dockItems.current[index] = element;
              }}
            />
          ))}
        </div>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <div data-rail-extra>
          <ModeToggle className="h-11 w-11 rounded-xl border-0 bg-transparent shadow-none hover:bg-foreground/10 dark:bg-transparent dark:hover:bg-foreground/10" />
        </div>
      </nav>
    </>
  );
}
