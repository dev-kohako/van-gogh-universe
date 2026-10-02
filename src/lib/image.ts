/**
 * URL of a resized copy served by the Next.js image optimizer. `width` must be
 * one of the configured image sizes (e.g. 256, 640, 1080, 1920, 2048).
 */
export function getOptimizedImageUrl(src: string, width: number, quality = 80) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
