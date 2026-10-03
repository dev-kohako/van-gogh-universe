import { gsap } from "./gsap";

/** Elements sorted by where they sit on screen: row by row, left to right. */
export function sortByPosition<T extends Element>(elements: T[]) {
  return elements
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .sort(
      (a, b) =>
        Math.round(a.rect.top / 40) - Math.round(b.rect.top / 40) ||
        a.rect.left - b.rect.left,
    )
    .map(({ element }) => element);
}

/**
 * Paintings are unveiled like a gallery curtain rising: the frame opens from
 * the bottom while the picture inside (`[data-reveal-media]`) settles from a
 * close, dim view into full light.
 */
export function revealPaintings(
  elements: Element[],
  { stagger = 0.08, delay = 0 }: { stagger?: number; delay?: number } = {},
) {
  const items = sortByPosition(elements);
  const media = items
    .map((item) => item.querySelector("[data-reveal-media]"))
    .filter((element): element is Element => element !== null);

  return gsap
    .timeline({ delay })
    .fromTo(
      items,
      { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.15,
        ease: "expo.inOut",
        stagger,
        clearProps: "clipPath",
      },
    )
    .fromTo(
      media,
      { scale: 1.3, filter: "brightness(0.35)" },
      {
        scale: 1,
        filter: "brightness(1)",
        duration: 1.6,
        ease: "expo.out",
        stagger,
        clearProps: "transform,filter",
      },
      0.2,
    );
}
