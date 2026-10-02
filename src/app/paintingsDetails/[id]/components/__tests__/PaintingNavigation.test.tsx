import { render, screen } from "@testing-library/react";
import { PaintingNavigation } from "../PaintingNavigation";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, placeholder, blurDataURL, ...props }: any) => (
    <img alt="" {...props} />
  ),
}));

describe("PaintingNavigation", () => {
  it("links to the neighbouring paintings and shows the position", () => {
    render(
      <PaintingNavigation
        prevPainting={{ id: "1", namePainting: "Anterior" }}
        nextPainting={{
          id: "3",
          namePainting: "Seguinte",
          imagePainting: "/assets/paintings/seguinte.jpg",
        }}
        position={2}
        total={100}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Pintura anterior: Anterior" }),
    ).toHaveAttribute("href", "/paintingsDetails/1");
    expect(
      screen.getByRole("link", { name: "Pintura seguinte: Seguinte" }),
    ).toHaveAttribute("href", "/paintingsDetails/3");
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("does not link past the first or last painting", () => {
    render(
      <PaintingNavigation
        prevPainting={undefined}
        nextPainting={{ id: "2", namePainting: "Seguinte" }}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
