/**
 * Perceptual color palette extraction.
 *
 * Pixels are clustered with k-means in OKLab (a perceptually uniform color
 * space, so distances match how different two colors *look*). Clusters are
 * then ranked by how much of the image they cover, with a boost for chroma so
 * vivid accents (Van Gogh's yellows and blues) are not drowned out by large
 * neutral areas, and picked greedily so every swatch is visibly distinct.
 */

export type PaletteColor = {
  hex: string;
  /** Fraction of the image (0–1) closest to this color. */
  share: number;
};

export type ExtractPaletteOptions = {
  /** Number of colors to return. */
  count?: number;
  /** Number of k-means clusters computed before selection. */
  clusters?: number;
  /** Minimum OKLab distance between two returned colors. */
  minDistance?: number;
  /** Bytes per pixel in `pixels` (3 for RGB, 4 for RGBA). */
  channels?: number;
  /** Maximum k-means iterations. */
  maxIterations?: number;
};

type Lab = [number, number, number];

type Cluster = {
  /** Cluster centroid, used to assign pixels. */
  center: Lab;
  /** Saturation-preserving color shown to the user. */
  color: Lab;
  share: number;
};

const srgbToLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const linearToSrgb = (v: number) => {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, A, B]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;

  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Formats a 0–1 share as a rounded percentage, e.g. 0.314 -> "31%". */
export function formatShare(share: number) {
  const percent = share * 100;
  return percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const distanceSq = (a: Lab, b: Lab) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

export const oklabDistance = (a: Lab, b: Lab) => Math.sqrt(distanceSq(a, b));

const chroma = (c: Lab) => Math.hypot(c[1], c[2]);

/** OKLab distance from which two colors count as fully distinct. */
const FULL_CONTRAST = 0.15;
const MIN_ACCENT_CHROMA = 0.06;
const MIN_ACCENT_SHARE = 0.004;

/** Small deterministic PRNG so the same image always yields the same palette. */
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function nearest(point: Lab, centers: Lab[]) {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < centers.length; i++) {
    const d = distanceSq(point, centers[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function kMeans(points: Lab[], k: number, maxIterations: number) {
  const random = mulberry32(points.length * 7919 + k);

  // k-means++ seeding spreads the initial centers across the color space.
  const centers: Lab[] = [points[Math.floor(random() * points.length)]];
  const minDist = points.map((p) => distanceSq(p, centers[0]));
  while (centers.length < k) {
    const total = minDist.reduce((sum, d) => sum + d, 0);
    if (total === 0) break;
    let target = random() * total;
    let index = 0;
    while (index < points.length - 1 && target > minDist[index]) {
      target -= minDist[index];
      index++;
    }
    const center = points[index];
    centers.push(center);
    for (let i = 0; i < points.length; i++) {
      minDist[i] = Math.min(minDist[i], distanceSq(points[i], center));
    }
  }

  const assignments = new Int32Array(points.length);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      const cluster = nearest(points[i], centers);
      if (cluster !== assignments[i]) {
        assignments[i] = cluster;
        changed = true;
      }
    }

    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const sum = sums[assignments[i]];
      sum[0] += points[i][0];
      sum[1] += points[i][1];
      sum[2] += points[i][2];
      sum[3]++;
    }
    sums.forEach(([l, a, b, n], i) => {
      if (n > 0) centers[i] = [l / n, a / n, b / n];
    });

    if (!changed && iteration > 0) break;
  }

  // Averaging a cluster's a/b components desaturates it whenever its members
  // vary in hue, so the representative color keeps the mean hue direction but
  // takes the mean chroma of its members instead.
  const stats = centers.map(() => ({ chroma: 0, size: 0 }));
  for (let i = 0; i < points.length; i++) {
    const stat = stats[assignments[i]];
    stat.chroma += chroma(points[i]);
    stat.size++;
  }

  return centers
    .map((center, i): Cluster => {
      const { size } = stats[i];
      const currentChroma = chroma(center);
      const meanChroma = size > 0 ? stats[i].chroma / size : 0;
      const scale = currentChroma > 1e-6 ? meanChroma / currentChroma : 1;
      return {
        center,
        color: [center[0], center[1] * scale, center[2] * scale],
        share: size / points.length,
      };
    })
    .filter((cluster) => cluster.share > 0);
}

export function extractPalette(
  pixels: ArrayLike<number>,
  {
    count = 5,
    clusters = 24,
    minDistance = 0.09,
    channels = 4,
    maxIterations = 24,
  }: ExtractPaletteOptions = {},
): PaletteColor[] {
  const points: Lab[] = [];
  for (let i = 0; i + 2 < pixels.length; i += channels) {
    if (channels === 4 && pixels[i + 3] < 128) continue;
    points.push(rgbToOklab(pixels[i], pixels[i + 1], pixels[i + 2]));
  }
  if (points.length === 0) return [];

  const candidates = kMeans(
    points,
    Math.min(clusters, points.length),
    maxIterations,
  );

  // Base relevance: coverage, with a boost for saturated colors.
  const relevance = (c: Cluster) => c.share ** 0.5 * (1 + 4 * chroma(c.color));
  // Accents (e.g. the yellow stars of "The Starry Night") cover a tiny area
  // but define the painting, so the last slot ranks mostly by saturation.
  const accentRelevance = (c: Cluster) => chroma(c.color) * c.share ** 0.25;
  const isAccent = (c: Cluster) =>
    chroma(c.color) >= MIN_ACCENT_CHROMA && c.share >= MIN_ACCENT_SHARE;

  const selected: Cluster[] = [];
  const separation = (c: Cluster) =>
    selected.reduce(
      (min, s) => Math.min(min, oklabDistance(s.color, c.color)),
      Number.POSITIVE_INFINITY,
    );

  // Maximal-marginal-relevance pick: relevance is discounted for colors close
  // to the ones already chosen, and anything under `threshold` is skipped.
  const pick = (
    score: (c: Cluster) => number,
    threshold: number,
    eligible: (c: Cluster) => boolean = () => true,
  ) => {
    let best: Cluster | undefined;
    let bestScore = 0;
    for (const candidate of candidates) {
      if (selected.includes(candidate) || !eligible(candidate)) continue;
      const distance = separation(candidate);
      if (distance < threshold) continue;
      const value = score(candidate) * Math.min(1, distance / FULL_CONTRAST);
      if (value > bestScore) {
        bestScore = value;
        best = candidate;
      }
    }
    return best;
  };

  const target = Math.min(count, candidates.length);
  let threshold = minDistance;
  // The threshold is relaxed for low-contrast images until the palette fills.
  while (selected.length < target && threshold > 0.002) {
    const accentSlot = count > 2 && selected.length === count - 1;
    const next =
      (accentSlot && pick(accentRelevance, threshold, isAccent)) ||
      pick(relevance, threshold);
    if (next) selected.push(next);
    else threshold *= 0.75;
  }

  // Shares are recomputed against the final palette so they add up to 1.
  const centers = selected.map((cluster) => cluster.center);
  const totals = new Array(selected.length).fill(0);
  for (const point of points) totals[nearest(point, centers)]++;

  return selected
    .map((cluster, i) => ({
      hex: rgbToHex(...oklabToRgb(cluster.color)),
      share: Math.round((totals[i] / points.length) * 1000) / 1000,
    }))
    .sort((a, b) => b.share - a.share);
}
