import { render } from "@testing-library/react";
import * as THREE from "three";
import {
  createRingGeometry,
  FRAME_STYLES,
  FramedPainting,
  WOOD_TEXTURES,
} from "../FramedPainting";

const mockUseTexture = jest.fn((_urls: string[]) => [
  new THREE.Texture(),
  new THREE.Texture(),
  new THREE.Texture(),
]);

jest.mock("@react-three/drei", () => ({
  useTexture: (urls: string[]) => mockUseTexture(urls),
}));

jest.mock("@react-three/fiber", () => ({
  useThree: (selector: (state: { invalidate: () => void }) => unknown) =>
    selector({ invalidate: jest.fn() }),
}));

describe("createRingGeometry", () => {
  it("matches the requested footprint and stands on the wall", () => {
    const geometry = createRingGeometry(1.2, 0.9, 1, 0.7, 0.05, 0.01);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox as THREE.Box3;

    expect(box.min.x).toBeCloseTo(-0.6, 4);
    expect(box.max.x).toBeCloseTo(0.6, 4);
    expect(box.max.y).toBeCloseTo(0.45, 4);
    expect(box.min.z).toBeCloseTo(0, 4);
    expect(box.max.z).toBeCloseTo(0.05, 4);
  });
});

describe("FramedPainting", () => {
  beforeAll(() => {
    // Three.js elements are rendered as unknown DOM tags in jsdom.
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => mockUseTexture.mockClear());

  const props = {
    width: 0.9,
    height: 0.7,
    texture: new THREE.Texture(),
    bumpMap: null,
  };

  it("offers gold, wood and black frames", () => {
    expect(Object.keys(FRAME_STYLES)).toEqual(["gold", "wood", "black"]);
  });

  it("only loads wood textures for the wood frame", () => {
    render(<FramedPainting {...props} frameStyle="gold" />);
    expect(mockUseTexture).not.toHaveBeenCalled();

    render(<FramedPainting {...props} frameStyle="wood" />);
    expect(mockUseTexture).toHaveBeenCalledWith(WOOD_TEXTURES);
  });

  it("renders the canvas, liner and moulding meshes", () => {
    const { container } = render(
      <FramedPainting {...props} frameStyle="black" />,
    );
    // Canvas body, painted surface, liner and three moulding rings.
    expect(container.querySelectorAll("mesh")).toHaveLength(6);
  });
});
