"use client";

import { memo, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import type { Painting } from "@/types/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { usePaintingAnimations } from "./usePaintingAnimations";

const MotionImage = motion.create(Image);

export const PaintingCard = memo(function PaintingCard({
  photo,
  isActive,
  onCardClick,
  index,
}: {
  photo: Painting;
  isActive: boolean;
  onCardClick: (id: string) => void;
  index: number;
}) {
  const {
    imageVariants,
    overlayVariants,
    titleVariants,
    dateVariants,
    buttonVariants,
    descriptionTitleVariants,
    descriptionDateVariants,
  } = usePaintingAnimations();

  const [loaded, setLoaded] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCardClick(photo.id);
    }
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby={`painting-title-${photo.id}`}
      className="group relative block w-full border overflow-hidden rounded-lg bg-transparent transition-all shadow-md"
      initial="initial"
      animate={isActive ? "hover" : "initial"}
      whileHover="hover"
      onClick={() => onCardClick(photo.id)}
    >
      <motion.figure className="m-0 relative">
        {/* Blurred preview of the painting + shimmer until the image arrives. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-64 overflow-hidden bg-muted transition-opacity duration-700",
            loaded && "opacity-0",
          )}
        >
          {photo.blurDataURL && (
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
              style={{ backgroundImage: `url(${photo.blurDataURL})` }}
            />
          )}
          {!loaded && <div className="shimmer absolute inset-0" />}
        </div>
        <MotionImage
          src={photo.imagePainting}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={index < 6 ? "eager" : "lazy"}
          sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={cn(
            "relative h-64 w-full object-cover transition-opacity duration-700 ease-out",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
          variants={imageVariants}
        />

        <motion.figcaption
          variants={overlayVariants}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs"
        >
          <motion.span
            variants={titleVariants}
            className="px-14 text-center text-lg font-semibold text-zinc-50"
          >
            {photo.namePainting}
          </motion.span>
          <motion.p
            variants={dateVariants}
            className="text-sm text-muted-foreground mb-4"
          >
            {photo.datePainting}
          </motion.p>
          <motion.div variants={buttonVariants}>
            <Button
              className="pb-1 bg-zinc-300 hover:bg-zinc-300/90 text-zinc-800"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/paintingsDetails/${photo.id}`}>Ver detalhes</Link>
            </Button>
          </motion.div>
        </motion.figcaption>
      </motion.figure>

      <div className="px-3 py-2 text-center">
        <motion.h2
          id={`painting-title-${photo.id}`}
          variants={descriptionTitleVariants}
          className="text-base font-medium truncate"
        >
          {photo.namePainting}
        </motion.h2>
        <motion.p
          variants={descriptionDateVariants}
          className="text-sm text-muted-foreground -mb-1"
        >
          {photo.datePainting}
        </motion.p>
      </div>
    </motion.article>
  );
});
