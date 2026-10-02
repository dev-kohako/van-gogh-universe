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
// Fills in missing dimensions, color palettes and blur placeholders.
// --force recomputes palettes and placeholders for every painting.
const force = process.argv.includes("--force");

const dataFilePath = path.join(process.cwd(), "public/data/data.json");
const imagesDir = path.join(process.cwd(), "public/assets/paintings");

// Analysis size for the palette. "nearest" keeps the original brush stroke
// colors instead of blending neighbours into muddier averages.
const PALETTE_SAMPLE_SIZE = 200;
const BLUR_SIZE = 16;

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

  if (!updated.width || !updated.height) {
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
