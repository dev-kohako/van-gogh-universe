"use client";

import { memo, useMemo } from "react";
import type { InfoGridProps } from "@/types/about.type";
import { vanGoghInfo } from "../../../../public/data/vanGoghInfos";

export function formatLabel(label: string) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

const InfoGrid = memo(function InfoGrid({ data }: InfoGridProps) {
  const entries = useMemo(() => Object.entries(data), [data]);

  return (
    <dl
      className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2"
      aria-label="Informações biográficas de Van Gogh"
    >
      {entries.map(([label, value]) => (
        <div
          key={label}
          data-bio-field
          className={Array.isArray(value) ? "sm:col-span-2" : undefined}
        >
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {formatLabel(label)}:
          </dt>
          <dd className="mt-0.5 text-base text-foreground">
            {Array.isArray(value) ? value.join(", ") : value}
          </dd>
        </div>
      ))}
    </dl>
  );
});

/** Museum placard about the artist. */
export default function VanGoghDetails() {
  return (
    <section aria-labelledby="artist-title" className="space-y-6">
      <h2
        id="artist-title"
        data-bio-title
        className="text-4xl font-semibold leading-tight text-foreground md:text-5xl"
      >
        Vincent Willem
        <br />
        <span className="text-gilded">Van Gogh</span>
      </h2>

      <InfoGrid data={vanGoghInfo} />
    </section>
  );
}
