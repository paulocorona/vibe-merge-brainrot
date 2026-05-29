import { Board, PlacedPiece } from "./Board";
import { INITIAL_SPAWN_POOL, laggingChainBias, SpawnPoolEntry } from "./data/spawnPool";
import type { ChainId } from "./data/pieces";
import { pickRandom, pickWeighted, WeightedItem } from "../util/rng";

export interface SpawnerConfig {
  /** How fast the meter fills automatically, in [0..1] per second. */
  autoFillRate: number;
  /** How much one tap adds to the meter, in [0..1]. */
  tapChunk: number;
  /** Pool to draw from. */
  pool: readonly SpawnPoolEntry[];
}

export interface SpawnEvent {
  readonly placed: PlacedPiece;
}

export class Spawner {
  private progress = 0;
  private config: SpawnerConfig;

  constructor(config?: Partial<SpawnerConfig>) {
    this.config = {
      // Slow trickle (~33s full meter) so tap-to-spawn stays the dominant
      // input on the tight 4x4 board without choking it with auto-fills.
      autoFillRate: config?.autoFillRate ?? 0.03,
      tapChunk: config?.tapChunk ?? 0.1,
      pool: config?.pool ?? INITIAL_SPAWN_POOL,
    };
  }

  getProgress(): number {
    return this.progress;
  }

  getTapChunk(): number {
    return this.config.tapChunk;
  }

  setTapChunk(value: number): void {
    this.config.tapChunk = Math.max(0.02, Math.min(1, value));
  }

  setAutoFillRate(value: number): void {
    this.config.autoFillRate = Math.max(0, value);
  }

  setPool(pool: readonly SpawnPoolEntry[]): void {
    this.config.pool = pool;
  }

  /**
   * Adds the tap chunk to the meter. Returns the new progress.
   */
  tap(): number {
    this.progress = Math.min(1, this.progress + this.config.tapChunk);
    return this.progress;
  }

  /**
   * Updates the auto-fill portion of the meter.
   */
  update(deltaSec: number): void {
    this.progress = Math.min(1, this.progress + this.config.autoFillRate * deltaSec);
  }

  isReady(): boolean {
    return this.progress >= 1;
  }

  /**
   * If the meter is full and the board has empty space, spawn one piece
   * and reset the meter. Returns the spawn event or null if nothing
   * happened.
   */
  trySpawn(board: Board): SpawnEvent | null {
    if (!this.isReady()) return null;
    const empty = board.getEmptyCells();
    if (empty.length === 0) return null;

    const chainCounts = this.countChains(board);
    const weighted: WeightedItem<SpawnPoolEntry>[] = this.config.pool.map((entry) => ({
      value: entry,
      weight: entry.baseWeight * laggingChainBias(entry.piece, chainCounts),
    }));

    const pick = pickWeighted(weighted);
    const cell = pickRandom(empty);
    const placed = board.place(pick.piece, cell.row, cell.col);
    if (!placed) return null;

    this.progress = 0;
    return { placed };
  }

  reset(): void {
    this.progress = 0;
  }

  private countChains(board: Board): Record<ChainId, number> {
    const counts: Record<ChainId, number> = { creature: 0, machine: 0 };
    for (const p of board.getAllPieces()) {
      counts[p.piece.chain] += 1;
    }
    return counts;
  }
}
