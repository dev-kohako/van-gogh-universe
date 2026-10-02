import { render, screen } from "@testing-library/react";
import { GalleryCard } from "../GalleryCard";
import React from "react";
import type { GalleryPainting } from "@/types/galleryTypes.type";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, priority, blurDataURL, placeholder, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      data-testid="mock-image"
      data-priority={priority ? "true" : "false"}
      data-blur={blurDataURL ? "true" : "false"}
      {...props}
    />
  ),
}));

describe("GalleryCard", () => {
  const mockPainting = {
    id: "1",
    namePainting: "Noite Estrelada",
    datePainting: "1889",
    imagePainting: "/paintings/noite-estrelada.jpg",
    alt: "Pintura Noite Estrelada",
    width: 800,
    height: 600,
    blurDataURL: "data:image/webp;base64,AAAA",
  } as GalleryPainting;

  it("renders painting image and title", () => {
    render(
      <GalleryCard painting={mockPainting} index={0} />
    );

    const img = screen.getByTestId("mock-image");
    expect(img).toHaveAttribute("src", mockPainting.imagePainting);
    expect(img).toHaveAttribute("alt", mockPainting.alt);

    const title = screen.getByText(/noite estrelada/i);
    expect(title).toBeInTheDocument();
  });

  it("applies correct link and aria-label", () => {
    render(
      <GalleryCard painting={mockPainting} index={0} />
    );
    const link = screen.getByRole("link", { name: /ampliar noite estrelada/i });

    // The lightbox opens a resized copy instead of the (huge) original.
    expect(link).toHaveAttribute(
      "href",
      `/_next/image?url=${encodeURIComponent(mockPainting.imagePainting)}&w=2048&q=80`,
    );
    expect(link.getAttribute("data-thumb")).toContain("w=256");
    expect(link).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Ampliar")
    );
  });

  it("sets priority and loading correctly for first 5 paintings", () => {
    const { rerender } = render(
      <GalleryCard painting={mockPainting} index={2} />
    );

    let img = screen.getByTestId("mock-image");
    expect(img).toHaveAttribute("data-priority", "true");
    expect(img).toHaveAttribute("loading", "eager");

    rerender(
      <GalleryCard painting={mockPainting} index={6} />
    );
    img = screen.getByTestId("mock-image");

    expect(img).toHaveAttribute("data-priority", "false");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("uses the painting's own blurred preview while loading", () => {
    render(<GalleryCard painting={mockPainting} index={0} />);

    expect(screen.getByTestId("mock-image")).toHaveAttribute(
      "data-blur",
      "true",
    );
  });

  it("renders custom HTML data attribute with painting info", () => {
    render(
      <GalleryCard painting={mockPainting} index={0} />
    );
    const link = screen.getByRole("link", { name: /ampliar noite estrelada/i });

    const html = link.getAttribute("data-sub-html")!;
    expect(html).toContain(mockPainting.namePainting);
    expect(html).toContain(mockPainting.datePainting);
  });

  it("applies correct aspect ratio based on width and height", () => {
    render(
      <GalleryCard painting={mockPainting} index={0} />
    );
    const link = screen.getByRole("link", { name: /ampliar noite estrelada/i });

    expect(link).toHaveStyle({
      aspectRatio: `${mockPainting.width / mockPainting.height}`,
    });
  });
});
