import { Home, Images, Palette, User } from "lucide-react";
import type { Links } from "@/types/types";

const iconClasses = "h-5 w-5 shrink-0";

export const links: Links[] = [
  {
    label: "Início",
    href: "/",
    icon: <Home className={iconClasses} aria-hidden="true" />,
  },
  {
    label: "Galeria",
    href: "/gallery",
    icon: <Images className={iconClasses} aria-hidden="true" />,
  },
  {
    label: "Pinturas",
    href: "/paintings",
    icon: <Palette className={iconClasses} aria-hidden="true" />,
  },
  {
    label: "Sobre",
    href: "/about",
    icon: <User className={iconClasses} aria-hidden="true" />,
  },
];
