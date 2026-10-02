"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type {
  PaintingLink,
  PaintingNavigationProps,
} from "@/types/paintingDetails.type";

function NeighbourLink({
  painting,
  direction,
}: {
  painting: PaintingLink;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Pintura anterior" : "Pintura seguinte";

  if (!painting) {
    return (
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 text-muted-foreground/40"
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <Link
      href={`/paintingsDetails/${painting.id}`}
      aria-label={`${label}: ${painting.namePainting}`}
      className="group/neighbour relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur-sm transition-colors hover:border-gold/70 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {/* Peek at the neighbouring painting. */}
      {painting.imagePainting && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-full z-30 mt-3 hidden w-44 origin-top-right scale-95 overflow-hidden rounded-lg border border-border/70 bg-popover/95 opacity-0 shadow-xl backdrop-blur-md transition duration-300 group-hover/neighbour:scale-100 group-hover/neighbour:opacity-100 md:block"
        >
          <span className="relative block aspect-[4/3] w-full bg-muted">
            <Image
              src={painting.imagePainting}
              alt=""
              fill
              sizes="176px"
              placeholder={painting.blurDataURL ? "blur" : "empty"}
              blurDataURL={painting.blurDataURL}
              className="object-cover"
            />
          </span>
          <span className="block truncate px-3 pb-1.5 pt-2 text-left text-xs">
            {painting.namePainting}
          </span>
        </span>
      )}
    </Link>
  );
}

export function PaintingNavigation({
  prevPainting,
  nextPainting,
  position,
  total,
}: PaintingNavigationProps) {
  return (
    <nav
      aria-label="Navegar entre pinturas"
      className="flex items-center gap-3"
    >
      {position && total ? (
        <p className="hidden text-sm tabular-nums text-muted-foreground sm:block">
          <span className="text-foreground">
            {String(position).padStart(2, "0")}
          </span>{" "}
          / {total}
        </p>
      ) : null}
      <NeighbourLink painting={prevPainting} direction="prev" />
      <NeighbourLink painting={nextPainting} direction="next" />
    </nav>
  );
}
