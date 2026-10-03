import { render, screen } from "@testing-library/react";
import AboutPage from "../page";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, priority, alt, ...props }: any) => (
    <img {...props} data-testid="mock-image" alt={alt} />
  ),
}));

jest.mock("../components/VanGogh3DCard", () => ({
  VanGogh3DCard: () => <div data-testid="mock-3d-card">Mock 3D Card</div>,
}));

describe("AboutPage", () => {
  beforeEach(() => {
    // Skip the GSAP animations so everything is visible right away.
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  it("renders the title and introduction", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /sobre o van gogh universe/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/uma experiência digital imersiva que une arte/i),
    ).toBeInTheDocument();
  });

  it("opens with Van Gogh's portrait and credits it", () => {
    render(<AboutPage />);

    expect(screen.getByTestId("mock-image")).toHaveAttribute(
      "src",
      "/assets/van-gogh-portrait.jpg",
    );
    expect(screen.getByText(/john peter russell, 1886/i)).toBeInTheDocument();
  });

  it("renders the artist placard and the 3D model", async () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: /vincent willem van gogh/i }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("mock-3d-card")).toBeInTheDocument();
  });

  it("renders all main sections with headings", () => {
    render(<AboutPage />);

    for (const name of [
      /nossa visão/i,
      /tecnologia e arte/i,
      /uma experiência imersiva/i,
      /o legado de van gogh/i,
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("ends with Van Gogh's quote", () => {
    render(<AboutPage />);

    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.tagName === "P" &&
            /a arte é para consolar aqueles que são quebrados pela vida/i.test(
              element.textContent ?? "",
            ),
        ),
      ),
    ).toBeInTheDocument();
  });
});
