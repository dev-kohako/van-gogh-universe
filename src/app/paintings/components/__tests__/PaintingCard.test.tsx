import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PaintingCard } from "../PaintingCard";
import { Painting } from "@/types/types";

jest.mock("../usePaintingAnimations", () => ({
  usePaintingAnimations: () => ({
    imageVariants: {},
    overlayVariants: {},
    titleVariants: {},
    dateVariants: {},
    buttonVariants: {},
    descriptionTitleVariants: {},
    descriptionDateVariants: {},
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img data-testid="mock-image" src={src} alt={alt} {...props} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="mock-button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("framer-motion", () => ({
  motion: {
    article: (props: any) => <article {...props} />,
    figure: (props: any) => <figure {...props} />,
    figcaption: (props: any) => <figcaption {...props} />,
    span: (props: any) => <span {...props} />,
    p: (props: any) => <p {...props} />,
    div: (props: any) => <div {...props} />,
    h2: (props: any) => <h2 {...props} />,
    create: (Comp: any) => Comp,
  },
}));

const mockPhoto = {
  id: "123",
  namePainting: "Noite Estrelada",
  datePainting: "1889",
  imagePainting: "/assets/noite-estrelada.jpg",
  alt: "Pintura Noite Estrelada",
  blurDataURL: "data:image/webp;base64,AAAA",
  width: 800,
  height: 600,
} as Painting;

describe("PaintingCard", () => {
  it("renders painting details correctly", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={handleClick}
        index={0}
      />,
    );

    const [card] = screen.getAllByRole("button");

    expect(card).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /noite estrelada/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/1889/i)).toHaveLength(2);

    const img = screen.getByTestId("mock-image");
    expect(img).toHaveAttribute("src", mockPhoto.imagePainting);
    expect(img).toHaveAttribute("alt", mockPhoto.alt);
  });

  it("calls onCardClick when clicked", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={handleClick}
        index={0}
      />,
    );

    const [card] = screen.getAllByRole("button");
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith(mockPhoto.id);
  });

  it("handles keyboard navigation (Enter and Space)", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={handleClick}
        index={0}
      />,
    );

    const [card] = screen.getAllByRole("button");

    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });

    expect(handleClick).toHaveBeenCalledTimes(2);
    expect(handleClick).toHaveBeenCalledWith(mockPhoto.id);
  });

  it("renders 'Ver detalhes' link with correct href", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={handleClick}
        index={0}
      />,
    );

    const link = screen.getByTestId("mock-link");
    expect(link).toHaveAttribute("href", `/paintingsDetails/${mockPhoto.id}`);
    expect(link).toHaveTextContent(/ver detalhes/i);
  });

  it("prevents propagation when clicking inside button", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={handleClick}
        index={0}
      />,
    );

    const button = screen.getByTestId("mock-button");
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("uses lazy loading for images with index >= 6", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={handleClick}
        index={7}
      />,
    );

    const img = screen.getByTestId("mock-image");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("applies hover animation when isActive is true", () => {
    const handleClick = jest.fn();
    render(
      <PaintingCard
        photo={mockPhoto}
        isActive={true}
        onCardClick={handleClick}
        index={0}
      />,
    );

    const [card] = screen.getAllByRole("button");
    expect(card).toHaveAttribute("animate", "hover");
  });

  it("shows a blurred preview until the image loads", () => {
    const { container } = render(
      <PaintingCard
        photo={mockPhoto}
        isActive={false}
        onCardClick={jest.fn()}
        index={0}
      />,
    );

    const img = screen.getByTestId("mock-image");
    expect(img).toHaveClass("opacity-0");
    expect(container.querySelector(".shimmer")).toBeInTheDocument();
    expect(
      container.querySelector('[style*="data:image/webp;base64,AAAA"]'),
    ).toBeInTheDocument();

    fireEvent.load(img);

    expect(img).toHaveClass("opacity-100");
    expect(container.querySelector(".shimmer")).not.toBeInTheDocument();
  });
});
