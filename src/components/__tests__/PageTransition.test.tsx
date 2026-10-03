import { fireEvent, render, screen } from "@testing-library/react";
import { getRouteLabel, PageTransition } from "../PageTransition";

const push = jest.fn();
const prefetch = jest.fn();
let pathname = "/";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, prefetch }),
  usePathname: () => pathname,
}));

describe("PageTransition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathname = "/";
  });

  it("names each destination on the curtain", () => {
    expect(getRouteLabel("/")).toBe("Início");
    expect(getRouteLabel("/gallery")).toBe("Galeria");
    expect(getRouteLabel("/paintings")).toBe("Pinturas");
    expect(getRouteLabel("/paintingsDetails/3")).toBe("Obra");
    expect(getRouteLabel("/about")).toBe("Sobre");
  });

  it("navigates internal links through the router", () => {
    // Without animations the transition is a plain push.
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
    }));
    render(
      <PageTransition>
        <a href="/gallery">Galeria</a>
      </PageTransition>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Galeria" }));

    expect(push).toHaveBeenCalledWith("/gallery");
  });

  it("leaves image links, new tabs and modified clicks alone", () => {
    render(
      <PageTransition>
        <a href="/_next/image?url=x&w=2048">Imagem</a>
        <a href="/gallery" target="_blank" rel="noreferrer">
          Nova aba
        </a>
        <a href="/about">Sobre</a>
      </PageTransition>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Imagem" }));
    fireEvent.click(screen.getByRole("link", { name: "Nova aba" }));
    fireEvent.click(screen.getByRole("link", { name: "Sobre" }), {
      ctrlKey: true,
    });

    expect(push).not.toHaveBeenCalled();
  });
});
