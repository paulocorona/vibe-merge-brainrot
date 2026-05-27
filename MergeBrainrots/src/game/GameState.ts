import { BRAINROTS } from "./data/brainrots";

export interface PersistedState {
  currency: number;
  unlockedBrainrots: string[];
  trackedBrainrotId: string | null;
  spawnUpgradeLevel: number;
  hasSeenSpawnTooltip: boolean;
  hasSeenDragTooltip: boolean;
}

export type StateListener = (state: PersistedState) => void;

export const DEFAULT_STATE: PersistedState = {
  currency: 0,
  unlockedBrainrots: [],
  trackedBrainrotId: BRAINROTS[0]?.id ?? null,
  spawnUpgradeLevel: 0,
  hasSeenSpawnTooltip: false,
  hasSeenDragTooltip: false,
};

export class GameState {
  private state: PersistedState;
  private listeners: Set<StateListener> = new Set();

  constructor(initial: Partial<PersistedState> = {}) {
    this.state = { ...DEFAULT_STATE, ...initial };
  }

  snapshot(): PersistedState {
    return {
      ...this.state,
      unlockedBrainrots: [...this.state.unlockedBrainrots],
    };
  }

  get currency(): number {
    return this.state.currency;
  }

  get unlockedBrainrots(): readonly string[] {
    return this.state.unlockedBrainrots;
  }

  get spawnUpgradeLevel(): number {
    return this.state.spawnUpgradeLevel;
  }

  get trackedBrainrotId(): string | null {
    return this.state.trackedBrainrotId;
  }

  hasSeenSpawnTooltip(): boolean {
    return this.state.hasSeenSpawnTooltip;
  }

  hasSeenDragTooltip(): boolean {
    return this.state.hasSeenDragTooltip;
  }

  isBrainrotUnlocked(id: string): boolean {
    return this.state.unlockedBrainrots.includes(id);
  }

  passiveIncomePerSec(): number {
    let total = 0;
    for (const recipe of BRAINROTS) {
      if (this.isBrainrotUnlocked(recipe.id)) {
        total += recipe.passiveIncomePerSec;
      }
    }
    return total;
  }

  addCurrency(amount: number): void {
    if (amount <= 0) return;
    this.state.currency = Math.max(0, this.state.currency + amount);
    this.emit();
  }

  trySpendCurrency(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.state.currency < amount) return false;
    this.state.currency -= amount;
    this.emit();
    return true;
  }

  unlockBrainrot(id: string): boolean {
    if (this.state.unlockedBrainrots.includes(id)) return false;
    this.state.unlockedBrainrots.push(id);
    this.emit();
    return true;
  }

  setTrackedBrainrot(id: string | null): void {
    this.state.trackedBrainrotId = id;
    this.emit();
  }

  incrementSpawnUpgrade(): void {
    this.state.spawnUpgradeLevel += 1;
    this.emit();
  }

  markSpawnTooltipSeen(): void {
    if (this.state.hasSeenSpawnTooltip) return;
    this.state.hasSeenSpawnTooltip = true;
    this.emit();
  }

  markDragTooltipSeen(): void {
    if (this.state.hasSeenDragTooltip) return;
    this.state.hasSeenDragTooltip = true;
    this.emit();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snap = this.snapshot();
    for (const l of this.listeners) l(snap);
  }
}
