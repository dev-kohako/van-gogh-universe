import { render, screen } from "@testing-library/react";
import { HomePageClient } from "../home-page-client";
import { useTheme } from "next-themes";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

jest.mock("@/components/ui/sparkles", () => ({
  SparklesCore: ({ particleColor }: any) => (
    <div data-testid="sparkles" data-color={particleColor}></div>
  ),
}));

jest.mock("@/components/ui/carousel-skeleton", () => ({
  CarouselSkeleton: () => <div data-testid="carousel-skeleton" />,
}));

jest.mock("@/components/PaintingCarousel", () => ({
  PaintingCarousel: ({ paintings }: any) => (
    <div data-testid="painting-carousel">{paintings?.length} obras</div>
  ),
}));

describe("HomePageClient", () => {
  const mockPaintings = [
    { id: 1, src: "/test-img-1.jpg", alt: "Mock painting 1" },
    { id: 2, src: "/test-img-2.jpg", alt: "Mock painting 2" },
  ];

  it("renders title, description, and CTA correctly", async () => {
    (useTheme as jest.Mock).mockReturnValue({ resolvedTheme: "dark" });
    render(<HomePageClient paintings={mockPaintings} />);

    const vanGoghTexts = await screen.findAllByText(/Van Gogh/i);
    expect(vanGoghTexts.length).toBeGreaterThan(0);

    expect(await screen.findByText(/Universe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /galeria de destaque/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /explorar todas as obras de van gogh/i,
      })
    ).toHaveAttribute("href", "/paintings");
  });

  it("renders SparklesCore with correct color based on theme", () => {
    (useTheme as jest.Mock).mockReturnValue({ resolvedTheme: "light" });
    render(<HomePageClient paintings={mockPaintings} />);
    expect(screen.getByTestId("sparkles")).toHaveAttribute(
      "data-color",
      "#09090b"
    );
  });

  it("renders PaintingCarousel inside Suspense fallback", async () => {
    (useTheme as jest.Mock).mockReturnValue({ resolvedTheme: "dark" });
    render(<HomePageClient paintings={mockPaintings} />);
    expect(screen.getByTestId("painting-carousel")).toBeInTheDocument();
  });
});
