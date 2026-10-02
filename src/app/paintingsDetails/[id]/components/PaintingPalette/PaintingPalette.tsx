"use client";

import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { motion } from "framer-motion";
import { PaletteProps } from "@/types/paintingDetails.type";
import { formatShare } from "@/lib/palette";
import { ColorSwatch } from "./ColorSwatch";

export function PaintingPalette({ colors }: PaletteProps) {
  const handleCopyToClipboard = (color: string) => {
    if (copy(color.toUpperCase())) {
      toast.success(`Cor ${color.toUpperCase()} copiada com sucesso!`);
    } else {
      toast.error("Falha ao copiar a cor.");
    }
  };

  const totalShare = colors.reduce((sum, color) => sum + color.share, 0) || 1;

  return (
    <section aria-labelledby="palette-heading" className="mt-10">
      <div className="mb-4">
        <h3
          id="palette-heading"
          className="text-lg font-semibold text-foreground"
        >
          Paleta de cores
        </h3>
        <p className="text-sm text-muted-foreground">
          Cores predominantes extraídas da obra. Clique para copiar.
        </p>
      </div>

      <div
        className="flex h-3 w-full max-w-md overflow-hidden rounded-full border border-border mb-5"
        role="img"
        aria-label={`Proporção das cores: ${colors
          .map((color) => `${color.hex} ${formatShare(color.share)}`)
          .join(", ")}`}
      >
        {colors.map((color, i) => (
          <motion.span
            key={color.hex}
            className="h-full"
            style={{ backgroundColor: color.hex }}
            initial={{ width: 0 }}
            animate={{ width: `${(color.share / totalShare) * 100}%` }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: 0.3 + i * 0.08,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-3 lg:gap-5 w-fit">
        {colors.map((color) => (
          <ColorSwatch
            key={color.hex}
            color={color.hex}
            share={color.share}
            onCopy={handleCopyToClipboard}
          />
        ))}
      </div>
    </section>
  );
}
