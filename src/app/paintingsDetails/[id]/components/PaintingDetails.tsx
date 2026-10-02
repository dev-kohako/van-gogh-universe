"use client";

import { motion } from "framer-motion";
import React from "react";
import { PaintingDetailsProps } from "@/types/paintingDetails.type";
import { PaintingPalette } from "./PaintingPalette/PaintingPalette";
import { capitalizeFirst } from "@/lib/utils";

export function PaintingDetails({ painting }: PaintingDetailsProps) {
  const details = [
    { label: "Título original:", value: painting.originalTitle },
    { label: "Data:", value: painting.datePainting },
    { label: "Local:", value: painting.local },
    { label: "Materiais:", value: painting.materials },
    { label: "Estilo:", value: painting.style },
    { label: "Dimensões:", value: painting.physicalDimensions },
    { label: "Período:", value: painting.period },
    { label: "Gênero:", value: painting.genre },
  ];

  const colors = (painting.palette ?? []).filter((color) => color.hex);

  return (
    <motion.article
      aria-label="Detalhes da pintura"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      className="space-y-6 text-lg leading-relaxed"
    >
      <dl>
        {details.map((item) =>
          item.value ? (
            <div
              key={item.label}
              className="flex items-baseline text-lg lg:text-xl gap-2 space-y-4"
            >
              <dt className="font-bold text-nowrap">{item.label}</dt>
              <dd className="font-light ">{capitalizeFirst(item.value)}</dd>
            </div>
          ) : null,
        )}
      </dl>

      {painting.description && (
        <p className="text-muted-foreground text-base pt-4 border-t">
          {painting.description}
        </p>
      )}

      {colors.length > 0 && <PaintingPalette colors={colors} />}
    </motion.article>
  );
}
