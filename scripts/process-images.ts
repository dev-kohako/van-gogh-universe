import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { extractPalette, type PaletteColor } from "../src/lib/palette";

interface Painting {
  id: string;
  namePainting: string;
  imagePainting: string;
  width?: number;
  height?: number;
  palette?: PaletteColor[];
  blurDataURL?: string;
  [key: string]: unknown;
}

interface PaintingsData {
  data_painting: Painting[];
}

// Usage: bun scripts/process-images.ts [--force]
// Shrinks oversized originals, fills in missing dimensions, color palettes
// and blur placeholders.
// --force recomputes palettes and placeholders for every painting.
const force = process.argv.includes("--force");

const dataFilePath = path.join(process.cwd(), "public/data/data.json");
const imagesDir = path.join(process.cwd(), "public/assets/paintings");

// Analysis size for the palette. "nearest" keeps the original brush stroke
// colors instead of blending neighbours into muddier averages.
const PALETTE_SAMPLE_SIZE = 200;
const BLUR_SIZE = 16;

// Originals larger than this are resized: 4096px is sharper than any screen
// needs (and enough to zoom in), while 10–70 MB files make the image
// optimizer, the lightbox and the 3D textures slow. Files saved at very high
// JPEG quality (over 1 byte per pixel) are re-encoded too; the output of this
// script is far below that, so it is never re-encoded twice.
const MAX_ORIGINAL_SIDE = 4096;
const MAX_BYTES_PER_PIXEL = 1;

/** Re-encodes an oversized original in place. Returns true if it changed. */
async function shrinkOriginal(imagePath: string) {
  const { size } = fs.statSync(imagePath);
  const { width = 0, height = 0 } = await sharp(imagePath).metadata();
  if (
    Math.max(width, height) <= MAX_ORIGINAL_SIDE &&
    size / Math.max(1, width * height) <= MAX_BYTES_PER_PIXEL
  ) {
    return false;
  }

  const buffer = await sharp(imagePath)
    .rotate()
    .resize(MAX_ORIGINAL_SIDE, MAX_ORIGINAL_SIDE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  if (buffer.length >= size) return false;

  fs.writeFileSync(imagePath, buffer);
  console.log(
    `Reduzida: ${path.basename(imagePath)} ${(size / 1e6).toFixed(1)} MB -> ${(buffer.length / 1e6).toFixed(1)} MB`,
  );
  return true;
}

async function computePalette(imagePath: string) {
  const { data, info } = await sharp(imagePath)
    .rotate()
    .resize(PALETTE_SAMPLE_SIZE, PALETTE_SAMPLE_SIZE, {
      fit: "inside",
      kernel: "nearest",
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return extractPalette(data, { channels: info.channels, count: 5 });
}

async function computeBlurDataURL(imagePath: string) {
  const buffer = await sharp(imagePath)
    .rotate()
    .resize(BLUR_SIZE, BLUR_SIZE, { fit: "inside" })
    .webp({ quality: 50 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

async function processPainting(painting: Painting): Promise<Painting> {
  const imagePath = path.join(imagesDir, painting.imagePainting);

  if (!fs.existsSync(imagePath)) {
    console.warn(
      `AVISO: Imagem não encontrada para "${painting.namePainting}". Arquivo: ${painting.imagePainting}`,
    );
    return painting;
  }

  const updated: Painting = { ...painting };
  const shrunk = await shrinkOriginal(imagePath);

  if (shrunk || !updated.width || !updated.height) {
    const { width, height } = await sharp(imagePath).metadata();
    updated.width = width;
    updated.height = height;
  }

  if (force || !updated.palette?.length) {
    updated.palette = await computePalette(imagePath);
  }

  // Legacy fixed palette fields, replaced by `palette`.
  for (const key of ["color1", "color2", "color3", "color4", "color5"]) {
    delete updated[key];
  }

  if (force || !updated.blurDataURL) {
    updated.blurDataURL = await computeBlurDataURL(imagePath);
  }

  console.log(
    `Processando: ${painting.imagePainting} -> ${updated.width}x${updated.height} | ${updated.palette
      ?.map((color) => color.hex)
      .join(" ")}`,
  );

  return updated;
}

async function main() {
  console.log("Iniciando o processamento de imagens...");

  const data: PaintingsData = JSON.parse(
    fs.readFileSync(dataFilePath, "utf-8"),
  );

  const updatedPaintings: Painting[] = [];
  for (const painting of data.data_painting) {
    updatedPaintings.push(await processPainting(painting));
  }

  fs.writeFileSync(
    dataFilePath,
    `${JSON.stringify({ data_painting: updatedPaintings }, null, 2)}\n`,
  );

  console.log(
    "✅ Processamento concluído! O arquivo data.json foi atualizado com dimensões, paletas e placeholders.",
  );
}

main().catch((error) => {
  console.error("❌ Erro durante o processamento das imagens:", error);
  process.exit(1);
});
