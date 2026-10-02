"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  function handleToggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
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
