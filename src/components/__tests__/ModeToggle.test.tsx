import { fireEvent, render, screen } from "@testing-library/react";
import { useTheme } from "next-themes";
import { ModeToggle } from "../toggleDarkMode";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

describe("ModeToggle", () => {
  const setTheme = jest.fn();

  beforeEach(() => {
    setTheme.mockClear();
  });

  it("switches to light on the first click when the system theme is dark", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "system",
      resolvedTheme: "dark",
      setTheme,
    });
    render(<ModeToggle />);

    fireEvent.click(screen.getByRole("button", { name: /ativar modo claro/i }));

    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("switches to dark on the first click when the system theme is light", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "system",
      resolvedTheme: "light",
      setTheme,
    });
    render(<ModeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: /ativar modo escuro/i }),
    );

    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
