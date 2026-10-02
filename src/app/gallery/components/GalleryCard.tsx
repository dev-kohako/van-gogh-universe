"use client";

import Image from "next/image";
import { useState } from "react";
import { getOptimizedImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";
import type { PaintingCardProps } from "@/types/galleryTypes.type";

/** How many cards are above the fold on a large screen. */
const EAGER_COUNT = 5;

export function GalleryCard({ painting, index }: PaintingCardProps) {
  const [loaded, setLoaded] = useState(false);
  const isPriority = index < EAGER_COUNT;

  return (
    <a
      // The lightbox opens a resized copy: some originals weigh 10–70 MB.
      href={getOptimizedImageUrl(painting.imagePainting, 2048)}
      data-thumb={getOptimizedImageUrl(painting.imagePainting, 256, 70)}
      data-gallery-item
      data-reveal
      data-sub-html={`
        <div class="custom-caption">
          <h4>${painting.namePainting}</h4>
          <p><strong>Data:</strong> ${painting.datePainting}</p>
        </div>
      `}
      aria-label={`Ampliar ${painting.namePainting}`}
      className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-md bg-muted shadow-[0_18px_40px_-22px_rgb(0_0_0/0.7)] outline-none ring-gold/60 transition-shadow duration-500 hover:shadow-[0_26px_50px_-20px_rgb(0_0_0/0.8)] focus-visible:ring-2 sm:mb-5"
      style={{ aspectRatio: painting.width / painting.height }}
    >
      <figure className="m-0 h-full w-full">
        <Image
          src={painting.imagePainting}
          alt={painting.alt}
          width={painting.width}
          height={painting.height}
          placeholder={painting.blurDataURL ? "blur" : "empty"}
          blurDataURL={painting.blurDataURL}
          priority={isPriority}
          loading={isPriority ? "eager" : "lazy"}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          onLoad={() => setLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.06]",
            !loaded && "scale-105 blur-md",
          )}
        />
        <figcaption
          aria-hidden="true"
          className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 sm:p-4"
        >
          <span className="translate-y-3 text-sm font-semibold leading-tight text-zinc-50 transition-transform duration-500 group-hover:translate-y-0 sm:text-base">
            {painting.namePainting}
          </span>
          <span className="mt-0.5 translate-y-3 text-xs text-amber-200/90 transition-transform delay-75 duration-500 group-hover:translate-y-0">
            {painting.datePainting}
          </span>
        </figcaption>
      </figure>
    </a>
  );
}
