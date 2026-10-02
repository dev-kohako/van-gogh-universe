import type * as THREE from "three";
import type { Painting } from "./types";
import type { PaletteColor } from "@/lib/palette";
import type { RefObject } from "react";

/** Minimal data about a neighbouring painting, for navigation. */
export type PaintingLink =
  | {
      id: string;
      namePainting: string;
      imagePainting?: string;
      blurDataURL?: string;
    }
  | undefined;

export interface PaintingImageProps {
  painting: Painting;
  onShow3D: () => void;
  onOpenFullscreen: () => void;
  /** Starts downloading the 3D viewer before it is opened. */
  onPrefetch3D?: () => void;
}

export interface PaintingDetailsViewProps {
  painting: Painting | undefined;
  prevPainting?: PaintingLink;
  nextPainting?: PaintingLink;
  /** 1-based position in the catalogue. */
  position?: number;
  total?: number;
}

export interface PaintingDetailsProps {
  painting: Painting;
}

export interface PaintingHeaderProps {
  painting: Painting;
}

export interface FullscreenImageViewerProps {
  painting: Painting;
  onClose: () => void;
}

export interface Painting3DViewerProps {
  painting: Painting;
  onClose: () => void;
}

export type FrameStyle = "gold" | "wood" | "black";

/** Text printed on the museum label next to the painting. */
export type LabelContent = {
  title: string;
  subtitle: string;
  lines: string[];
};

export type WallTone = "charcoal" | "burgundy" | "green" | "ivory";

/** Camera actions exposed by the 3D scene to the viewer toolbar. */
export interface ViewerControlsApi {
  reset: () => void;
  zoom: (direction: 1 | -1) => void;
}

export interface PaintingSceneProps {
  texture: THREE.Texture;
  bumpMap: THREE.Texture | null;
  /** Painting size in meters. */
  width: number;
  height: number;
  frameStyle: FrameStyle;
  wallTone: WallTone;
  label: LabelContent;
  controlsApi: RefObject<ViewerControlsApi | null>;
  onReady?: () => void;
  onInteract?: () => void;
}

export interface FramedPaintingProps {
  width: number;
  height: number;
  texture: THREE.Texture;
  bumpMap: THREE.Texture | null;
  frameStyle: FrameStyle;
}

export interface PaletteProps {
  colors: PaletteColor[];
}

export interface ColorSwatchProps {
  color: string;
  /** Fraction of the painting (0–1) covered by this color. */
  share?: number;
  onCopy: (color: string) => void;
  /** Highlighted together with its segment in the proportion bar. */
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
}

export interface PaintingNavigationProps {
  prevPainting: PaintingLink;
  nextPainting: PaintingLink;
  position?: number;
  total?: number;
}
