import { normalizeText, parsePaintingDate } from "../utils";

describe("normalizeText", () => {
  it("removes accents and case", () => {
    expect(normalizeText("  Os Girassóis ")).toBe("os girassois");
    expect(normalizeText("Período de Saint-Rémy")).toBe(
      "periodo de saint-remy",
    );
  });
});

describe("parsePaintingDate", () => {
  it("orders months within the same year", () => {
    expect(parsePaintingDate("Junho de 1889")).toBe(1889 * 12 + 5);
    expect(parsePaintingDate("Março de 1888")).toBe(1888 * 12 + 2);
    expect(parsePaintingDate("Janeiro de 1889")).toBeLessThan(
      parsePaintingDate("Dezembro de 1889"),
    );
  });

  it("handles seasons and ranges", () => {
    expect(parsePaintingDate("Verão de 1887")).toBe(1887 * 12 + 6);
    expect(parsePaintingDate("Inverno de 1885–86")).toBe(1885 * 12 + 11);
    expect(parsePaintingDate("Inverno de 1887-88")).toBe(1887 * 12 + 11);
    expect(parsePaintingDate("Janeiro de 1884 - Outono de 1885")).toBe(
      1884 * 12,
    );
  });

  it("accepts bare years and sorts unknown dates last", () => {
    expect(parsePaintingDate("1889")).toBe(1889 * 12);
    expect(parsePaintingDate("Data desconhecida")).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
