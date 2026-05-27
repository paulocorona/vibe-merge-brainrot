import { clamp, Easing, easeOutBack, easeOutCubic, easeOutElastic, easeOutQuad } from "../util/easing";
import { PieceAnimState } from "./Renderer";

export type AnimationKind =
  | "spawn"
  | "merge-result"
  | "consumed"
  | "drag-lift"
  | "drag-return"
  | "shake"
  | "vacuum"
  | "fly-to-index";

export interface FlyTarget {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
}

export interface ActiveAnimation {
  readonly instanceId: number;
  readonly kind: AnimationKind;
  readonly durationMs: number;
  startedAtMs: number;
  readonly easing: Easing;
  readonly apply: (anim: PieceAnimState, t: number) => void;
  readonly onComplete?: () => void;
}

export class Animator {
  private active: ActiveAnimation[] = [];
  private nowMs = 0;

  setNow(nowMs: number): void {
    this.nowMs = nowMs;
  }

  add(animation: ActiveAnimation): void {
    this.active.push(animation);
  }

  /**
   * Returns a fresh, defaulted PieceAnimState. Caller mutates it.
   */
  newState(): PieceAnimState {
    return { scale: 1, alpha: 1, rotation: 0, highlight: 0, offsetX: 0, offsetY: 0 };
  }

  /**
   * Resolves animations for the given instance id and writes the combined
   * effect into the supplied PieceAnimState. Returns true if at least one
   * animation was applied (i.e. the piece has a non-default render state).
   */
  apply(instanceId: number, state: PieceAnimState): boolean {
    let touched = false;
    for (const a of this.active) {
      if (a.instanceId !== instanceId) continue;
      const tRaw = clamp((this.nowMs - a.startedAtMs) / a.durationMs, 0, 1);
      const t = a.easing(tRaw);
      a.apply(state, t);
      touched = true;
    }
    return touched;
  }

  /**
   * Drops completed animations and fires onComplete callbacks.
   */
  tick(): void {
    if (this.active.length === 0) return;
    const survivors: ActiveAnimation[] = [];
    for (const a of this.active) {
      const t = (this.nowMs - a.startedAtMs) / a.durationMs;
      if (t >= 1) {
        a.onComplete?.();
      } else {
        survivors.push(a);
      }
    }
    this.active = survivors;
  }

  cancelFor(instanceId: number): void {
    this.active = this.active.filter((a) => a.instanceId !== instanceId);
  }

  clear(): void {
    this.active = [];
  }

  isAnimating(instanceId: number): boolean {
    return this.active.some((a) => a.instanceId === instanceId);
  }
}

export function makeSpawnAnim(instanceId: number, nowMs: number): ActiveAnimation {
  return {
    instanceId,
    kind: "spawn",
    durationMs: 280,
    startedAtMs: nowMs,
    easing: easeOutBack,
    apply: (anim, t) => {
      anim.scale = 0.2 + 0.8 * t;
      anim.alpha = Math.min(1, anim.alpha * (0.3 + 0.7 * t));
    },
  };
}

export function makeMergeResultAnim(instanceId: number, nowMs: number): ActiveAnimation {
  return {
    instanceId,
    kind: "merge-result",
    durationMs: 420,
    startedAtMs: nowMs,
    easing: easeOutElastic,
    apply: (anim, t) => {
      // Punch from 1.35 -> 1.0
      anim.scale = 1 + (1 - t) * 0.35;
      anim.highlight = Math.max(anim.highlight, 1 - t);
    },
  };
}

export function makeConsumedAnim(
  instanceId: number,
  nowMs: number,
  flyTo: { x: number; y: number } | null = null,
  fromPos: { x: number; y: number } | null = null,
): ActiveAnimation {
  return {
    instanceId,
    kind: "consumed",
    durationMs: 220,
    startedAtMs: nowMs,
    easing: easeOutCubic,
    apply: (anim, t) => {
      anim.scale = 1 - t * 0.5;
      anim.alpha = 1 - t;
      if (flyTo && fromPos) {
        anim.offsetX = (flyTo.x - fromPos.x) * t;
        anim.offsetY = (flyTo.y - fromPos.y) * t;
      }
    },
  };
}

export function makeShakeAnim(instanceId: number, nowMs: number): ActiveAnimation {
  return {
    instanceId,
    kind: "shake",
    durationMs: 220,
    startedAtMs: nowMs,
    easing: easeOutQuad,
    apply: (anim, t) => {
      const amp = (1 - t) * 6;
      anim.offsetX += Math.sin(t * 60) * amp;
    },
  };
}

export function makeVacuumAnim(
  instanceId: number,
  nowMs: number,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  delayMs: number,
): ActiveAnimation {
  return {
    instanceId,
    kind: "vacuum",
    durationMs: 380,
    startedAtMs: nowMs + delayMs,
    easing: easeOutCubic,
    apply: (anim, t) => {
      anim.offsetX = (toPos.x - fromPos.x) * t;
      anim.offsetY = (toPos.y - fromPos.y) * t;
      anim.scale = 1 - t * 0.85;
      anim.alpha = 1 - t;
      anim.rotation = t * Math.PI * 0.8;
    },
  };
}

export function makeFlyToIndexAnim(
  instanceId: number,
  nowMs: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
): ActiveAnimation {
  return {
    instanceId,
    kind: "fly-to-index",
    durationMs: 700,
    startedAtMs: nowMs,
    easing: easeOutCubic,
    apply: (anim, t) => {
      anim.offsetX = (to.x - from.x) * t;
      anim.offsetY = (to.y - from.y) * t;
      anim.scale = 1 - t * 0.6;
      anim.alpha = 1 - t * 0.4;
    },
  };
}
