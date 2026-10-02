import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import PaintingsPage from "../page";

const mockHookValue = (overrides: Record<string, any> = {}) => ({
  currentItems: [
    {
      id: "1",
      namePainting: "Noite Estrelada",
      datePainting: "1889",
      imagePainting: "/img1.jpg",
    },
    {
      id: "2",
      namePainting: "Girassóis",
      datePainting: "1888",
      imagePainting: "/img2.jpg",
    },
  ],
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalItems: 8,
    itemsPerPage: 6,
    setCurrentPage: jest.fn(),
    setItemsPerPage: jest.fn(),
  },
  filter: {
    searchTerm: "",
    setSearchTerm: jest.fn(),
    period: "all",
    setPeriod: jest.fn(),
    periodOptions: [{ value: "Período de Arles", count: 5 }],
    genre: "all",
    setGenre: jest.fn(),
    genreOptions: [{ value: "Paisagem", count: 3 }],
    hasActiveFilters: false,
    clearFilters: jest.fn(),
    isPending: false,
  },
  sort: {
    sortBy: "name",
    setSortBy: jest.fn(),
    order: "asc",
    setOrder: jest.fn(),
  },
  ui: {
    activeId: null,
    handleItemClick: jest.fn(),
    containerRef: { current: null },
  },
  ...overrides,
});

jest.mock("../usePantings", () => ({
  ALL: "all",
  usePaintings: jest.fn(() => mockHookValue()),
}));

jest.mock("@/components/empty-section", () => ({
  __esModule: true,
  EmptySection: ({ title, description, buttonText }: any) => (
    <div data-testid="mock-empty-section">
      <h2>{title}</h2>
      <p>{description}</p>
      <button>{buttonText}</button>
    </div>
  ),
}));

jest.mock("../components/PaintingCard", () => ({
  PaintingCard: ({ photo }: any) => (
    <div data-testid="mock-painting-card">{photo.namePainting}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));
jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));
jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <div>Value</div>,
}));

describe("PaintingsPage", () => {
  it("renders title and intro text", () => {
    render(<PaintingsPage />);

    expect(
      screen.getByRole("heading", { name: /galeria de pinturas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/explore as obras-primas/i)).toBeInTheDocument();
  });

  it("renders painting cards when paintings exist", () => {
    render(<PaintingsPage />);

    const cards = screen.getAllByTestId("mock-painting-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText(/noite estrelada/i)).toBeInTheDocument();
    expect(screen.getByText(/girassóis/i)).toBeInTheDocument();
  });

  it("shows how many paintings are being displayed", () => {
    render(<PaintingsPage />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Mostrando 1–6 de 8 obras",
    );
  });

  it("renders EmptySection when there are no paintings", () => {
    const { usePaintings } = require("../usePantings");
    usePaintings.mockReturnValue(
      mockHookValue({
        currentItems: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          setCurrentPage: jest.fn(),
          setItemsPerPage: jest.fn(),
          itemsPerPage: 6,
        },
      }),
    );

    render(<PaintingsPage />);

    const empty = screen.getByTestId("mock-empty-section");
    expect(empty).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /nenhuma pintura encontrada/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tente ajustar os filtros/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhuma obra encontrada",
    );
  });

  it("updates search term when typing in the input", () => {
    const { usePaintings } = require("../usePantings");
    const value = mockHookValue();
    usePaintings.mockReturnValue(value);

    render(<PaintingsPage />);

    const input = screen.getByPlaceholderText(/nome ou título original/i);
    fireEvent.change(input, { target: { value: "girassóis" } });

    expect(value.filter.setSearchTerm).toHaveBeenCalledWith("girassóis");
  });

  it("offers to clear active filters", () => {
    const { usePaintings } = require("../usePantings");
    const value = mockHookValue();
    value.filter.searchTerm = "noite";
    value.filter.hasActiveFilters = true;
    usePaintings.mockReturnValue(value);

    render(<PaintingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /limpar busca/i }));
    expect(value.filter.setSearchTerm).toHaveBeenCalledWith("");

    fireEvent.click(screen.getByRole("button", { name: /limpar filtros/i }));
    expect(value.filter.clearFilters).toHaveBeenCalled();
  });
});
