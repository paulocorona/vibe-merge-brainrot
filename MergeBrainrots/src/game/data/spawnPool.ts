import type { ChainId, PieceDef } from "./pieces";
import { getPiece, pieceId } from "./pieces";

export interface SpawnPoolEntry {
  readonly piece: PieceDef;
  readonly baseWeight: number;
}

export const INITIAL_SPAWN_POOL: readonly SpawnPoolEntry[] = [
  { piece: getPiece(pieceId("creature", 1)), baseWeight: 1 },
  { piece: getPiece(pieceId("machine", 1)), baseWeight: 1 },
];

/**
 * Hidden assistance (GDD §9 "Spawn Weighting").
 *
 * Returns a weight multiplier for the given piece based on the current
 * counts of each chain on the board. We gently bias spawning toward the
 * lagging chain so players "feel lucky" without it being obvious.
 *
 * The bias is intentionally mild — the GDD says players should *feel*
 * lucky, not realize the dice are loaded.
 */
export function laggingChainBias(
  piece: PieceDef,
  chainCounts: Record<ChainId, number>,
): number {
  const own = chainCounts[piece.chain];
  let other = 0;
  for (const key of Object.keys(chainCounts) as ChainId[]) {
    if (key !== piece.chain) other += chainCounts[key];
  }
  const diff = other - own;
  if (diff <= 0) return 1;
  return 1 + Math.min(diff * 0.25, 1.5);
}
