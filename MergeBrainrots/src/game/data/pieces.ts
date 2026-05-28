export type ChainId = "creature" | "machine";

export interface PieceDef {
  readonly id: string;
  readonly chain: ChainId;
  readonly level: number;
  readonly displayName: string;
  readonly mergeReward: number;
}

export const CHAIN_LABEL: Record<ChainId, string> = {
  creature: "Creature",
  machine: "Machine",
};

export const MAX_LEVEL = 5;

export const PIECES: readonly PieceDef[] = [
  { id: "creature-1", chain: "creature", level: 1, displayName: "Egg",              mergeReward: 1 },
  { id: "creature-2", chain: "creature", level: 2, displayName: "Cracked Egg",      mergeReward: 4 },
  { id: "creature-3", chain: "creature", level: 3, displayName: "Baby Croc",        mergeReward: 14 },
  { id: "creature-4", chain: "creature", level: 4, displayName: "Young Croc",       mergeReward: 45 },
  { id: "creature-5", chain: "creature", level: 5, displayName: "Adult Croc",       mergeReward: 140 },

  { id: "machine-1", chain: "machine", level: 1, displayName: "Gear",          mergeReward: 1 },
  { id: "machine-2", chain: "machine", level: 2, displayName: "Screw & Nut",   mergeReward: 4 },
  { id: "machine-3", chain: "machine", level: 3, displayName: "Spark Plug",    mergeReward: 14 },
  { id: "machine-4", chain: "machine", level: 4, displayName: "Motor",         mergeReward: 45 },
  { id: "machine-5", chain: "machine", level: 5, displayName: "Airplane",      mergeReward: 140 },
];

const PIECES_BY_ID: Map<string, PieceDef> = new Map(PIECES.map((p) => [p.id, p]));

export function pieceId(chain: ChainId, level: number): string {
  return `${chain}-${level}`;
}

export function getPiece(id: string): PieceDef {
  const def = PIECES_BY_ID.get(id);
  if (!def) throw new Error(`Unknown piece id: ${id}`);
  return def;
}

export function tryGetPiece(chain: ChainId, level: number): PieceDef | null {
  return PIECES_BY_ID.get(pieceId(chain, level)) ?? null;
}

export function nextLevelPiece(piece: PieceDef): PieceDef | null {
  return tryGetPiece(piece.chain, piece.level + 1);
}

export function isMaxLevel(piece: PieceDef): boolean {
  return piece.level >= MAX_LEVEL;
}
