import { act, render, screen } from "@testing-library/react";
import { VanGogh3DCard } from "../VanGogh3DCard";

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div data-testid="mock-canvas">{children}</div>,
  useLoader: jest.fn(() => ({
    wrapS: 0,
    wrapT: 0,
    repeat: { set: jest.fn() },
  })),
}));

jest.mock("@react-three/drei", () => ({
  OrbitControls: () => <div data-testid="mock-orbit-controls" />,
  Loader: () => <div data-testid="mock-loader" />,
  useGLTF: () => ({
    scene: { clone: jest.fn(() => ({ traverse: jest.fn() })) },
  }),
}));

jest.mock("three", () => ({
  Mesh: class MockMesh {},
  BackSide: "BackSide",
  RepeatWrapping: "RepeatWrapping",
  TextureLoader: class MockTextureLoader {},
}));

jest.mock("../RotationMenuItems", () => ({
  RotationMenuItems: ({ autoRotate, velocity }: any) => (
    <div data-testid="mock-rotation-menu">
      autoRotate: {String(autoRotate)} — velocity: {velocity}
    </div>
  ),
}));

let observerCallback: IntersectionObserverCallback;
beforeAll(() => {
  window.IntersectionObserver = jest.fn((callback) => {
    observerCallback = callback;
    return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
});

const enterViewport = () =>
  act(() =>
    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );

describe("VanGogh3DCard", () => {
  it("waits until it is near the viewport to start the 3D scene", () => {
    render(<VanGogh3DCard />);

    expect(
      screen.getByRole("region", { name: /tridimensional interativa/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("mock-canvas")).not.toBeInTheDocument();

    enterViewport();

    expect(screen.getByTestId("mock-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("mock-loader")).toBeInTheDocument();
  });

  it("shows the rotation state and its controls", () => {
    render(<VanGogh3DCard />);

    expect(
      screen.getByText(/rotação automática: ativada/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/velocidade: 0\.5/i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-rotation-menu")).toHaveTextContent(
      "autoRotate: true — velocity: 0.5",
    );
  });
});
