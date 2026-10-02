import { act, renderHook } from "@testing-library/react";
import { usePaintingDetails } from "../usePaintingDetails";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const prev = { id: "1", namePainting: "Primeira" };
const next = { id: "3", namePainting: "Terceira" };

const press = (key: string, target: EventTarget = window) => {
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
};

describe("usePaintingDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("starts with both viewers closed", () => {
    const { result } = renderHook(() => usePaintingDetails(prev, next));

    expect(result.current.show3D).toBe(false);
    expect(result.current.isFullscreen).toBe(false);
  });

  it("closes the viewers with Escape", () => {
    const { result } = renderHook(() => usePaintingDetails(prev, next));

    act(() => {
      result.current.setShow3D(true);
      result.current.setIsFullscreen(true);
    });
    press("Escape");

    expect(result.current.show3D).toBe(false);
    expect(result.current.isFullscreen).toBe(false);
  });

  it("moves between paintings with the arrow keys", () => {
    renderHook(() => usePaintingDetails(prev, next));

    press("ArrowLeft");
    expect(push).toHaveBeenLastCalledWith("/paintingsDetails/1");
    press("ArrowRight");
    expect(push).toHaveBeenLastCalledWith("/paintingsDetails/3");
  });

  it("ignores the arrow keys while a viewer is open or at the ends", () => {
    const { result } = renderHook(() => usePaintingDetails(undefined, next));

    press("ArrowLeft");
    expect(push).not.toHaveBeenCalled();

    act(() => result.current.setShow3D(true));
    press("ArrowRight");
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores the arrow keys while typing", () => {
    renderHook(() => usePaintingDetails(prev, next));
    const input = document.createElement("input");
    document.body.appendChild(input);

    press("ArrowRight", input);

    expect(push).not.toHaveBeenCalled();
    input.remove();
  });
});
