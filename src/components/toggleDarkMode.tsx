"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type MouseEvent, useEffect, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // `theme` can be "system", so the toggle must be based on the theme that is
  // actually applied; otherwise the first click only pins the current mode.
  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted
    ? "Alternar tema"
    : isDark
      ? "Ativar modo claro"
      : "Ativar modo escuro";

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const doc = document as ViewTransitionDocument;
    if (!doc.startViewTransition || prefersReducedMotion()) {
      setTheme(next);
      return;
    }

    // The new theme spreads from the button like light filling the room.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 700,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      className={cn(
        "relative h-7 w-7 pb-1 cursor-pointer bg-background dark:bg-background z-[9999]",
        className,
      )}
      onClick={handleToggle}
    >
      <Sun
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
