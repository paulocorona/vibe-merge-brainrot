export type SfxEvent =
  | "spawn-tick"
  | "spawn-drop"
  | "merge-pop"
  | "merge-combo"
  | "brainrot-unlock"
  | "board-clear"
  | "ui-tap"
  | "drop-fail"
  | "upgrade";

interface OscSpec {
  readonly type: OscillatorType;
  readonly freq: number;
  readonly endFreq?: number;
  readonly attack: number;
  readonly decay: number;
  readonly sustain: number;
  readonly release: number;
  readonly volume: number;
  readonly delay?: number;
}

/**
 * Tiny WebAudio synth. Real sfx files can replace these specs later by
 * keeping the play(event) surface and swapping the implementation.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private mergeStep = 0;
  private mergeStepResetAt = 0;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  isMuted(): boolean {
    return this.muted;
  }

  resumeOnGesture(): void {
    if (this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }
  }

  play(event: SfxEvent): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const specs = this.specsFor(event, ctx.currentTime);
    for (const spec of specs) {
      this.playSpec(spec, ctx);
    }
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playSpec(spec: OscSpec, ctx: AudioContext): void {
    const start = ctx.currentTime + (spec.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.freq, start);
    if (spec.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, spec.endFreq),
        start + spec.attack + spec.decay + spec.sustain + spec.release,
      );
    }
    const peak = spec.volume;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + spec.attack);
    gain.gain.linearRampToValueAtTime(peak * 0.6, start + spec.attack + spec.decay);
    gain.gain.setValueAtTime(peak * 0.6, start + spec.attack + spec.decay + spec.sustain);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + spec.attack + spec.decay + spec.sustain + spec.release,
    );
    osc.connect(gain);
    if (this.master) gain.connect(this.master);
    else gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + spec.attack + spec.decay + spec.sustain + spec.release + 0.05);
  }

  private specsFor(event: SfxEvent, now: number): OscSpec[] {
    switch (event) {
      case "ui-tap":
        return [
          { type: "triangle", freq: 880, attack: 0.005, decay: 0.04, sustain: 0, release: 0.05, volume: 0.08 },
        ];
      case "spawn-tick":
        return [
          { type: "square", freq: 540, endFreq: 720, attack: 0.005, decay: 0.04, sustain: 0, release: 0.05, volume: 0.06 },
        ];
      case "spawn-drop":
        return [
          { type: "triangle", freq: 320, endFreq: 540, attack: 0.005, decay: 0.06, sustain: 0.03, release: 0.1, volume: 0.18 },
        ];
      case "merge-pop": {
        if (now - this.mergeStepResetAt > 1.8) this.mergeStep = 0;
        this.mergeStepResetAt = now;
        const steps = [440, 523, 587, 659, 740, 880];
        const f = steps[Math.min(this.mergeStep, steps.length - 1)]!;
        this.mergeStep = Math.min(this.mergeStep + 1, steps.length - 1);
        return [
          { type: "sine", freq: f, endFreq: f * 1.5, attack: 0.005, decay: 0.05, sustain: 0.04, release: 0.12, volume: 0.18 },
          { type: "triangle", freq: f * 0.5, attack: 0.005, decay: 0.04, sustain: 0, release: 0.08, volume: 0.06 },
        ];
      }
      case "merge-combo":
        return [
          { type: "sine", freq: 880, endFreq: 1320, attack: 0.005, decay: 0.04, sustain: 0.04, release: 0.1, volume: 0.16 },
          { type: "sine", freq: 660, endFreq: 990, attack: 0.005, decay: 0.04, sustain: 0.04, release: 0.1, volume: 0.1, delay: 0.04 },
        ];
      case "brainrot-unlock":
        return [
          { type: "triangle", freq: 392, endFreq: 523, attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.2, volume: 0.22 },
          { type: "triangle", freq: 523, endFreq: 659, attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.2, volume: 0.22, delay: 0.12 },
          { type: "triangle", freq: 659, endFreq: 988, attack: 0.01, decay: 0.05, sustain: 0.18, release: 0.4, volume: 0.24, delay: 0.24 },
          { type: "sine", freq: 1318, attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.5, volume: 0.18, delay: 0.36 },
        ];
      case "board-clear":
        return [
          { type: "sawtooth", freq: 440, endFreq: 80, attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4, volume: 0.18 },
          { type: "triangle", freq: 220, endFreq: 55, attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.6, volume: 0.12, delay: 0.05 },
        ];
      case "drop-fail":
        return [
          { type: "square", freq: 220, endFreq: 165, attack: 0.005, decay: 0.04, sustain: 0.02, release: 0.08, volume: 0.1 },
        ];
      case "upgrade":
        return [
          { type: "triangle", freq: 523, endFreq: 988, attack: 0.005, decay: 0.05, sustain: 0.08, release: 0.18, volume: 0.2 },
        ];
      default:
        return [];
    }
  }
}
