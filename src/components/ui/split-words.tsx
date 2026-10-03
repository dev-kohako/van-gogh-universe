import { Fragment } from "react";

/**
 * Splits text into word spans for GSAP. With `mask`, each word sits in its
 * own clipping box so it can rise into view without overflowing the page.
 */
export function SplitWords({
  text,
  mask = false,
  wordClassName,
}: {
  text: string;
  mask?: boolean;
  wordClassName?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: words can repeat
        <Fragment key={index}>
          {mask ? (
            <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-top">
              <span data-word className={`inline-block ${wordClassName ?? ""}`}>
                {word}
              </span>
            </span>
          ) : (
            <span data-word className={wordClassName}>
              {word}
            </span>
          )}
          {index < words.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}
