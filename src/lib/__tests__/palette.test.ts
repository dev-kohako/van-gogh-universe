import {
  extractPalette,
  formatShare,
  oklabDistance,
  oklabToRgb,
  rgbToHex,
  rgbToOklab,
} from "../palette";

type RGB = [number, number, number];

/** Builds an RGBA buffer with each color repeated `count` times. */
function image(regions: { color: RGB; count: number }[]) {
  const pixels: number[] = [];
  for (const { color, count } of regions) {
    for (let i = 0; i < count; i++) pixels.push(...color, 255);
  }
  return Uint8ClampedArray.from(pixels);
}

const hexToRgb = (hex: string): RGB => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const closeTo = (hex: string, target: RGB, tolerance = 0.02) =>
  oklabDistance(rgbToOklab(...hexToRgb(hex)), rgbToOklab(...target)) <
  tolerance;

describe("palette color conversions", () => {
  it("round-trips sRGB through OKLab", () => {
    const samples: RGB[] = [
      [0, 0, 0],
      [255, 255, 255],
      [177, 156, 43],
      [28, 52, 112],
      [200, 30, 90],
    ];
    for (const rgb of samples) {
      expect(oklabToRgb(rgbToOklab(...rgb))).toEqual(rgb);
    }
  });

  it("formats hex and share values", () => {
    expect(rgbToHex(255, 204, 0)).toBe("#ffcc00");
    expect(formatShare(0.314)).toBe("31%");
    expect(formatShare(0.004)).toBe("<1%");
  });
});

describe("extractPalette", () => {
  const blue: RGB = [40, 70, 150];
  const night: RGB = [20, 25, 30];
  const sky: RGB = [110, 140, 170];
  const yellow: RGB = [230, 200, 40];

  const starryNight = image([
    { color: blue, count: 500 },
    { color: night, count: 250 },
    { color: sky, count: 220 },
    { color: yellow, count: 30 },
  ]);

  it("returns the requested number of colors sorted by share", () => {
    const palette = extractPalette(starryNight, { count: 4 });

    expect(palette).toHaveLength(4);
    const shares = palette.map((color) => color.share);
    expect([...shares].sort((a, b) => b - a)).toEqual(shares);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 2);
  });

  it("keeps small but saturated accents", () => {
    const palette = extractPalette(starryNight, { count: 4 });

    const accent = palette.find((color) => closeTo(color.hex, yellow));
    expect(accent).toBeDefined();
    expect(accent?.share).toBeCloseTo(0.03, 2);
    expect(closeTo(palette[0].hex, blue)).toBe(true);
  });

  it("does not return near-duplicate colors", () => {
    const palette = extractPalette(
      image([
        { color: [120, 60, 30], count: 400 },
        { color: [124, 62, 32], count: 400 },
        { color: [60, 120, 200], count: 100 },
        { color: [240, 240, 230], count: 100 },
      ]),
      { count: 3 },
    );

    const labs = palette.map((color) => rgbToOklab(...hexToRgb(color.hex)));
    for (let i = 0; i < labs.length; i++) {
      for (let j = i + 1; j < labs.length; j++) {
        expect(oklabDistance(labs[i], labs[j])).toBeGreaterThan(0.09);
      }
    }
  });

  it("is deterministic", () => {
    expect(extractPalette(starryNight)).toEqual(extractPalette(starryNight));
  });

  it("supports RGB buffers and ignores transparent pixels", () => {
    const rgb = Uint8ClampedArray.from([10, 20, 30, 10, 20, 30]);
    expect(extractPalette(rgb, { channels: 3, count: 1 })).toEqual([
      { hex: "#0a141e", share: 1 },
    ]);

    const transparent = Uint8ClampedArray.from([255, 0, 0, 0]);
    expect(extractPalette(transparent)).toEqual([]);
  });

  it("returns fewer colors when the image has fewer distinct colors", () => {
    const palette = extractPalette(image([{ color: blue, count: 50 }]), {
      count: 5,
    });
    expect(palette).toHaveLength(1);
  });
});
