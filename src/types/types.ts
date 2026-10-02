import type { Dispatch, SetStateAction } from "react";
import type { PaletteColor } from "@/lib/palette";

export type Painting = {
  id: string;
  namePainting: string;
  originalTitle: string;
  datePainting: string;
  imagePainting: string;
  style: string;
  period: string;
  genre: string;
  materials: string;
  physicalDimensions: string;
  local: string;
  description: string;
  /** Dominant colors extracted by `scripts/process-images.ts`, by share. */
  palette: PaletteColor[];
  /** Tiny base64 preview shown while the full image loads. */
  blurDataURL?: string;
  width: number;
  height: number;
  alt: string;
};

export interface AppSidebarProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export interface Links {
  label: string;
  href?: string;
  icon?: React.JSX.Element | React.ReactNode;
}

export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}
