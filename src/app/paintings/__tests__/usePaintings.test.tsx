import { renderHook, act } from "@testing-library/react";
import { usePaintings } from "../usePantings";
import { Painting } from "@/types/types";

const mockPaintings = [
  { id: "1", namePainting: "A", datePainting: "1888" },
  { id: "2", namePainting: "B", datePainting: "1889" },
  { id: "3", namePainting: "C", datePainting: "1890" },
] as Painting[];

const richPaintings = [
  {
    id: "1",
    namePainting: "A Noite Estrelada",
    originalTitle: "De Sterrennacht",
    datePainting: "Junho de 1889",
    period: "Período de Saint-Rémy",
    genre: "Paisagem",
  },
  {
    id: "2",
    namePainting: "Os Girassóis",
    originalTitle: "Zonnebloemen",
    datePainting: "Agosto de 1888",
    period: "Período de Arles",
    genre: "Natureza-morta",
  },
  {
    id: "3",
    namePainting: "Íris",
    originalTitle: "Irises",
    datePainting: "Maio de 1889",
    period: "Período de Saint-Rémy",
    genre: "Natureza-morta",
  },
  {
    id: "4",
    namePainting: "Os Comedores de Batata",
    originalTitle: "De Aardappeleters",
    datePainting: "Abril de 1885",
    period: "Período de Nuenen",
    genre: "Gênero",
  },
] as Painting[];

describe("usePaintings", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("initializes with default pagination and filters", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: mockPaintings }),
    );

    expect(result.current.pagination.currentPage).toBe(1);
    expect(result.current.pagination.itemsPerPage).toBe(6);
    expect(result.current.filter.searchTerm).toBe("");
    expect(result.current.sort.order).toBe("asc");
    expect(result.current.sort.sortBy).toBe("name");
    expect(result.current.currentItems).toHaveLength(3);
  });

  it("filters paintings by search term", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: mockPaintings }),
    );

    act(() => {
      result.current.filter.setSearchTerm("B");
    });

    expect(result.current.currentItems).toEqual(
      expect.arrayContaining([
        { id: "2", namePainting: "B", datePainting: "1889" },
      ]),
    );
  });

  it("sorts paintings by date descending", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: mockPaintings }),
    );

    act(() => {
      result.current.sort.setSortBy("date");
      result.current.sort.setOrder("desc");
    });

    const items = result.current.currentItems;
    expect(items[0].datePainting).toBe("1890");
    expect(items[2].datePainting).toBe("1888");
  });

  it("paginates paintings correctly", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: mockPaintings, initialItemsPerPage: 2 }),
    );

    expect(result.current.pagination.totalPages).toBe(2);

    act(() => {
      result.current.pagination.setCurrentPage(2);
    });

    expect(result.current.currentItems).toHaveLength(1);
  });

  it("resets current page when filters or sorting change", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: mockPaintings, initialItemsPerPage: 1 }),
    );

    act(() => {
      result.current.pagination.setCurrentPage(2);
      result.current.filter.setSearchTerm("A");
    });

    expect(result.current.pagination.currentPage).toBe(1);
  });

  it("clears activeId when clicking outside container", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: mockPaintings }),
    );

    const container = document.createElement("ul");
    result.current.ui.containerRef.current = container;
    document.body.appendChild(container);

    const outside = document.createElement("div");
    document.body.appendChild(outside);

    act(() => {
      result.current.ui.handleItemClick("1");

      const event = new MouseEvent("mousedown", {
        bubbles: true,
      }) as MouseEvent & {
        target: Element;
      };
      Object.defineProperty(event, "target", {
        value: outside,
        enumerable: true,
      });

      document.dispatchEvent(event);
    });

    expect(result.current.ui.activeId).toBeNull();
  });

  it("searches without accents and by original title", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: richPaintings }),
    );

    act(() => {
      result.current.filter.setSearchTerm("girassois");
    });
    expect(result.current.currentItems.map((p) => p.id)).toEqual(["2"]);

    act(() => {
      result.current.filter.setSearchTerm("irises");
    });
    expect(result.current.currentItems.map((p) => p.id)).toEqual(["3"]);
  });

  it("sorts Portuguese dates by month, not only by year", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: richPaintings }),
    );

    act(() => {
      result.current.sort.setSortBy("date");
    });

    expect(result.current.currentItems.map((p) => p.id)).toEqual([
      "4",
      "2",
      "3",
      "1",
    ]);
  });

  it("filters by period and genre with faceted counts", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: richPaintings }),
    );

    expect(result.current.filter.periodOptions.map((o) => o.value)).toEqual([
      "Período de Nuenen",
      "Período de Arles",
      "Período de Saint-Rémy",
    ]);

    act(() => {
      result.current.filter.setPeriod("Período de Saint-Rémy");
    });
    expect(result.current.currentItems.map((p) => p.id).sort()).toEqual([
      "1",
      "3",
    ]);
    expect(result.current.filter.genreOptions).toEqual([
      { value: "Gênero", count: 0 },
      { value: "Natureza-morta", count: 1 },
      { value: "Paisagem", count: 1 },
    ]);

    act(() => {
      result.current.filter.setGenre("Natureza-morta");
    });
    expect(result.current.currentItems.map((p) => p.id)).toEqual(["3"]);
    expect(result.current.filter.hasActiveFilters).toBe(true);

    act(() => {
      result.current.filter.clearFilters();
    });
    expect(result.current.currentItems).toHaveLength(4);
    expect(result.current.filter.hasActiveFilters).toBe(false);
  });

  it("restores filters saved in the session", () => {
    const first = renderHook(() =>
      usePaintings({ paintings: richPaintings, initialItemsPerPage: 1 }),
    );

    act(() => {
      first.result.current.filter.setPeriod("Período de Saint-Rémy");
    });
    act(() => {
      first.result.current.pagination.setCurrentPage(2);
    });
    first.unmount();

    const { result } = renderHook(() =>
      usePaintings({ paintings: richPaintings, initialItemsPerPage: 1 }),
    );

    expect(result.current.filter.period).toBe("Período de Saint-Rémy");
    expect(result.current.pagination.currentPage).toBe(2);
  });

  it("keeps the current page within range", () => {
    const { result } = renderHook(() =>
      usePaintings({ paintings: richPaintings, initialItemsPerPage: 2 }),
    );

    act(() => {
      result.current.pagination.setCurrentPage(10);
    });

    expect(result.current.pagination.currentPage).toBe(2);
    expect(result.current.currentItems).toHaveLength(2);
  });
});
