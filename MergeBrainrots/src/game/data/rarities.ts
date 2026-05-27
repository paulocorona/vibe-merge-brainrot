/**
 * Rarity system per DevelopmentPlan.md §17.
 *
 * The full planned palette has 9 tiers; the V1 prototype uses only
 * Common, Rare, and Legendary. We pre-define all colors so adding a new
 * tier later is a one-line change.
 */

import type { ChainId } from "./pieces";
import { BRAINROTS } from "./brainrots";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythical"
  | "cosmic"
  | "secret"
  | "celestial";

export interface RarityStyle {
  /** Top color of the tile gradient. */
  readonly tileTop: string;
  /** Bottom color of the tile gradient. */
  readonly tileBottom: string;
  /** Outline color for tiles and badges of this rarity. */
  readonly outline: string;
  /** A vibrant accent color for particles, glow rings, brainrot effects. */
  readonly accent: string;
  /** Human label. */
  readonly label: string;
}

export const RARITY_STYLES: Record<Rarity, RarityStyle> = {
  // Common uses the bright yellow-green from the source `tile-base.png`
  // so Common-tier tiles render with the artwork's native colour and
  // contrast cleanly against the dark-grey empty cells.
  common: {
    tileTop: "#dffd80",
    tileBottom: "#cdfb37",
    outline: "#3a5a0a",
    accent: "#9ee01a",
    label: "Common",
  },
  uncommon: {
    tileTop: "#b7eb8f",
    tileBottom: "#6cc640",
    outline: "#234d10",
    accent: "#3f9617",
    label: "Uncommon",
  },
  rare: {
    tileTop: "#88c3ff",
    tileBottom: "#3e87de",
    outline: "#0f2d57",
    accent: "#1f6dd0",
    label: "Rare",
  },
  epic: {
    tileTop: "#d3aaff",
    tileBottom: "#9c5ff0",
    outline: "#2d0e5a",
    accent: "#7a3ad6",
    label: "Epic",
  },
  legendary: {
    tileTop: "#ffe48a",
    tileBottom: "#f0a82a",
    outline: "#54320b",
    accent: "#f9c218",
    label: "Legendary",
  },
  mythical: {
    tileTop: "#ffbc7a",
    tileBottom: "#ff7a2a",
    outline: "#5a2208",
    accent: "#ff7a2a",
    label: "Mythical",
  },
  cosmic: {
    tileTop: "#a8e0ff",
    tileBottom: "#3fb0f0",
    outline: "#063754",
    accent: "#3fb0f0",
    label: "Cosmic",
  },
  secret: {
    tileTop: "#ff8b8b",
    tileBottom: "#cf2a2a",
    outline: "#4a0d0d",
    accent: "#cf2a2a",
    label: "Secret",
  },
  celestial: {
    tileTop: "#fff3a8",
    tileBottom: "#e3c032",
    outline: "#5a3e09",
    accent: "#e3c032",
    label: "Celestial",
  },
};

export const EMPTY_CELL_STYLE = {
  tileTop: "#9ba3ad",
  tileBottom: "#6a7281",
  outline: "#2c3340",
  accent: "#7a828f",
} as const;

/**
 * Returns the rarity of the brainrot that the given chain ultimately
 * fuses into, or `null` if no recipe uses this chain yet.
 *
 * For v1 every piece in a chain inherits its chain's brainrot rarity.
 * If multiple brainrots eventually share a chain, we use the rarest one
 * (so a chain with a Legendary recipe shows Legendary tiles even at L1).
 */
export function chainRarity(chain: ChainId): Rarity | null {
  let best: Rarity | null = null;
  for (const recipe of BRAINROTS) {
    if (recipe.fusion.leftChain === chain || recipe.fusion.rightChain === chain) {
      const r = recipe.rarity;
      if (best == null || RARITY_ORDER[r] > RARITY_ORDER[best]) {
        best = r;
      }
    }
  }
  return best;
}

/**
 * Default rarity for chains that aren't yet wired to any recipe — so
 * unowned/standalone pieces don't fall back to invisible grey-on-grey.
 */
export const DEFAULT_PIECE_RARITY: Rarity = "common";

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  cosmic: 6,
  secret: 7,
  celestial: 8,
};
