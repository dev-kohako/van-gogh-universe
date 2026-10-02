import { fireEvent, render, screen } from "@testing-library/react";
import type { Painting } from "@/types/types";
import { PaintingDetailsView } from "../PaintingDetailsView";

const mockState = {
  show3D: false,
  setShow3D: jest.fn(),
  isFullscreen: false,
  setIsFullscreen: jest.fn(),
};
jest.mock("../usePaintingDetails", () => ({
  usePaintingDetails: () => mockState,
}));

jest.mock("@/components/ui/back-button", () => ({
  BackButton: () => <div data-testid="mock-back-button">BackButton</div>,
}));

jest.mock("@/components/empty-section", () => ({
  EmptySection: ({ title }: any) => (
    <div data-testid="mock-empty-section">{title}</div>
  ),
}));

jest.mock("../components/PaintingNavigation", () => ({
  PaintingNavigation: ({ position, total }: any) => (
    <nav data-testid="mock-navigation">
      {position}/{total}
    </nav>
  ),
}));

jest.mock("../components/PaintingImage", () => ({
  PaintingImage: ({ onShow3D, onOpenFullscreen }: any) => (
    <div data-testid="mock-painting-image">
      <button type="button" onClick={onShow3D}>
        Show 3D
      </button>
      <button type="button" onClick={onOpenFullscreen}>
        Open Fullscreen
      </button>
    </div>
  ),
}));

jest.mock("../components/PaintingDetails", () => ({
  PaintingDetails: ({ painting }: any) => (
    <div data-testid="mock-painting-details">{painting.namePainting}</div>
  ),
}));

jest.mock("../components/FullscreenImageViewer", () => ({
  FullscreenImageViewer: () => <div data-testid="mock-fullscreen-viewer" />,
}));

jest.mock("../components/Painting3DViewer/Painting3DViewer", () => ({
  Painting3DViewer: () => <div data-testid="mock-3d-viewer" />,
  preloadPaintingTexture: jest.fn(),
}));

const painting = {
  id: "1",
  namePainting: "Noite Estrelada",
  imagePainting: "/assets/paintings/noite.jpg",
  width: 800,
  height: 600,
} as Painting;

describe("PaintingDetailsView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.show3D = false;
    mockState.isFullscreen = false;
    document.body.style.overflow = "";
  });

  it("renders the painting, its details and the navigation", () => {
    render(
      <PaintingDetailsView painting={painting} position={1} total={100} />,
    );

    expect(screen.getByTestId("mock-back-button")).toBeInTheDocument();
    expect(screen.getByTestId("mock-navigation")).toHaveTextContent("1/100");
    expect(screen.getByTestId("mock-painting-image")).toBeInTheDocument();
    expect(screen.getByTestId("mock-painting-details")).toHaveTextContent(
      "Noite Estrelada",
    );
  });

  it("shows an empty state when the painting does not exist", () => {
    render(<PaintingDetailsView painting={undefined} />);

    expect(screen.getByTestId("mock-empty-section")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-navigation")).not.toBeInTheDocument();
  });

  it("opens the 3D and fullscreen viewers", () => {
    render(<PaintingDetailsView painting={painting} />);

    fireEvent.click(screen.getByText("Show 3D"));
    fireEvent.click(screen.getByText("Open Fullscreen"));

    expect(mockState.setShow3D).toHaveBeenCalledWith(true);
    expect(mockState.setIsFullscreen).toHaveBeenCalledWith(true);
  });

  it("renders the fullscreen viewer and locks the page scroll", async () => {
    mockState.isFullscreen = true;
    const { unmount } = render(<PaintingDetailsView painting={painting} />);

    expect(
      await screen.findByTestId("mock-fullscreen-viewer"),
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("lazy-loads the 3D viewer", async () => {
    mockState.show3D = true;
    render(<PaintingDetailsView painting={painting} />);

    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
  });
});
