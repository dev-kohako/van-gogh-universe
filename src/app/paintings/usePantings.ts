import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { normalizeText, parsePaintingDate } from "@/lib/utils";
import type {
  FilterOption,
  SortBy,
  SortOrder,
  UsePaintingsProps,
} from "@/types/paiting.type";
import type { Painting } from "@/types/types";

export const ALL = "all";

const STORAGE_KEY = "van-gogh:paintings-filters";

type StoredFilters = {
  searchTerm: string;
  period: string;
  genre: string;
  sortBy: SortBy;
  order: SortOrder;
  itemsPerPage: number;
  currentPage: number;
};

function readStoredFilters(): Partial<StoredFilters> | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<StoredFilters>) : null;
  } catch {
    return null;
  }
}

function writeStoredFilters(filters: StoredFilters) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
}

function matchesSearch(painting: Painting, term: string) {
  if (!term) return true;
  return (
    normalizeText(painting.namePainting).includes(term) ||
    normalizeText(painting.originalTitle ?? "").includes(term)
  );
}

/** Builds select options with how many paintings each value would show. */
function buildOptions(
  paintings: Painting[],
  getValue: (painting: Painting) => string | undefined,
  available: Painting[],
  sort: (a: FilterOption, b: FilterOption) => number,
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const painting of paintings) {
    const value = getValue(painting);
    if (value && !counts.has(value)) counts.set(value, 0);
  }
  for (const painting of available) {
    const value = getValue(painting);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort(sort);
}

export function usePaintings({
  paintings,
  initialItemsPerPage = 6,
}: UsePaintingsProps) {
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [currentPage, setCurrentPageState] = useState(1);
  const [searchTerm, setSearchTermState] = useState("");
  const [period, setPeriodState] = useState(ALL);
  const [genre, setGenreState] = useState(ALL);
  const [order, setOrderState] = useState<SortOrder>("asc");
  const [sortBy, setSortByState] = useState<SortBy>("name");
  const [restored, setRestored] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);

  // Filtering 100 items is cheap, but deferring keeps typing responsive while
  // the grid re-renders.
  const deferredSearch = useDeferredValue(searchTerm);
  const normalizedSearch = normalizeText(deferredSearch);

  const searched = useMemo(
    () => paintings.filter((p) => matchesSearch(p, normalizedSearch)),
    [paintings, normalizedSearch],
  );

  const periodOptions = useMemo(() => {
    const firstDate = new Map<string, number>();
    for (const painting of paintings) {
      const date = parsePaintingDate(painting.datePainting);
      const current = firstDate.get(painting.period);
      if (current === undefined || date < current) {
        firstDate.set(painting.period, date);
      }
    }
    return buildOptions(
      paintings,
      (p) => p.period,
      searched.filter((p) => genre === ALL || p.genre === genre),
      // Periods follow Van Gogh's life chronologically.
      (a, b) => (firstDate.get(a.value) ?? 0) - (firstDate.get(b.value) ?? 0),
    );
  }, [paintings, searched, genre]);

  const genreOptions = useMemo(
    () =>
      buildOptions(
        paintings,
        (p) => p.genre,
        searched.filter((p) => period === ALL || p.period === period),
        (a, b) => a.value.localeCompare(b.value, "pt-BR"),
      ),
    [paintings, searched, period],
  );

  const filteredAndSortedPaintings = useMemo(() => {
    const filtered = searched.filter(
      (p) =>
        (period === ALL || p.period === period) &&
        (genre === ALL || p.genre === genre),
    );

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison =
          parsePaintingDate(a.datePainting) - parsePaintingDate(b.datePainting);
      }
      if (comparison === 0 || Number.isNaN(comparison)) {
        comparison = a.namePainting.localeCompare(b.namePainting, "pt-BR", {
          sensitivity: "base",
        });
      }
      return order === "asc" ? comparison : -comparison;
    });
  }, [searched, period, genre, order, sortBy]);

  const totalItems = filteredAndSortedPaintings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredAndSortedPaintings.slice(start, start + itemsPerPage);
  }, [filteredAndSortedPaintings, safePage, itemsPerPage]);

  // Every filter change starts from the first page.
  const withPageReset =
    <T>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setCurrentPageState(1);
    };

  const setSearchTerm = withPageReset(setSearchTermState);
  const setPeriod = withPageReset(setPeriodState);
  const setGenre = withPageReset(setGenreState);
  const setSortBy = withPageReset(setSortByState);
  const setOrder = withPageReset(setOrderState);
  const setItemsPerPage = withPageReset(setItemsPerPageState);

  const setCurrentPage = useCallback(
    (page: number | ((page: number) => number)) => {
      setCurrentPageState((previous) => {
        const next = typeof page === "function" ? page(previous) : page;
        return Math.max(1, next);
      });
    },
    [],
  );

  const hasActiveFilters =
    searchTerm.trim() !== "" || period !== ALL || genre !== ALL;

  const clearFilters = () => {
    setSearchTermState("");
    setPeriodState(ALL);
    setGenreState(ALL);
    setCurrentPageState(1);
  };

  // Restore the previous filters (e.g. when coming back from a painting's
  // details) after hydration, so server and client markup match.
  useEffect(() => {
    const stored = readStoredFilters();
    if (stored) {
      if (typeof stored.searchTerm === "string")
        setSearchTermState(stored.searchTerm);
      if (typeof stored.period === "string") setPeriodState(stored.period);
      if (typeof stored.genre === "string") setGenreState(stored.genre);
      if (stored.sortBy === "name" || stored.sortBy === "date")
        setSortByState(stored.sortBy);
      if (stored.order === "asc" || stored.order === "desc")
        setOrderState(stored.order);
      if (typeof stored.itemsPerPage === "number" && stored.itemsPerPage > 0)
        setItemsPerPageState(stored.itemsPerPage);
      if (typeof stored.currentPage === "number" && stored.currentPage > 0)
        setCurrentPageState(stored.currentPage);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    writeStoredFilters({
      searchTerm,
      period,
      genre,
      sortBy,
      order,
      itemsPerPage,
      currentPage: safePage,
    });
  }, [
    restored,
    searchTerm,
    period,
    genre,
    sortBy,
    order,
    itemsPerPage,
    safePage,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = (id: string) => {
    if (window.matchMedia("(hover: none)").matches) {
      setActiveId(activeId === id ? null : id);
    }
  };

  return {
    currentItems,
    pagination: {
      currentPage: safePage,
      setCurrentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      setItemsPerPage,
    },
    filter: {
      searchTerm,
      setSearchTerm,
      period,
      setPeriod,
      periodOptions,
      genre,
      setGenre,
      genreOptions,
      hasActiveFilters,
      clearFilters,
      isPending: searchTerm !== deferredSearch,
    },
    sort: {
      order,
      setOrder,
      sortBy,
      setSortBy,
    },
    ui: {
      activeId,
      handleItemClick,
      containerRef,
    },
  };
}
