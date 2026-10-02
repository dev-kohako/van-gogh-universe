import * as THREE from "three";
import type { LabelContent } from "@/types/paintingDetails.type";

/** World units are meters. */
const DEFAULT_LONG_SIDE = 0.9;

/**
 * Resized copy of a painting served by the Next.js image optimizer. Several
 * originals are 6000px / 10MB+, far more than a texture needs.
 */
export function getOptimizedImageUrl(src: string, width: number, quality = 80) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** Texture width matching the screen: large enough to zoom into strokes. */
export function getTextureWidth(viewportWidth: number, pixelRatio: number) {
  return viewportWidth * Math.min(pixelRatio, 2) > 1400 ? 2048 : 1200;
}

/**
 * Real-world size of the canvas in meters. The aspect ratio comes from the
 * image itself; the scale from the catalogued dimensions ("73.7 cm × 92.1 cm"),
 * whose largest value is matched to the image's longest side.
 */
export function getPaintingSize(
  pixelWidth: number,
  pixelHeight: number,
  physicalDimensions?: string,
) {
  const values = (physicalDimensions ?? "")
    .replace(/,/g, ".")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((value) => value > 5 && value < 1000);

  const longSide =
    values && values.length >= 2
      ? Math.max(...values) / 100
      : DEFAULT_LONG_SIDE;

  const aspect = pixelWidth / pixelHeight;
  return aspect >= 1
    ? { width: longSide, height: longSide / aspect }
    : { width: longSide * aspect, height: longSide };
}

/** Frame proportions relative to the painting, in meters. */
export function getFrameMetrics(width: number, height: number) {
  const moulding = THREE.MathUtils.clamp(
    Math.min(width, height) * 0.1,
    0.045,
    0.11,
  );
  const slip = THREE.MathUtils.clamp(moulding * 0.28, 0.012, 0.025);
  return {
    /** Width of the outer moulding. */
    moulding,
    /** Width of the inner liner around the canvas. */
    slip,
    /** Distance from the canvas edge to the outer edge of the frame. */
    border: moulding + slip,
    /** How far the frame stands off the wall. */
    depth: 0.055,
    /** Canvas stretcher depth; the painted surface sits at this z. */
    canvasDepth: 0.025,
  };
}

/**
 * Camera distance that fits the framed painting (and its label) on screen for
 * the given vertical field of view and viewport aspect.
 */
export function getFitDistance(
  frameWidth: number,
  frameHeight: number,
  fov: number,
  aspect: number,
) {
  const tan = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  // Margins leave room for the viewer's header and toolbar.
  const byHeight = (frameHeight * 1.5) / 2 / tan;
  const byWidth = (frameWidth * 1.12) / 2 / (tan * aspect);
  return Math.max(byHeight, byWidth);
}

/**
 * Height field for the canvas: high-frequency luminance detail (brush strokes
 * and impasto ridges) plus a fine linen weave. Returns 0–255 values.
 */
export function computeCanvasRelief(
  luminance: Float32Array,
  width: number,
  height: number,
  { radius = 3, strength = 1.8, weave = 7 } = {},
) {
  const blurred = boxBlur(luminance, width, height, radius);
  const relief = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const detail = (luminance[i] - blurred[i]) * strength;
      const linen = Math.sin(x * 1.9) * Math.sin(y * 1.9) * weave;
      relief[i] = 128 + detail + linen;
    }
  }
  return relief;
}

/** Separable box blur (horizontal then vertical) with clamped edges. */
function boxBlur(
  source: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  const size = radius * 2 + 1;
  const horizontal = new Float32Array(source.length);
  const output = new Float32Array(source.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      sum += source[row + THREE.MathUtils.clamp(k, 0, width - 1)];
    }
    for (let x = 0; x < width; x++) {
      horizontal[row + x] = sum / size;
      const add = THREE.MathUtils.clamp(x + radius + 1, 0, width - 1);
      const remove = THREE.MathUtils.clamp(x - radius, 0, width - 1);
      sum += source[row + add] - source[row + remove];
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      sum += horizontal[THREE.MathUtils.clamp(k, 0, height - 1) * width + x];
    }
    for (let y = 0; y < height; y++) {
      output[y * width + x] = sum / size;
      const add = THREE.MathUtils.clamp(y + radius + 1, 0, height - 1);
      const remove = THREE.MathUtils.clamp(y - radius, 0, height - 1);
      sum += horizontal[add * width + x] - horizontal[remove * width + x];
    }
  }

  return output;
}

