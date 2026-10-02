import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Painting } from "@/types/types";
import { Painting3DViewer } from "../Painting3DViewer";

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-canvas">{children}</div>
  ),
}));

jest.mock("@react-three/drei", () => ({
  PerformanceMonitor: () => null,
}));

jest.mock("../FramedPainting", () => ({
  FRAME_STYLES: {
    gold: { label: "Dourada", swatch: "gold" },
    wood: { label: "Madeira", swatch: "brown" },
    black: { label: "Preta", swatch: "black" },
  },
}));

jest.mock("../PaintingScene", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    CAMERA_FOV: 35,
    WALL_TONES: {
      charcoal: { label: "Grafite", color: "#2b2b2e" },
      ivory: { label: "Marfim", color: "#d9d3c6" },
    },
    PaintingScene: ({ onReady, frameStyle, wallTone, label }: any) => {
      useEffect(() => onReady?.(), [onReady]);
      return (
        <div data-testid="mock-scene">
          {frameStyle}|{wallTone}|{label.subtitle}
        </div>
      );
    },
  };
});

let resolveImage: (image: HTMLImageElement) => void;
let rejectImage: (error: Error) => void;
let reportProgress: (progress: number) => void;
const mockLoadCachedImage = jest.fn();

jest.mock("../sceneUtils", () => ({
  ...jest.requireActual("../sceneUtils"),
  createCanvasBumpMap: () => null,
  loadCachedImage: (...args: any[]) => mockLoadCachedImage(...args),
}));

const painting = {
  id: "1",
  namePainting: "A Noite Estrelada",
  datePainting: "Junho de 1889",
  imagePainting: "/assets/paintings/noite.jpg",
  physicalDimensions: "73.7 cm × 92.1 cm",
  materials: "tinta a óleo sobre tela",
  local: "MoMA",
  width: 2560,
  height: 2027,
} as Painting;

describe("Painting3DViewer", () => {
  beforeEach(() => {
    mockLoadCachedImage.mockImplementation(
      (_sources: string[], onProgress: (progress: number) => void) => {
        reportProgress = onProgress;
        return {
          promise: new Promise<HTMLImageElement>((resolve, reject) => {
            resolveImage = resolve;
            rejectImage = reject;
          }),
          unsubscribe: jest.fn(),
        };
      },
    );
  });

  afterEach(() => jest.clearAllMocks());

  it("requests the optimized image first and the original as fallback", () => {
    render(<Painting3DViewer painting={painting} onClose={jest.fn()} />);

    const [sources] = mockLoadCachedImage.mock.calls[0];
    expect(sources[0]).toMatch(/^\/_next\/image\?url=/);
    expect(sources[1]).toBe(painting.imagePainting);
  });

  it("shows download progress and then the scene", async () => {
    render(<Painting3DViewer painting={painting} onClose={jest.fn()} />);

    expect(
      screen.getByRole("dialog", { name: /a noite estrelada/i }),
    ).toBeInTheDocument();

    act(() => reportProgress(0.42));
    expect(
      screen.getByRole("progressbar", { name: /carregando obra/i }),
    ).toHaveAttribute("aria-valuenow", "42");

    await act(async () => resolveImage(new Image()));

    expect(screen.getByTestId("mock-scene")).toHaveTextContent(
      "gold|charcoal|Vincent van Gogh · Junho de 1889",
    );
    expect(
      screen.getByRole("toolbar", { name: /controles da visualização 3d/i }),
    ).toBeInTheDocument();
  });

  it("lets the user change the frame and the wall", async () => {
    render(<Painting3DViewer painting={painting} onClose={jest.fn()} />);
    await act(async () => resolveImage(new Image()));

    const wood = screen.getByRole("button", { name: "Moldura madeira" });
    fireEvent.click(wood);
    fireEvent.click(screen.getByRole("button", { name: "Parede marfim" }));

    expect(wood).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("mock-scene")).toHaveTextContent("wood|ivory");
  });

  it("offers a retry when the image cannot be loaded", async () => {
    render(<Painting3DViewer painting={painting} onClose={jest.fn()} />);
    await act(async () => rejectImage(new Error("network")));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /não foi possível carregar/i,
    );
    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(mockLoadCachedImage).toHaveBeenCalledTimes(2);
  });

  it("explains when the painting has no image data", () => {
    render(
      <Painting3DViewer
        painting={{ ...painting, imagePainting: "", width: 0, height: 0 }}
        onClose={jest.fn()}
      />,
    );
    expect(
      screen.getByText(/dados da obra indisponíveis/i),
    ).toBeInTheDocument();
    expect(mockLoadCachedImage).not.toHaveBeenCalled();
  });

  it("closes from the button and with Escape", () => {
    const onClose = jest.fn();
    render(<Painting3DViewer painting={painting} onClose={onClose} />);

    const close = screen.getByRole("button", {
      name: /fechar visualizador 3d/i,
    });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
