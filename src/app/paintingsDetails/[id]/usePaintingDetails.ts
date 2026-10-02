import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PaintingLink } from "@/types/paintingDetails.type";

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Viewer state for the details page. Escape closes the viewers; the arrow
 * keys move to the previous / next painting while no viewer is open.
 */
export function usePaintingDetails(
  prevPainting?: PaintingLink,
  nextPainting?: PaintingLink,
) {
  const router = useRouter();
  const [show3D, setShow3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
        setShow3D(false);
        return;
      }
      if (show3D || isFullscreen || isTyping(event.target)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const target =
        event.key === "ArrowLeft"
          ? prevPainting
          : event.key === "ArrowRight"
            ? nextPainting
            : undefined;
      if (target) router.push(`/paintingsDetails/${target.id}`);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevPainting, nextPainting, show3D, isFullscreen]);

  return {
    show3D,
    setShow3D,
    isFullscreen,
    setIsFullscreen,
  };
}
