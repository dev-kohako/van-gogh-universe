import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import PaintingsDetailsPage from "../page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
}));

jest.mock("../usePaintingDetails", () => ({
  usePaintingDetails: jest.fn(() => ({
    prevPainting: { id: "0", namePainting: "Anterior" },
    nextPainting: { id: "2", namePainting: "Seguinte" },
    show3D: false,
    setShow3D: jest.fn(),
    isFullscreen: false,
    setIsFullscreen: jest.fn(),
  })),
}));

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    __esModule: true,
    motion: new Proxy(
      {},
      {
        get: (_, prop) => (props: any) =>
          React.createElement(prop as string, props, props.children),
      },
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

jest.mock("@/components/ui/back-button", () => ({
  BackButton: () => <div data-testid="mock-back-button">BackButton</div>,
}));

jest.mock("@/components/empty-section", () => ({
  EmptySection: ({ title }: any) => (
    <div data-testid="mock-empty-section">{title}</div>
  ),
}));

jest.mock("../components/PaintingImage", () => ({
  PaintingImage: ({ onShow3D, onOpenFullscreen }: any) => (
    <div data-testid="mock-painting-image">
      <button onClick={onShow3D}>Show 3D</button>
      <button onClick={onOpenFullscreen}>Open Fullscreen</button>
    </div>
  ),
}));

jest.mock("../components/PaintingDetails", () => ({
  PaintingDetails: () => (
    <div data-testid="mock-painting-details">PaintingDetails</div>
  ),
}));

jest.mock("../components/FullscreenImageViewer", () => ({
  FullscreenImageViewer: ({ onClose }: any) => (
    <div data-testid="mock-fullscreen-viewer">
      <button onClick={onClose}>Close Fullscreen</button>
    </div>
  ),
}));

jest.mock("../components/Painting3DViewer/Painting3DViewer", () => ({
  Painting3DViewer: ({ onClose }: any) => (
    <div data-testid="mock-3d-viewer">
      <button onClick={onClose}>Close 3D</button>
    </div>
  ),
}));

jest.mock("../../../../../public/data/data.json", () => ({
  data_painting: [
    {
      id: "1",
      namePainting: "Noite Estrelada",
      datePainting: "1889",
      imagePainting: "noite_estrelada.jpg",
      width: 800,
      height: 600,
    },
  ],
}));

describe("PaintingsDetailsPage", () => {
  beforeEach(() => {
    document.body.style.overflow = "auto";
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders main layout, title, and subcomponents correctly", () => {
    render(<PaintingsDetailsPage />);
    expect(screen.getByText("Noite Estrelada")).toBeInTheDocument();
    expect(screen.getByTestId("mock-back-button")).toBeInTheDocument();
    expect(screen.getByTestId("mock-painting-image")).toBeInTheDocument();
    expect(screen.getByTestId("mock-painting-details")).toBeInTheDocument();
  });

  it("renders EmptySection when painting is not found", () => {
    jest.spyOn(React, "useMemo").mockReturnValue(undefined);

    render(<PaintingsDetailsPage />);
    expect(screen.getByTestId("mock-empty-section")).toBeInTheDocument();
  });

  it("calls setShow3D and setIsFullscreen when corresponding buttons are clicked", () => {
    const { usePaintingDetails } = require("../usePaintingDetails");
    const mockSetShow3D = jest.fn();
    const mockSetIsFullscreen = jest.fn();

    usePaintingDetails.mockReturnValue({
      prevPainting: { id: "0" },
      nextPainting: { id: "2" },
      show3D: false,
      setShow3D: mockSetShow3D,
      isFullscreen: false,
      setIsFullscreen: mockSetIsFullscreen,
    });

    render(<PaintingsDetailsPage />);
    fireEvent.click(screen.getByText("Show 3D"));
    fireEvent.click(screen.getByText("Open Fullscreen"));

    expect(mockSetShow3D).toHaveBeenCalledWith(true);
    expect(mockSetIsFullscreen).toHaveBeenCalledWith(true);
  });

  it("renders FullscreenImageViewer when isFullscreen is true", () => {
    const { usePaintingDetails } = require("../usePaintingDetails");
    usePaintingDetails.mockReturnValue({
      prevPainting: { id: "0" },
      nextPainting: { id: "2" },
      show3D: false,
      setShow3D: jest.fn(),
      isFullscreen: true,
      setIsFullscreen: jest.fn(),
    });

    render(<PaintingsDetailsPage />);
    expect(screen.getByTestId("mock-fullscreen-viewer")).toBeInTheDocument();
  });

  it("renders Painting3DViewer when show3D is true", async () => {
    const { usePaintingDetails } = require("../usePaintingDetails");
    usePaintingDetails.mockReturnValue({
      prevPainting: { id: "0" },
      nextPainting: { id: "2" },
      show3D: true,
      setShow3D: jest.fn(),
      isFullscreen: false,
      setIsFullscreen: jest.fn(),
    });

    render(<PaintingsDetailsPage />);
    // The viewer is lazy-loaded with next/dynamic.
    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
  });

  it("locks and unlocks body scroll when modals open/close", () => {
    const { usePaintingDetails } = require("../usePaintingDetails");
    const setShow3D = jest.fn();
    const setIsFullscreen = jest.fn();

    usePaintingDetails.mockReturnValue({
      prevPainting: { id: "0" },
      nextPainting: { id: "2" },
      show3D: true,
      setShow3D,
      isFullscreen: false,
      setIsFullscreen,
    });

    render(<PaintingsDetailsPage />);
    expect(document.body.style.overflow).toBe("hidden");

    usePaintingDetails.mockReturnValue({
      prevPainting: { id: "0" },
      nextPainting: { id: "2" },
      show3D: false,
      setShow3D,
      isFullscreen: false,
      setIsFullscreen,
    });

    render(<PaintingsDetailsPage />);
    expect(document.body.style.overflow).toBe("auto");
  });
});
