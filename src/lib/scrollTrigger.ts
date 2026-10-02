import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "./gsap";

// Imported only by the pages that animate on scroll, so the plugin is not
// part of every page's bundle.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { ScrollTrigger };
