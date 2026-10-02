"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { usePaintingDetails } from "./usePaintingDetails";
import { PaintingImage } from "./components/PaintingImage";
import { PaintingDetails } from "./components/PaintingDetails";
import { FullscreenImageViewer } from "./components/FullscreenImageViewer";
import { useEffect, useMemo } from "react";
import { Painting } from "@/types/types";
import { data_painting } from "../../../../public/data/data.json";
import { Image } from "lucide-react";
import { EmptySection } from "@/components/empty-section";
import { BackButton } from "@/components/ui/back-button";
import dynamic from "next/dynamic";

// three.js and the scene are only downloaded when the 3D view is opened.
const Painting3DViewer = dynamic(
  () =>
    import("./components/Painting3DViewer/Painting3DViewer").then(
      (module) => module.Painting3DViewer,
    ),
  { ssr: false },
);

function usePainting(id: string): Painting | undefined {
  return useMemo(() => {
    const foundPainting = (data_painting || []).find((p) => p.id === id);

    if (!foundPainting) {
      return undefined;
    }

    return {
      ...foundPainting,
      imagePainting: `/assets/paintings/${foundPainting.imagePainting}`,
      alt: `Obra "${foundPainting.namePainting}" (${foundPainting.datePainting}) por Van Gogh.`,
    };
  }, [id]);
}

function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isLocked]);
}

export default function PaintingsDetailsPage() {
  const { id } = useParams() as { id: string };

  const painting = usePainting(id);

  const {
    prevPainting,
    nextPainting,
    show3D,
    setShow3D,
    isFullscreen,
    setIsFullscreen,
  } = usePaintingDetails(painting);

  useBodyScrollLock(show3D || isFullscreen);

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative px-[7.5%] 2xl:px-0 my-14 md:my-20 w-full max-w-7xl mx-auto md:pl-10 2xl:pl-4 flex flex-col"
      >
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full mb-4 sm:mb-8 text-center md:text-left"
        >
          <div className="mb-6">
            <BackButton redirect="/paintings" />
          </div>

          {painting && (
            <h1
              id="painting-title"
              className="text-4xl md:text-7xl font-extrabold tracking-tight"
            >
              {painting.namePainting}
            </h1>
          )}
        </motion.header>

        {painting ? (
          <section
            aria-labelledby="painting-title"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start"
          >
            <PaintingImage
              prevPainting={prevPainting}
              nextPainting={nextPainting}
              painting={painting}
              onShow3D={() => setShow3D(true)}
              onOpenFullscreen={() => setIsFullscreen(true)}
            />
            <PaintingDetails painting={painting} />
          </section>
        ) : (
          <EmptySection
            icon={<Image aria-hidden="true" className="h-16 w-16" />}
            title="Nenhuma Pintura Encontrada"
            description="Sem obras no momento."
            onClear={() => window.location.reload()}
            buttonText="Recarregar Página"
          />
        )}
      </motion.main>

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
