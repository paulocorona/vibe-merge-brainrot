/**
 * Tile sprite engine — loads the shared `tile-base.png` artwork once and
 * produces per-rarity tinted variants on demand.
 *
 * The source PNG has three meaningful colour regions:
 *   • green body  (the "stone" surface a piece sits on)
 *   • brown base  (the "dirt" plinth that lives under every piece)
 *   • dark outline (always preserved)
 *
 * For filled-piece tiles only the green family is re-hued to the rarity's
 * colour — the brown plinth stays constant across all rarities (per the
 * brief from the user). For the empty-cell variant both bands collapse
 * to grey so the empty tile reads as a single, muted slot rather than a
 * piece-shaped well with a brown base.
 */
import { RARITY_STYLES, type Rarity } from "../game/data/rarities";

export type TileVariantKey = Rarity | "empty";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number; // [0, 360)
  s: number; // [0, 1]
  l: number; // [0, 1]
}

// Resolved against `import.meta.env.BASE_URL` so the path works both in
// dev (served from `/`) and on GitHub Pages (served from a project
// subpath).
const SOURCE_URL = `${import.meta.env.BASE_URL}assets/ui/tile-base.png`;

// Empty cell uses a single tint for both image regions so the tile
// reads as a uniform dark grey button (no leftover "dirt" band under
// the top surface), while the per-pixel lightness preserved from the
// source PNG keeps the soft 3D form, rim highlight, and inner shadow.
const EMPTY_TINT: Rgb = { r: 0x73, g: 0x7c, b: 0x8a };

// Hue windows used for region classification. Tuned to the source PNG.
const GREEN_HUE_MIN = 50;
const GREEN_HUE_MAX = 190;
const BROWN_HUE_MIN = 10;
const BROWN_HUE_MAX = 50;

let sourceImage: HTMLImageElement | null = null;
let loadPromise: Promise<void> | null = null;
const cache = new Map<TileVariantKey, HTMLCanvasElement>();

export function preloadTileSprite(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      sourceImage = img;
      resolve();
    };
    img.onerror = () => reject(new Error(`Failed to load ${SOURCE_URL}`));
    img.src = SOURCE_URL;
  });
  return loadPromise;
}

/**
 * Returns a cached, pre-tinted canvas for the requested variant. Returns
 * `null` if the source image hasn't finished loading yet — callers should
 * fall back to the procedural drawing path in that case.
 */
export function getTileSprite(variant: TileVariantKey): HTMLCanvasElement | null {
  if (!sourceImage) return null;
  const cached = cache.get(variant);
  if (cached) return cached;
  const canvas = renderVariant(variant, sourceImage);
  cache.set(variant, canvas);
  return canvas;
}

function renderVariant(variant: TileVariantKey, img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("TileSprite: 2d context unavailable");
  }
  ctx.drawImage(img, 0, 0);

  let greenTarget: Rgb;
  let brownTarget: Rgb | null;
  if (variant === "empty") {
    // Same tint for both regions → fully uniform grey tile.
    greenTarget = EMPTY_TINT;
    brownTarget = EMPTY_TINT;
  } else {
    greenTarget = hexToRgb(RARITY_STYLES[variant].tileBottom);
    brownTarget = null; // keep brown plinth constant
  }
  recolor(ctx, canvas.width, canvas.height, greenTarget, brownTarget);
  return canvas;
}

function recolor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  greenTarget: Rgb,
  brownTarget: Rgb | null,
): void {
  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;
  const greenHsl = rgbToHsl(greenTarget);
  const brownHsl = brownTarget ? rgbToHsl(brownTarget) : null;

  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) continue;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const hsl = rgbToHsl({ r, g, b });
    // Skip nearly-neutral pixels (grey highlights / specular dots) so we
    // don't accidentally tint them and crush the soft highlight gradient.
    if (hsl.s < 0.08) continue;

    if (hsl.h >= GREEN_HUE_MIN && hsl.h <= GREEN_HUE_MAX) {
      const out = hslToRgb({ h: greenHsl.h, s: greenHsl.s, l: hsl.l });
      px[i] = out.r;
      px[i + 1] = out.g;
      px[i + 2] = out.b;
    } else if (brownHsl && hsl.h >= BROWN_HUE_MIN && hsl.h < BROWN_HUE_MAX) {
      const out = hslToRgb({ h: brownHsl.h, s: brownHsl.s, l: hsl.l });
      px[i] = out.r;
      px[i + 1] = out.g;
      px[i + 2] = out.b;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function hexToRgb(hex: string): Rgb {
  const cleaned = hex.startsWith("#") ? hex.slice(1) : hex;
  const v = parseInt(cleaned, 16);
  return {
    r: (v >> 16) & 0xff,
    g: (v >> 8) & 0xff,
    b: v & 0xff,
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d) % 6;
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  return {
    r: Math.round(hueToRgb(p, q, hk + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hk) * 255),
    b: Math.round(hueToRgb(p, q, hk - 1 / 3) * 255),
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}
