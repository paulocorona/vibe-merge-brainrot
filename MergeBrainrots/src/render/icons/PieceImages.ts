/**
 * Image-asset registry for piece icons.
 *
 * Pieces listed in `PIECE_IMAGE_PATHS` are rendered by blitting the
 * preloaded PNG instead of running the procedural drawer. The
 * procedural drawer in `PieceIcons.ts` still runs as a fallback for the
 * brief window before the image finishes decoding (and for any piece
 * id that isn't in this map — useful while we're rolling out art one
 * chain at a time).
 */

// Stored as path fragments (no leading slash). The actual URL is built
// at load time by prefixing `import.meta.env.BASE_URL`, which resolves
// to `/` in dev and to the project subpath (e.g. `/vibe-merge-brainrot/`)
// on GitHub Pages.
const PIECE_IMAGE_PATHS: Record<string, string> = {
  // Creature chain (Bombardino Cocodrilo's left-hand side).
  "creature-1": "assets/pieces/creature-1.png",
  "creature-2": "assets/pieces/creature-2.png",
  "creature-3": "assets/pieces/creature-3.png",
  "creature-4": "assets/pieces/creature-4.png",
  "creature-5": "assets/pieces/creature-5.png",
  // Machine chain (Bombardino Cocodrilo's right-hand side).
  "machine-1": "assets/pieces/machine-1.png",
  "machine-2": "assets/pieces/machine-2.png",
  "machine-3": "assets/pieces/machine-3.png",
  "machine-4": "assets/pieces/machine-4.png",
  "machine-5": "assets/pieces/machine-5.png",
};

const imageCache = new Map<string, HTMLImageElement>();
let preloadPromise: Promise<void> | null = null;

/**
 * Preloads every PNG declared in `PIECE_IMAGE_PATHS`. Safe to call any
 * number of times — subsequent calls return the same promise.
 */
export function preloadPieceImages(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  const base = import.meta.env.BASE_URL;
  const entries = Object.entries(PIECE_IMAGE_PATHS);
  preloadPromise = Promise.all(
    entries.map(([id, path]) =>
      loadImage(`${base}${path}`).then((img) => imageCache.set(id, img)),
    ),
  ).then(() => undefined);
  return preloadPromise;
}

/**
 * Returns the decoded image for a piece if one is registered AND has
 * finished loading. Returns `null` if there's no art for this piece, or
 * if the asset hasn't finished decoding yet (caller should fall back to
 * the procedural drawer in that case).
 */
export function getPieceImage(pieceId: string): HTMLImageElement | null {
  return imageCache.get(pieceId) ?? null;
}

/**
 * Returns true if the piece has art registered (whether or not it has
 * finished loading). Useful for callers that want to defer rendering an
 * icon canvas until the image is actually available.
 */
export function hasPieceImage(pieceId: string): boolean {
  return pieceId in PIECE_IMAGE_PATHS;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load piece image: ${url}`));
    img.src = url;
  });
}
