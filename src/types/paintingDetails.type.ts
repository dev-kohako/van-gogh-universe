import type * as THREE from "three";
import { Painting } from "./types";
import type { PaletteColor } from "@/lib/palette";
import { RefObject } from "react";

export type PaintingLink = { id: string | number } | undefined;

export interface PaintingImageProps {
  painting: Painting;
  prevPainting: PaintingLink | null;
  nextPainting: PaintingLink | null;
  onShow3D: () => void;
  onOpenFullscreen: () => void;
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
}

export interface PaintingNavigationProps {
  prevPainting: PaintingLink;
  nextPainting: PaintingLink;
}
