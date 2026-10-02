import { act, render, screen } from "@testing-library/react";
import { ArtLoader } from "../art-loader";

describe("ArtLoader", () => {
  it("shows determinate progress when provided", () => {
    render(<ArtLoader label="Carregando obra..." progress={42.4} />);

    const bar = screen.getByRole("progressbar", { name: /carregando obra/i });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("rotates Van Gogh quotes", () => {
    jest.useFakeTimers();
    render(<ArtLoader />);

    expect(screen.getByText(/as estrelas me faz sonhar/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(4500);
    });
    expect(
      screen.getByText(/eu sonho com a pintura/i, { exact: false }),
    ).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("can hide the quotes", () => {
    render(<ArtLoader showQuotes={false} />);
    expect(screen.queryByText(/vincent van gogh/i)).not.toBeInTheDocument();
  });
});
