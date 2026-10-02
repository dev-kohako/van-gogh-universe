import { render, screen } from "@testing-library/react";
import Loading from "../loading";

describe("Loading Page", () => {
  it("renders loader and text", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando conteúdo/i)).toBeInTheDocument();
    expect(screen.getByText(/as estrelas me faz sonhar/i)).toBeInTheDocument();
  });
});
