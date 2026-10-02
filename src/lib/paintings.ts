import type { Painting } from "@/types/types";
import { data_painting } from "../../public/data/data.json";

export const PAINTINGS_PATH = "/assets/paintings";

type RawPainting = (typeof data_painting)[number];

export function toPainting(raw: RawPainting): Painting {
  return {
    ...raw,
    imagePainting: `${PAINTINGS_PATH}/${raw.imagePainting}`,
    alt: `Obra "${raw.namePainting}" (${raw.datePainting}) por Van Gogh.`,
  };
}

/** Every painting that has an image and known dimensions. */
export function getPaintings(): Painting[] {
  return (data_painting || [])
    .filter((p) => p.width && p.height && p.imagePainting)
    .map(toPainting);
}

export function getPaintingIds() {
  return (data_painting || []).map((p) => p.id);
}

/** A painting with its neighbours in the catalogue and its position. */
export function getPaintingWithNeighbours(id: string) {
  const index = (data_painting || []).findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const neighbour = (offset: number) => {
    const raw = data_painting[index + offset];
    return raw
      ? {
          id: raw.id,
          namePainting: raw.namePainting,
          imagePainting: `${PAINTINGS_PATH}/${raw.imagePainting}`,
          blurDataURL: raw.blurDataURL,
        }
      : undefined;
  };

  return {
    painting: toPainting(data_painting[index]),
    prevPainting: neighbour(-1),
    nextPainting: neighbour(1),
    position: index + 1,
    total: data_painting.length,
  };
}
