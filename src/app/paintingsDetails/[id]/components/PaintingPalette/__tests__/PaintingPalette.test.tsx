import { render, screen, fireEvent } from "@testing-library/react";
import { PaintingPalette } from "../PaintingPalette";

jest.mock("copy-to-clipboard", () => jest.fn());
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../ColorSwatch", () => ({
  ColorSwatch: ({ color, share, onCopy }: any) => (
    <button
      data-testid={`swatch-${color}`}
      data-share={share}
      onClick={() => onCopy(color)}
    >
      {color}
    </button>
  ),
}));

describe("PaintingPalette", () => {
  const colors = [
    { hex: "#FF0000", share: 0.5 },
    { hex: "#00FF00", share: 0.3 },
    { hex: "#0000FF", share: 0.2 },
  ];
  const mockCopy = require("copy-to-clipboard");
  const mockToast = require("sonner").toast;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all color swatches correctly", () => {
    render(<PaintingPalette colors={colors} />);
    expect(screen.getByText("Paleta de cores")).toBeInTheDocument();

    colors.forEach((color) => {
      expect(screen.getByTestId(`swatch-${color.hex}`)).toHaveAttribute(
        "data-share",
        String(color.share),
      );
    });
  });

  it("calls toast.success when color is copied successfully", () => {
    mockCopy.mockReturnValue(true);
    render(<PaintingPalette colors={colors} />);

    const firstSwatch = screen.getByTestId("swatch-#FF0000");
    fireEvent.click(firstSwatch);

    expect(mockCopy).toHaveBeenCalledWith("#FF0000");
    expect(mockToast.success).toHaveBeenCalledWith(
      "Cor #FF0000 copiada com sucesso!"
    );
  });

  it("calls toast.error when copy fails", () => {
    mockCopy.mockReturnValue(false);
    render(<PaintingPalette colors={colors} />);

    const secondSwatch = screen.getByTestId("swatch-#00FF00");
    fireEvent.click(secondSwatch);

    expect(mockToast.error).toHaveBeenCalledWith("Falha ao copiar a cor.");
  });

  it("describes the color proportions for assistive technologies", () => {
    render(<PaintingPalette colors={colors} />);

    expect(
      screen.getByRole("img", { name: /proporção das cores/i }),
    ).toHaveAccessibleName(
      "Proporção das cores: #FF0000 50%, #00FF00 30%, #0000FF 20%",
    );
  });

  it("renders correct aria-label and structure", () => {
    render(<PaintingPalette colors={colors} />);

    const section = screen.getByRole("region", { hidden: true });
    const heading = screen.getByRole("heading", { name: /paleta de cores/i });

    expect(section).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
  });
});
