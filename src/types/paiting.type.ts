import { Painting } from "./types";

export type SortOrder = "asc" | "desc";
export type SortBy = "name" | "date";

export interface UsePaintingsProps {
  paintings: Painting[];
  initialItemsPerPage?: number;
}

export interface FilterOption {
  value: string;
  /** Paintings shown for this value, given the other active filters. */
  count: number;
}
