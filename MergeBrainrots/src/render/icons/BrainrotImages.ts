/**
 * Image-asset registry for brainrot icons.
 *
 * Mirrors `PieceImages.ts` but for fully-fused Brainrots. The drawer
 * in `PieceIcons.ts` prefers the preloaded PNG over the procedural
 * placeholder; the procedural drawer is kept as a fallback for any
 * brainrot id missing from this map (or for the brief window before
 * the PNG finishes decoding).
 */

// Stored as path fragments (no leading slash). The actual URL is built
// at load time by prefixing `import.meta.env.BASE_URL`, which resolves
// to `/` in dev and to the project subpath (e.g. `/vibe-merge-brainrot/`)
// on GitHub Pages.
const BRAINROT_IMAGE_PATHS: Record<string, string> = {
  "bombardino-cocodrilo": "assets/brainrots/bombardino-cocodrilo.png",
};

const imageCache = new Map<string, HTMLImageElement>();
let preloadPromise: Promise<void> | null = null;

/**
 * Preloads every PNG declared in `BRAINROT_IMAGE_PATHS`. Safe to call
 * any number of times — subsequent calls return the same promise.
 */
export function preloadBrainrotImages(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  const base = import.meta.env.BASE_URL;
  const entries = Object.entries(BRAINROT_IMAGE_PATHS);
  preloadPromise = Promise.all(
    entries.map(([id, path]) =>
      loadImage(`${base}${path}`).then((img) => imageCache.set(id, img)),
    ),
  ).then(() => undefined);
  return preloadPromise;
}

export function getBrainrotImage(brainrotId: string): HTMLImageElement | null {
  return imageCache.get(brainrotId) ?? null;
}

export function hasBrainrotImage(brainrotId: string): boolean {
  return brainrotId in BRAINROT_IMAGE_PATHS;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load brainrot image: ${url}`));
    img.src = url;
  });
}
