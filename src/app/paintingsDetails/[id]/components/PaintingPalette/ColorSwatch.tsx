"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { ColorSwatchProps } from "@/types/paintingDetails.type";
import { cn } from "@/lib/utils";
import { formatShare } from "@/lib/palette";

function isLightColor(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(value)) return false;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export function ColorSwatch({
  color,
  share,
  onCopy,
  active = false,
  onActiveChange,
}: ColorSwatchProps) {
  const [isCopied, setIsCopied] = useState(false);
  const light = isLightColor(color);

  useEffect(() => {
    if (!isCopied) return;

    const timerId = setTimeout(() => {
      setIsCopied(false);
    }, 1500);

    return () => clearTimeout(timerId);
  }, [isCopied]);

  const handleCopy = () => {
    onCopy(color);
    setIsCopied(true);
  };

  const shareLabel =
    share !== undefined ? ` (${formatShare(share)} da obra)` : "";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        onClick={handleCopy}
        whileHover={{
          scale: 1.1,
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
        }}
        whileTap={{ scale: 0.92 }}
        animate={{ scale: active ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onPointerEnter={() => onActiveChange?.(true)}
        onPointerLeave={() => onActiveChange?.(false)}
        onFocus={() => onActiveChange?.(true)}
        onBlur={() => onActiveChange?.(false)}
        aria-label={
          isCopied
            ? `Cor ${color} copiada!`
            : `Copiar cor ${color}${shareLabel}`
        }
        className="group relative size-11 min-[380px]:size-12 sm:size-14 short:size-11 rounded-full border border-border shadow-lg cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ backgroundColor: color }}
      >
        <AnimatePresence>
          {isCopied ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full"
            >
              <Check className="text-zinc-50 w-6 h-6" aria-hidden="true" />
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity rounded-full">
              <Copy
                className={cn(
                  "w-5 h-5 opacity-80",
                  light ? "text-zinc-900" : "text-zinc-50",
                )}
                aria-hidden="true"
              />
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      <span
        className="flex flex-col items-center leading-tight text-[0.65rem] min-[380px]:text-xs"
        aria-hidden="true"
      >
        <span className="font-medium uppercase tracking-wide tabular-nums">
          {color}
        </span>
        {share !== undefined && (
          <span className="text-muted-foreground tabular-nums">
            {formatShare(share)}
          </span>
        )}
      </span>
    </div>
  );
}
