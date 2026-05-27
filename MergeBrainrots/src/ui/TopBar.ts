import { GameState } from "../game/GameState";

export interface TopBarHandlers {
  readonly onCoinAdd: () => void;
}

export class TopBar {
  private readonly host: HTMLElement;
  private readonly currencyEl: HTMLElement;
  private readonly rateEl: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(host: HTMLElement, state: GameState, handlers: TopBarHandlers) {
    this.host = host;
    this.host.classList.add("top-bar");
    this.host.innerHTML = `
      <div class="coin-pill">
        <div class="coin-icon" aria-hidden="true">$</div>
        <div>
          <span class="coin-value" data-role="currency">0</span><span class="coin-rate" data-role="rate"></span>
        </div>
        <button class="coin-add" data-role="add" aria-label="Add coins">+</button>
      </div>
    `;
    this.currencyEl = this.host.querySelector('[data-role="currency"]') as HTMLElement;
    this.rateEl = this.host.querySelector('[data-role="rate"]') as HTMLElement;
    const addBtn = this.host.querySelector('[data-role="add"]') as HTMLButtonElement;
    addBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handlers.onCoinAdd();
    });

    this.unsubscribe = state.subscribe((snap) => {
      this.currencyEl.textContent = formatNumber(snap.currency);
      const rate = state.passiveIncomePerSec();
      this.rateEl.textContent = rate > 0 ? ` +${rate}/s` : "";
    });
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.host.innerHTML = "";
  }
}

function formatNumber(n: number): string {
  if (n < 1000) return String(Math.floor(n));
  if (n < 10_000) return `${(n / 1000).toFixed(2).replace(/\.?0+$/, "")}K`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
}
