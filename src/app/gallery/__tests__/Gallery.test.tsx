import { render, screen } from "@testing-library/react";
import React from "react";
import GalleryPage from "../page";

jest.mock("../components/GalleryCard", () => ({
  GalleryCard: ({ painting, index }: any) => (
    <div data-testid="mock-gallery-card">
      {painting.namePainting} (#{index})
    </div>
  ),
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

jest.mock("lightgallery/react", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="mock-lightgallery">{children}</div>
  ),
}));

let mockPaintings: any[] = [
  {
    id: "1",
    namePainting: "Noite Estrelada",
    datePainting: "1889",
    width: 800,
    height: 600,
    imagePainting: "noite-estrelada.jpg",
  },
  {
    id: "2",
    namePainting: "Girassóis",
    datePainting: "1888",
    width: 600,
    height: 600,
    imagePainting: "girassois.jpg",
  },
];

jest.mock("../../../../public/data/data.json", () => ({
  get data_painting() {
    return mockPaintings;
  },
}));

describe("GalleryPage", () => {
  beforeEach(() => {
    // Skip the entrance animations so everything is visible right away.
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    mockPaintings = [
      {
        id: "1",
        namePainting: "Noite Estrelada",
        datePainting: "1889",
        width: 800,
        height: 600,
        imagePainting: "noite-estrelada.jpg",
      },
      {
        id: "2",
        namePainting: "Girassóis",
        datePainting: "1888",
        width: 600,
        height: 600,
        imagePainting: "girassois.jpg",
      },
    ];
  });

  it("renders the title and description", () => {
    render(<GalleryPage />);
    expect(
      screen.getByRole("heading", { name: /galeria/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/uma coleção para contemplar, explorar e apreciar/i)
    ).toBeInTheDocument();
  });

  it("renders LightGallery with GalleryCards when paintings exist", () => {
    render(<GalleryPage />);
    expect(screen.getByTestId("mock-lightgallery")).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-gallery-card")).toHaveLength(2);
    expect(screen.getByText(/noite estrelada/i)).toBeInTheDocument();
    expect(screen.getByText(/girassóis/i)).toBeInTheDocument();
  });

  it("renders EmptySection when there are no paintings", () => {
    mockPaintings = [];

    render(<GalleryPage />);

    const section = screen.getByTestId("mock-empty-section");
    expect(section).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /nenhuma pintura encontrada/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/sem obras no momento/i)).toBeInTheDocument();
  });
});
