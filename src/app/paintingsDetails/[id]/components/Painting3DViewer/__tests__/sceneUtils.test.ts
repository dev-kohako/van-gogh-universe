import {
  computeCanvasRelief,
  getFitDistance,
  getFrameMetrics,
  getOptimizedImageUrl,
  getPaintingSize,
  getTextureWidth,
  loadCachedImage,
} from "../sceneUtils";

describe("sceneUtils", () => {
  it("builds Next.js image optimizer URLs", () => {
    expect(getOptimizedImageUrl("/assets/paintings/a b.jpg", 2048)).toBe(
      "/_next/image?url=%2Fassets%2Fpaintings%2Fa%20b.jpg&w=2048&q=80",
    );
  });

  it("picks a texture width that matches the screen", () => {
    expect(getTextureWidth(390, 3)).toBe(1200);
    expect(getTextureWidth(1440, 1)).toBe(2048);
    expect(getTextureWidth(1024, 1)).toBe(1200);
  });

  it("uses the catalogued dimensions for the real-world size", () => {
    const landscape = getPaintingSize(2560, 2027, "73.7 cm × 92.1 cm");
    expect(landscape.width).toBeCloseTo(0.921);
    expect(landscape.height).toBeCloseTo(0.921 / (2560 / 2027));

    const portrait = getPaintingSize(1000, 2000, "60 cm × 49 cm");
    expect(portrait.height).toBeCloseTo(0.6);
    expect(portrait.width).toBeCloseTo(0.3);
  });

  it("falls back to a default size when dimensions are missing", () => {
    const size = getPaintingSize(1600, 1200, "");
    expect(size.width).toBeCloseTo(0.9);
    expect(size.height).toBeCloseTo(0.675);
  });

  it("keeps frame proportions within sensible bounds", () => {
    const small = getFrameMetrics(0.3, 0.25);
    const large = getFrameMetrics(2, 1.5);
    expect(small.moulding).toBeCloseTo(0.045);
    expect(large.moulding).toBeCloseTo(0.11);
    expect(large.border).toBeCloseTo(large.moulding + large.slip);
  });

  it("moves the camera further away for taller frames and narrow screens", () => {
    const base = getFitDistance(1, 1, 35, 16 / 9);
    expect(getFitDistance(1, 2, 35, 16 / 9)).toBeGreaterThan(base);
    expect(getFitDistance(1, 1, 35, 9 / 16)).toBeGreaterThan(base);
  });

  it("turns luminance detail into relief around mid-gray", () => {
    const width = 16;
    const height = 16;
    const flat = new Float32Array(width * height).fill(100);
    const flatRelief = computeCanvasRelief(flat, width, height, { weave: 0 });
    expect(Array.from(new Set(flatRelief))).toEqual([128]);

    const stroke = flat.slice();
    stroke[8 * width + 8] = 250;
    const relief = computeCanvasRelief(stroke, width, height, { weave: 0 });
    expect(relief[8 * width + 8]).toBeGreaterThan(200);
  });
});

describe("loadCachedImage", () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: null,
      blob: async () => new Blob(["image"]),
    })) as unknown as typeof fetch;
    URL.createObjectURL = jest.fn(() => "blob:painting");
    URL.revokeObjectURL = jest.fn();
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: () => Promise.resolve(),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("shares a single download between concurrent requests", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const a = loadCachedImage(["/shared.jpg"], first);
    const b = loadCachedImage(["/shared.jpg"], second);

    const [imageA, imageB] = await Promise.all([a.promise, b.promise]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(imageA).toBe(imageB);
    expect(first).toHaveBeenLastCalledWith(1);
    expect(second).toHaveBeenLastCalledWith(1);
  });

  it("falls back to the next source when the first one fails", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
      headers: new Headers(),
    }));

    const { promise } = loadCachedImage(
      ["/optimized-broken.jpg", "/original.jpg"],
      jest.fn(),
    );

    await expect(promise).resolves.toBeInstanceOf(HTMLImageElement);
    expect((global.fetch as jest.Mock).mock.calls.map(([url]) => url)).toEqual([
      "/optimized-broken.jpg",
      "/original.jpg",
    ]);
  });
});
