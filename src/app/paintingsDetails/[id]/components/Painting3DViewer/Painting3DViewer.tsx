"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { Hand, Minus, MousePointer2, Plus, RotateCcw, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { ArtLoader } from "@/components/ui/art-loader";
import { cn } from "@/lib/utils";
import type {
  FrameStyle,
  Painting3DViewerProps,
  ViewerControlsApi,
  WallTone,
} from "@/types/paintingDetails.type";
import { FRAME_STYLES } from "./FramedPainting";
import { CAMERA_FOV, PaintingScene, WALL_TONES } from "./PaintingScene";
import {
  createCanvasBumpMap,
  getPaintingSize,
  getRoomColor,
  getTextureSources,
  loadCachedImage,
} from "./sceneUtils";

export { preloadPaintingTexture } from "./sceneUtils";

type LoadState = {
  texture: THREE.Texture | null;
  bumpMap: THREE.Texture | null;
  /** 0–1, or null until the first bytes arrive. */
  progress: number | null;
  /** The sharp texture (and its relief) replaced the preview. */
  sharp: boolean;
  error: Error | null;
};

const EMPTY_STATE: LoadState = {
  texture: null,
  bumpMap: null,
  progress: null,
  sharp: false,
  error: null,
};

function createTexture(image: HTMLImageElement) {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Runs heavy work when the main thread is idle (after the frame paints). */
function whenIdle(callback: () => void) {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 16);
  return () => clearTimeout(id);
}

/**
 * Progressive textures: a light preview opens the scene quickly, then the
 * sharp copy and its brush-stroke relief replace it.
 */
