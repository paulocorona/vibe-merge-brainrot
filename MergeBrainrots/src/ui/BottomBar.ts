import { GameState } from "../game/GameState";

export interface BottomBarHandlers {
  readonly onSpawnTap: () => void;
  readonly onClearTap: () => void;
  readonly onIndexTap: () => void;
  /**
   * Hook is kept so the Shop UI can wire to it later, but the upgrade
   * button is no longer rendered in the bottom bar (it will move to
   * the Shop screen when that is built).
   */
  readonly onUpgradeTap: () => void;
  readonly getSpawnProgress: () => number;
  readonly getUpgradeCost: () => number;
  readonly canUpgrade: () => boolean;
}

export class BottomBar {
  private readonly host: HTMLElement;
  private readonly state: GameState;
  private readonly handlers: BottomBarHandlers;
  private readonly meterFillEl: HTMLElement;
  private readonly tapsLabel: HTMLElement;
  private readonly spawnBtn: HTMLButtonElement;
  private readonly indexBtn: HTMLButtonElement;
  private readonly clearBtn: HTMLButtonElement;
  private rafHandle = 0;
  private unsubscribe: (() => void) | null = null;

  constructor(host: HTMLElement, state: GameState, handlers: BottomBarHandlers) {
    this.host = host;
    this.state = state;
    this.handlers = handlers;
    this.host.classList.add("bottom-bar");
    // BASE_URL ends in `/` (e.g. `/` in dev, `/vibe-merge-brainrot/` on
    // Pages). Concatenating without a leading slash on the asset path
    // gives a URL that resolves correctly under any deployment subpath.
    const base = import.meta.env.BASE_URL;
    this.host.innerHTML = `
      <button class="bb-art-btn bb-index" data-role="index" aria-label="Open INDEX" title="Open INDEX">
        <img src="${base}assets/ui/btn-index.png" alt="INDEX" draggable="false" />
      </button>
      <div class="bb-spawn-stack">
        <div class="bb-spawn-toplabel" data-role="taps-label">10 TAPS / SPAWN</div>
        <button class="bb-art-btn bb-spawn" data-role="spawn" aria-label="Tap to spawn">
          <img src="${base}assets/ui/btn-spawn.png" alt="TAP TO SPAWN" draggable="false" />
          <span class="bb-spawn-meter">
            <span class="bb-spawn-meter-fill" data-role="meter"></span>
          </span>
        </button>
      </div>
      <button class="bb-art-btn bb-wipe" data-role="clear" aria-label="Wipe board" title="Wipe the board">
        <img src="${base}assets/ui/btn-wipe.png" alt="WIPE" draggable="false" />
      </button>
    `;
    this.spawnBtn = this.host.querySelector('[data-role="spawn"]') as HTMLButtonElement;
    this.meterFillEl = this.host.querySelector('[data-role="meter"]') as HTMLElement;
    this.tapsLabel = this.host.querySelector('[data-role="taps-label"]') as HTMLElement;
    this.indexBtn = this.host.querySelector('[data-role="index"]') as HTMLButtonElement;
    this.clearBtn = this.host.querySelector('[data-role="clear"]') as HTMLButtonElement;

    this.spawnBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.spawnBtn.classList.remove("flash");
      void this.spawnBtn.offsetWidth;
      this.spawnBtn.classList.add("flash");
      this.handlers.onSpawnTap();
    });

    this.clearBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.handlers.onClearTap();
    });

    this.indexBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.handlers.onIndexTap();
    });

    this.unsubscribe = state.subscribe(() => this.refreshTapsLabel());
    this.refreshTapsLabel();
    this.startPolling();
  }

  private refreshTapsLabel(): void {
    const tapsRequired = Math.max(1, 10 - this.state.spawnUpgradeLevel);
    this.tapsLabel.textContent =
      tapsRequired === 1 ? "1 TAP / SPAWN" : `${tapsRequired} TAPS / SPAWN`;
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    this.rafHandle = 0;
    this.host.innerHTML = "";
  }

  getSpawnButtonRect(): DOMRect {
    return this.spawnBtn.getBoundingClientRect();
  }

  getIndexButtonRect(): DOMRect {
    return this.indexBtn.getBoundingClientRect();
  }

  getClearButtonRect(): DOMRect {
    return this.clearBtn.getBoundingClientRect();
  }

  private startPolling(): void {
    const tick = (): void => {
      const progress = this.handlers.getSpawnProgress();
      this.meterFillEl.style.width = `${Math.min(100, progress * 100).toFixed(1)}%`;
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }
}
