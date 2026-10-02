import type { Painting } from "./types";

/** What the gallery needs to show a painting. */
export type GalleryPainting = Pick<
  Painting,
  | "id"
  | "namePainting"
  | "datePainting"
  | "imagePainting"
  | "width"
  | "height"
  | "blurDataURL"
  | "alt"
>;

export interface PaintingCardProps {
  painting: GalleryPainting;
  index: number;
}

export interface GalleryClientProps {
  paintings: GalleryPainting[];
}
