import "@testing-library/jest-dom";

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

Object.defineProperties(window.HTMLElement.prototype, {
  setPointerCapture: { value: () => {}, writable: true },
  releasePointerCapture: { value: () => {}, writable: true },
  hasPointerCapture: { value: () => false, writable: true },
});

// Defined before any test module is imported: GSAP's ScrollTrigger reads it
// when the plugin is registered.
const mockMatchMedia = () =>
  jest.fn().mockImplementation((query) => ({
    matches: query.includes("hover: none"),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia(),
});

beforeAll(() => {
  window.matchMedia = mockMatchMedia();
});