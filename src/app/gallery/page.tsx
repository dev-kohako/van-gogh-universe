import { getPaintings } from "@/lib/paintings";
import type { GalleryPainting } from "@/types/galleryTypes.type";
import { GalleryClient } from "./GalleryClient";

export default function GalleryPage() {
  // Only what the wall needs is sent to the browser.
  const paintings: GalleryPainting[] = getPaintings().map(
    ({
      id,
      namePainting,
      datePainting,
      imagePainting,
      width,
      height,
      blurDataURL,
      alt,
    }) => ({
      id,
      namePainting,
      datePainting,
      imagePainting,
      width,
      height,
      blurDataURL,
      alt,
    }),
  );

  return <GalleryClient paintings={paintings} />;
}
