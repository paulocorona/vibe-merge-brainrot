import { BRAINROTS } from "../game/data/brainrots";
import type { GameState, PersistedState } from "../game/GameState";

const STORAGE_KEY = "brainrot-merge:v0";

const KNOWN_BRAINROT_IDS = new Set(BRAINROTS.map((b) => b.id));

export function loadState(): Partial<PersistedState> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return sanitize(parsed as Partial<PersistedState>);
    }
  } catch (err) {
    console.warn("Failed to load save data:", err);
  }
  return {};
}

export function saveState(snapshot: PersistedState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn("Failed to save state:", err);
  }
}

export function clearState(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Wires a GameState instance to localStorage. Returns an unsubscribe
 * function. Save writes are debounced to avoid hammering storage during
 * passive-income ticks.
 */
export function attachAutoSave(state: GameState, debounceMs = 400): () => void {
  let timer = 0;
  return state.subscribe(() => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      saveState(state.snapshot());
      timer = 0;
    }, debounceMs);
  });
}

function sanitize(input: Partial<PersistedState>): Partial<PersistedState> {
  const out: Partial<PersistedState> = {};
  if (typeof input.currency === "number" && Number.isFinite(input.currency) && input.currency >= 0) {
    out.currency = input.currency;
  }
  if (Array.isArray(input.unlockedBrainrots)) {
    // Drop unknown ids so a stale save (e.g. from before a brainrot
    // rename) doesn't surface unresolvable entries to the UI.
    out.unlockedBrainrots = input.unlockedBrainrots.filter(
      (s): s is string => typeof s === "string" && KNOWN_BRAINROT_IDS.has(s),
    );
  }
  if (input.trackedBrainrotId === null) {
    out.trackedBrainrotId = null;
  } else if (
    typeof input.trackedBrainrotId === "string" &&
    KNOWN_BRAINROT_IDS.has(input.trackedBrainrotId)
  ) {
    out.trackedBrainrotId = input.trackedBrainrotId;
  }
  // Unknown id (e.g. saved from before a brainrot rename) → omit so the
  // DEFAULT_STATE value takes over and the user lands on a tracked
  // brainrot instead of an empty recipe panel.
  if (typeof input.spawnUpgradeLevel === "number" && input.spawnUpgradeLevel >= 0) {
    out.spawnUpgradeLevel = Math.floor(input.spawnUpgradeLevel);
  }
  if (typeof input.hasSeenSpawnTooltip === "boolean") {
    out.hasSeenSpawnTooltip = input.hasSeenSpawnTooltip;
  }
  if (typeof input.hasSeenDragTooltip === "boolean") {
    out.hasSeenDragTooltip = input.hasSeenDragTooltip;
  }
  return out;
}
