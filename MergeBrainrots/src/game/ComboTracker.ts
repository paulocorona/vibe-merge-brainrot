const COMBO_WINDOW_MS = 2000;

export interface ComboState {
  readonly count: number;
  readonly multiplier: number;
  readonly lastMergeAtMs: number;
}

export class ComboTracker {
  private count = 0;
  private lastMergeAtMs = -Infinity;

  registerMerge(nowMs: number): number {
    if (nowMs - this.lastMergeAtMs <= COMBO_WINDOW_MS) {
      this.count += 1;
    } else {
      this.count = 1;
    }
    this.lastMergeAtMs = nowMs;
    return this.count;
  }

  /**
   * Polled per frame so combos visibly expire even when no merge happens.
   */
  tick(nowMs: number): void {
    if (this.count > 0 && nowMs - this.lastMergeAtMs > COMBO_WINDOW_MS) {
      this.count = 0;
    }
  }

  state(nowMs: number): ComboState {
    this.tick(nowMs);
    return {
      count: this.count,
      multiplier: this.count <= 1 ? 1 : 1 + (this.count - 1) * 0.25,
      lastMergeAtMs: this.lastMergeAtMs,
    };
  }

  reset(): void {
    this.count = 0;
    this.lastMergeAtMs = -Infinity;
  }
}