function usePaintingTextures(src: string, attempt: number) {
  const [state, setState] = useState<LoadState>(EMPTY_STATE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` retries the download
  useEffect(() => {
    if (!src) return;
    let active = true;
    let sharpApplied = false;
    let previewFailed = false;
    let fullFailed = false;
    let cancelIdle: (() => void) | undefined;
    const created: THREE.Texture[] = [];
    setState(EMPTY_STATE);

    const { preview, full } = getTextureSources(
      src,
      window.innerWidth,
      window.devicePixelRatio,
    );

    const fail = (error: Error) => {
      if (active && previewFailed && fullFailed) {
        setState((current) => ({ ...current, error }));
      }
    };

    const previewLoad = loadCachedImage(preview, (progress) => {
      if (active && !sharpApplied) {
        setState((current) => ({ ...current, progress }));
      }
    });
    const fullLoad = loadCachedImage(full, () => {});

    previewLoad.promise
      .then((image) => {
        if (!active || sharpApplied) return;
        const texture = createTexture(image);
        created.push(texture);
        setState((current) =>
          current.sharp ? current : { ...current, texture, progress: 1 },
        );
      })
      .catch((error: Error) => {
        previewFailed = true;
        fail(error);
      });

    fullLoad.promise
      .then((image) => {
        if (!active) return;
        cancelIdle = whenIdle(() => {
          if (!active) return;
          const texture = createTexture(image);
          const bumpMap = createCanvasBumpMap(image);
          created.push(texture);
          if (bumpMap) created.push(bumpMap);
          sharpApplied = true;
          setState({
            texture,
            bumpMap,
            progress: 1,
            sharp: true,
            error: null,
          });
        });
      })
      .catch((error: Error) => {
        // The preview keeps showing when only the sharp copy failed.
        fullFailed = true;
        fail(error);
      });

    return () => {
      active = false;
      cancelIdle?.();
      previewLoad.unsubscribe();
      fullLoad.unsubscribe();
      for (const texture of created) texture.dispose();
    };
  }, [src, attempt]);

  return state;
}

export function Painting3DViewer({ painting, onClose }: Painting3DViewerProps) {
  const [attempt, setAttempt] = useState(0);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("gold");
  const [wallTone, setWallTone] = useState<WallTone>("charcoal");
  const [sceneReady, setSceneReady] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const controlsApi = useRef<ViewerControlsApi | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const title = painting.namePainting;
  const hasRequiredData =
    Boolean(painting.width) &&
    Boolean(painting.height) &&
    Boolean(painting.imagePainting);

  const { texture, bumpMap, progress, sharp, error } = usePaintingTextures(
    hasRequiredData ? painting.imagePainting : "",
    attempt,
  );

  const size = useMemo(
    () =>
      getPaintingSize(
        painting.width,
        painting.height,
        painting.physicalDimensions,
      ),
    [painting.width, painting.height, painting.physicalDimensions],
  );

  const label = useMemo(
    () => ({
      title,
      subtitle: `Vincent van Gogh · ${painting.datePainting}`,
      lines: [
        [painting.materials, painting.physicalDimensions]
          .filter(Boolean)
          .join(" · "),
        painting.local,
      ].filter(Boolean) as string[],
    }),
    [
      title,
      painting.datePainting,
      painting.materials,
      painting.physicalDimensions,
      painting.local,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!texture) setSceneReady(false);
  }, [texture]);

  const showLoader = hasRequiredData && !error && !sceneReady;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Visualizador 3D"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="dark fixed inset-0 z-[60] overflow-hidden text-foreground font-josefin transition-colors duration-700"
      style={{
        backgroundColor: `#${getRoomColor(WALL_TONES[wallTone].color).getHexString()}`,
      }}
    >
      {hasRequiredData && texture && (
        <Canvas
          frameloop="demand"
          dpr={dpr}
          camera={{ fov: CAMERA_FOV, near: 0.01, far: 60, position: [0, 0, 4] }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NeutralToneMapping,
          }}
          className="!absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Visualização 3D interativa de ${title}`}
        >
          <PerformanceMonitor
            onIncline={() => setDpr(Math.min(2, window.devicePixelRatio || 1))}
            onDecline={() => setDpr(1)}
          />
          <Suspense fallback={null}>
            <PaintingScene
              texture={texture}
              bumpMap={bumpMap}
              width={size.width}
              height={size.height}
              frameStyle={frameStyle}
              wallTone={wallTone}
              label={label}
              controlsApi={controlsApi}
              onReady={() => setSceneReady(true)}
              onInteract={() => setInteracted(true)}
            />
          </Suspense>
        </Canvas>
      )}

      <AnimatePresence>
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/80"
          >
            <ArtLoader
              label={texture ? "Montando a galeria..." : "Carregando obra..."}
              progress={progress === null ? undefined : progress * 100}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!hasRequiredData && (
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          Dados da obra indisponíveis para a visualização 3D.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <p className="text-lg">Não foi possível carregar a obra em 3D.</p>
          <Button
            variant="secondary"
            className="pb-1"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 bg-gradient-to-b from-black/50 to-transparent p-4 sm:p-6">
        <div className="pointer-events-auto max-w-[70%] text-zinc-50 drop-shadow">
          <h2 className="text-xl sm:text-2xl font-semibold leading-tight">
            {title}
          </h2>
          <p className="text-sm text-zinc-300">
            Vincent van Gogh · {painting.datePainting}
          </p>
        </div>
        <Button
          ref={closeButtonRef}
          className="pointer-events-auto rounded-full bg-black/40 text-zinc-50 hover:bg-black/60 hover:text-zinc-50 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Fechar visualizador 3D"
          variant="ghost"
          size="icon"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </header>

      <AnimatePresence>
        {sceneReady && !sharp && !error && (
          <motion.p
            key="sharpening"
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute left-1/2 top-20 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 pb-1 pt-1.5 text-xs text-zinc-200 backdrop-blur-sm sm:top-24"
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-amber-300"
              aria-hidden="true"
            />
            Carregando alta resolução…
          </motion.p>
        )}
      </AnimatePresence>

      {sceneReady && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-4 sm:p-6"
        >
          <p
            className={cn(
              "hidden sm:flex items-center gap-4 rounded-full bg-black/40 px-4 py-1.5 text-xs text-zinc-200 backdrop-blur-sm transition-opacity duration-700",
              interacted && "opacity-0",
            )}
          >
            <span className="flex items-center gap-1.5">
              <MousePointer2 className="h-3.5 w-3.5" aria-hidden="true" />
              Arraste para girar
            </span>
            <span>Role para aproximar das pinceladas</span>
            <span className="flex items-center gap-1.5">
              <Hand className="h-3.5 w-3.5" aria-hidden="true" />
              Botão direito para mover
            </span>
          </p>

          <div
            role="toolbar"
            aria-label="Controles da visualização 3D"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-black/50 px-3 py-2 text-zinc-50 backdrop-blur-md"
          >
            <fieldset className="flex items-center gap-1.5">
              <legend className="sr-only">Moldura</legend>
              <span className="hidden sm:inline text-xs text-zinc-400 pr-1 pt-0.5">
                Moldura
              </span>
              {(Object.keys(FRAME_STYLES) as FrameStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setFrameStyle(style)}
                  aria-pressed={frameStyle === style}
                  aria-label={`Moldura ${FRAME_STYLES[style].label.toLowerCase()}`}
                  title={FRAME_STYLES[style].label}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    frameStyle === style
                      ? "border-white scale-110"
                      : "border-white/20 hover:border-white/60",
                  )}
                  style={{ background: FRAME_STYLES[style].swatch }}
                />
              ))}
            </fieldset>

            <span
              className="hidden sm:block h-6 w-px bg-white/15"
              aria-hidden="true"
            />

            <fieldset className="flex items-center gap-1.5">
              <legend className="sr-only">Parede</legend>
              <span className="hidden sm:inline text-xs text-zinc-400 pr-1 pt-0.5">
                Parede
              </span>
              {(Object.keys(WALL_TONES) as WallTone[]).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setWallTone(tone)}
                  aria-pressed={wallTone === tone}
                  aria-label={`Parede ${WALL_TONES[tone].label.toLowerCase()}`}
                  title={WALL_TONES[tone].label}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    wallTone === tone
                      ? "border-white scale-110"
                      : "border-white/20 hover:border-white/60",
                  )}
                  style={{ backgroundColor: WALL_TONES[tone].color }}
                />
              ))}
            </fieldset>

            <span
              className="hidden sm:block h-6 w-px bg-white/15"
              aria-hidden="true"
            />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-50 hover:bg-white/10 hover:text-zinc-50"
                onClick={() => controlsApi.current?.zoom(-1)}
                aria-label="Afastar"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-50 hover:bg-white/10 hover:text-zinc-50"
                onClick={() => controlsApi.current?.zoom(1)}
                aria-label="Aproximar"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-50 hover:bg-white/10 hover:text-zinc-50"
                onClick={() => controlsApi.current?.reset()}
                aria-label="Restaurar visualização"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
