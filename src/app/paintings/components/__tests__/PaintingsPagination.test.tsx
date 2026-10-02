import { fireEvent, render, screen } from "@testing-library/react";
import { getPageItems, PaintingsPagination } from "../PaintingsPagination";

describe("getPageItems", () => {
  it("lists every page when there are few", () => {
    expect(getPageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses distant pages into ellipses", () => {
    expect(getPageItems(1, 17)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 17]);
    expect(getPageItems(9, 17)).toEqual([
      1,
      "ellipsis-start",
      8,
      9,
      10,
      "ellipsis-end",
      17,
    ]);
    expect(getPageItems(17, 17)).toEqual([
      1,
      "ellipsis-start",
      13,
      14,
      15,
      16,
      17,
    ]);
  });
});

describe("PaintingsPagination", () => {
  it("marks the current page and navigates", () => {
    const onPageChange = jest.fn();
    render(
      <PaintingsPagination
        currentPage={3}
        totalPages={17}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Última página" }));
    expect(onPageChange).toHaveBeenLastCalledWith(17);
  });

  it("disables backwards navigation on the first page", () => {
    render(
      <PaintingsPagination
        currentPage={1}
        totalPages={3}
        onPageChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Primeira página" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();
  });
});
