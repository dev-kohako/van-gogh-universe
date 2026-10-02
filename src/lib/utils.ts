import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
/** Lowercases and strips accents so "Girassóis" matches "girassois". */
export function normalizeText(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const MONTHS: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

// Seasons are mapped to a representative month of the given year; winter is
// December since the paintings' winters ("Inverno de 1885–86") start the year.
const SEASONS: Record<string, number> = {
  primavera: 3,
  verao: 6,
  outono: 9,
  inverno: 11,
};

/**
 * Converts Portuguese painting dates such as "Junho de 1889", "Verão de 1887"
 * or "Janeiro de 1884 - Outono de 1885" into a sortable month index
 * (year * 12 + month). Ranges use their start date. Unparseable dates sort
 * last.
 */
export function parsePaintingDate(date: string) {
  const start = normalizeText(date).split(/\s+[-–]\s+/)[0];
  const match = start.match(/^(?:([a-z]+)\s+de\s+)?(\d{4})/);
  if (!match) return Number.POSITIVE_INFINITY;

  const [, period, year] = match;
  const month = period ? (MONTHS[period] ?? SEASONS[period] ?? 0) : 0;
  return Number(year) * 12 + month;
}
