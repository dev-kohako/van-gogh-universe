import { fireEvent, render, screen } from "@testing-library/react";
import type { Painting } from "@/types/types";
import { PaintingImage } from "../PaintingImage";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, priority, placeholder, blurDataURL, ...props }: any) => (
    <img
      data-testid="mock-image"
      data-placeholder={placeholder}
      data-blur={blurDataURL}
      {...props}
    />
  ),
}));

describe("PaintingImage", () => {
  const painting = {
    id: "1",
    namePainting: "Noite Estrelada",
    alt: "Noite Estrelada",
    imagePainting: "/assets/paintings/noite_estrelada.jpg",
    blurDataURL: "data:image/webp;base64,AAAA",
    width: 800,
    height: 600,
  } as Painting;

  const onShow3D = jest.fn();
  const onOpenFullscreen = jest.fn();
  const onPrefetch3D = jest.fn();

  const renderImage = () =>
    render(
      <PaintingImage
        painting={painting}
        onShow3D={onShow3D}
        onOpenFullscreen={onOpenFullscreen}
        onPrefetch3D={onPrefetch3D}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    // Skip the entrance animation so everything is visible right away.
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  it("shows the painting with its blurred preview", () => {
    renderImage();

    const image = screen.getByTestId("mock-image");
    expect(image).toHaveAttribute("src", painting.imagePainting);
    expect(image).toHaveAttribute("alt", painting.alt);
    expect(image).toHaveAttribute("data-placeholder", "blur");
    expect(image).toHaveAttribute("data-blur", painting.blurDataURL);
  });

  it("opens the 3D viewer and prefetches it on hover", () => {
    renderImage();

    const button = screen.getByRole("button", {
      name: `Visualizar ${painting.alt} em 3D`,
    });
    fireEvent.pointerEnter(button);
    expect(onPrefetch3D).toHaveBeenCalled();

    fireEvent.click(button);
    expect(onShow3D).toHaveBeenCalledTimes(1);
  });

  it("opens fullscreen from the painting and from the button", () => {
    renderImage();

    fireEvent.click(
      screen.getByRole("button", { name: `Ver ${painting.alt} em tela cheia` }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Abrir em tela cheia" }));

    expect(onOpenFullscreen).toHaveBeenCalledTimes(2);
  });
});
