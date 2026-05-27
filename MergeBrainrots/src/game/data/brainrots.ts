import type { ChainId } from "./pieces";
import type { Rarity } from "./rarities";

export interface BrainrotRecipe {
  readonly id: string;
  readonly displayName: string;
  readonly tagline: string;
  readonly emoji: string;
  readonly color: string;
  readonly rarity: Rarity;
  readonly fusion: {
    readonly leftChain: ChainId;
    readonly leftLevel: number;
    readonly rightChain: ChainId;
    readonly rightLevel: number;
  };
  readonly passiveIncomePerSec: number;
}

export const BOMBARDIERO_CROCODILO: BrainrotRecipe = {
  id: "bombardiero-crocodilo",
  displayName: "Bombardiero Cocodrilo",
  tagline: "The croc that drops the beat… and the bombs.",
  emoji: "🐊✈️",
  color: "#ff7adf",
  rarity: "common",
  fusion: {
    leftChain: "creature",
    leftLevel: 5,
    rightChain: "machine",
    rightLevel: 5,
  },
  passiveIncomePerSec: 5,
};

export const BRAINROTS: readonly BrainrotRecipe[] = [BOMBARDIERO_CROCODILO];

const BY_ID: Map<string, BrainrotRecipe> = new Map(BRAINROTS.map((b) => [b.id, b]));

export function getBrainrot(id: string): BrainrotRecipe {
  const recipe = BY_ID.get(id);
  if (!recipe) throw new Error(`Unknown brainrot: ${id}`);
  return recipe;
}

export function findBrainrotForFusion(
  aChain: ChainId,
  aLevel: number,
  bChain: ChainId,
  bLevel: number,
): BrainrotRecipe | null {
  for (const recipe of BRAINROTS) {
    const f = recipe.fusion;
    const matchAB =
      f.leftChain === aChain &&
      f.leftLevel === aLevel &&
      f.rightChain === bChain &&
      f.rightLevel === bLevel;
    const matchBA =
      f.leftChain === bChain &&
      f.leftLevel === bLevel &&
      f.rightChain === aChain &&
      f.rightLevel === aLevel;
    if (matchAB || matchBA) return recipe;
  }
  return null;
}