/** Bump map generated from the painting so grazing light reveals strokes. */
export function createCanvasBumpMap(
  image: CanvasImageSource & { width: number; height: number },
  maxSize = 1024,
) {
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < luminance.length; i++) {
    const p = i * 4;
    luminance[i] =
      0.2126 * pixels.data[p] +
      0.7152 * pixels.data[p + 1] +
      0.0722 * pixels.data[p + 2];
  }

  const relief = computeCanvasRelief(luminance, width, height);
  for (let i = 0; i < relief.length; i++) {
    const p = i * 4;
    pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = relief[i];
    pixels.data[p + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/** Subtle plaster noise for the gallery wall. */
export function createPlasterBumpMap(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const pixels = context.createImageData(size, size);
  let seed = 1337;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < size * size; i++) {
    const value = 112 + random() * 32;
    pixels.data[i * 4] =
      pixels.data[i * 4 + 1] =
      pixels.data[i * 4 + 2] =
        value;
    pixels.data[i * 4 + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 14);
  return texture;
}

/**
 * Soft drop shadow (alpha only) for an object hanging on the wall, drawn with
 * the 2D canvas shadow blur. Returns the texture and how much larger than the
 * object the shadow quad must be to fit the blur.
 */
export function createSoftShadowTexture(aspect: number, blur = 0.06) {
  const size = 512;
  const width = aspect >= 1 ? size : Math.round(size * aspect);
  const height = aspect >= 1 ? Math.round(size / aspect) : size;
  const pad = Math.round(Math.max(width, height) * blur * 1.5);

  const canvas = document.createElement("canvas");
  canvas.width = width + pad * 2;
  canvas.height = height + pad * 2;
  const context = canvas.getContext("2d");
  if (!context) return null;

  // alphaMap reads the green channel: white shadow on black = opacity.
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  // Draw the rectangle far off-canvas so only its blurred shadow lands here.
  const offset = canvas.width * 4;
  context.fillStyle = "#fff";
  context.shadowColor = "#fff";
  context.shadowBlur = Math.max(width, height) * blur;
  context.shadowOffsetX = offset;
  context.fillRect(pad - offset, pad, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return {
    texture,
    scaleX: canvas.width / width,
    scaleY: canvas.height / height,
  };
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Museum wall label rendered with the page font into a texture. */
export function createLabelTexture(
  { title, subtitle, lines }: LabelContent,
  fontFamily: string,
) {
  const width = 1024;
  const height = 640;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#f4f0e6";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(0,0,0,0.08)";
  context.lineWidth = 6;
  context.strokeRect(3, 3, width - 6, height - 6);

  const padding = 72;
  const maxWidth = width - padding * 2;
  let y = padding + 40;

  context.fillStyle = "#1c1917";
  context.textBaseline = "alphabetic";
  context.font = `700 58px ${fontFamily}`;
  for (const line of wrapText(context, title, maxWidth).slice(0, 2)) {
    context.fillText(line, padding, y);
    y += 68;
  }

  y += 4;
  context.fillStyle = "#44403c";
  context.font = `500 38px ${fontFamily}`;
  context.fillText(subtitle, padding, y);
  y += 30;

  context.fillStyle = "#a8a29e";
  context.fillRect(padding, y, 96, 4);
  y += 58;

  context.fillStyle = "#57534e";
  context.font = `400 32px ${fontFamily}`;
  for (const text of lines) {
    for (const line of wrapText(context, text, maxWidth)) {
      if (y > height - padding / 2) break;
      context.fillText(line, padding, y);
      y += 44;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Downloads an image reporting progress (0–1) and decodes it off the main
 * thread before it is uploaded as a texture.
 */
export async function loadImageWithProgress(
  url: string,
  onProgress: (progress: number) => void,
  { responseTimeout = 15000 }: { responseTimeout?: number } = {},
) {
  // Only the wait for the response is bounded: a slow but progressing
  // download is fine, a request that never answers is not.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), responseTimeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`Falha ao carregar a imagem (${response.status})`);
  }

  const total = Number(response.headers.get("Content-Length")) || 0;
  let blob: Blob;
  if (response.body && total > 0) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress(Math.min(0.99, loaded / total));
    }
    blob = new Blob(chunks as BlobPart[], {
      type: response.headers.get("Content-Type") ?? "image/jpeg",
    });
  } else {
    blob = await response.blob();
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    onProgress(1);
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

type ImageEntry = {
  promise: Promise<HTMLImageElement>;
  progress: number | null;
  listeners: Set<(progress: number) => void>;
};

const MAX_CACHED_IMAGES = 3;
const imageCache = new Map<string, ImageEntry>();

/**
 * Shared, cached image loads. Remounts (React StrictMode, closing and
 * reopening the viewer) reuse the same request instead of aborting and
 * re-fetching it, and recently viewed paintings open instantly.
 */
export function loadCachedImage(
  sources: string[],
  onProgress: (progress: number) => void,
) {
  const url = sources[0];
  let entry = imageCache.get(url);
  if (entry) {
    // Refresh its position in the LRU order.
    imageCache.delete(url);
  } else {
    const listeners = new Set<(progress: number) => void>();
    const created: ImageEntry = {
      progress: null,
      listeners,
      promise: Promise.resolve(null as unknown as HTMLImageElement),
    };
    const report = (progress: number) => {
      created.progress = progress;
      for (const listener of listeners) listener(progress);
    };
    // Try each source in order (e.g. the optimized copy, then the original).
    created.promise = sources
      .slice(1)
      .reduce<Promise<HTMLImageElement>>(
        (attempt, source) =>
          attempt.catch(() => loadImageWithProgress(source, report)),
        loadImageWithProgress(url, report),
      )
      .catch((error) => {
        imageCache.delete(url);
        throw error;
      });
    entry = created;
  }
  imageCache.set(url, entry);
  while (imageCache.size > MAX_CACHED_IMAGES) {
    const oldest = imageCache.keys().next().value;
    if (oldest === undefined) break;
    imageCache.delete(oldest);
  }

  const current = entry;
  current.listeners.add(onProgress);
  if (current.progress !== null) onProgress(current.progress);

  return {
    promise: current.promise,
    unsubscribe: () => current.listeners.delete(onProgress),
  };
}
