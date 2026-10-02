"use client";

import { AnimatePresence } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { EmptySection } from "@/components/empty-section";
import { BackButton } from "@/components/ui/back-button";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { PaintingDetailsViewProps } from "@/types/paintingDetails.type";
import { PaintingDetails } from "./components/PaintingDetails";
import { PaintingImage } from "./components/PaintingImage";
import { PaintingNavigation } from "./components/PaintingNavigation";
import { usePaintingDetails } from "./usePaintingDetails";

const loadViewer = () =>
  import("./components/Painting3DViewer/Painting3DViewer");

// The lightbox and the 3D scene (three.js) are only downloaded when wanted.
const FullscreenImageViewer = dynamic(
  () =>
    import("./components/FullscreenImageViewer").then(
      (module) => module.FullscreenImageViewer,
    ),
  { ssr: false },
);

const Painting3DViewer = dynamic(
  () => loadViewer().then((module) => module.Painting3DViewer),
  { ssr: false },
);

function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isLocked]);
}

export function PaintingDetailsView({
  painting,
  prevPainting,
  nextPainting,
  position,
  total,
}: PaintingDetailsViewProps) {
  const scopeRef = useRef<HTMLElement>(null);
  const { show3D, setShow3D, isFullscreen, setIsFullscreen } =
    usePaintingDetails(prevPainting, nextPainting);

  useBodyScrollLock(show3D || isFullscreen);

  // Hovering the 3D button fetches the viewer code and starts downloading the
  // painting texture, so the scene is usually ready when it opens.
  const prefetched = useRef(false);
  const prefetch3D = useCallback(() => {
    if (prefetched.current || !painting) return;
    prefetched.current = true;
    loadViewer()
      .then((module) => module.preloadPaintingTexture(painting.imagePainting))
      .catch(() => {
        prefetched.current = false;
      });
  }, [painting]);

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-topbar]", { autoAlpha: 1 });
      return;
    }
    gsap.fromTo(
      "[data-topbar]",
      { autoAlpha: 0, y: -16 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" },
    );
  }, scopeRef);

  return (
    <>
      <main
        ref={scopeRef}
        className="relative mx-auto flex w-full max-w-7xl flex-col px-[6%] pb-6 pt-8 md:pl-24 md:pr-10 lg:min-h-dvh lg:py-6 short:py-4 xl:pl-28 2xl:px-10"
      >
        <div
          data-topbar
          data-reveal
          className="mb-6 flex items-center justify-between gap-4 lg:mb-4 short:mb-2"
        >
          <BackButton redirect="/paintings" />
          {painting && (
            <PaintingNavigation
              prevPainting={prevPainting}
              nextPainting={nextPainting}
              position={position}
              total={total}
            />
          )}
        </div>

        {painting ? (
          <section
            aria-labelledby="painting-title"
            className="grid flex-1 grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14"
          >
            <PaintingImage
              painting={painting}
              onShow3D={() => setShow3D(true)}
              onOpenFullscreen={() => setIsFullscreen(true)}
              onPrefetch3D={prefetch3D}
            />
            <PaintingDetails painting={painting} />
          </section>
        ) : (
          <EmptySection
            icon={<ImageIcon aria-hidden="true" className="h-16 w-16" />}
            title="Nenhuma Pintura Encontrada"
            description="Sem obras no momento."
            onClear={() => window.location.reload()}
            buttonText="Recarregar Página"
          />
        )}
      </main>

      <AnimatePresence>
        {isFullscreen && painting && (
          <FullscreenImageViewer
            key={painting.id || painting.namePainting}
            painting={painting}
            onClose={() => setIsFullscreen(false)}
          />
        )}
        {show3D && painting && (
          <Painting3DViewer
            key={`3d-${painting.id}`}
            painting={painting}
            onClose={() => setShow3D(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
