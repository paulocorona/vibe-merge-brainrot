import { BRAINROTS, BrainrotRecipe } from "../game/data/brainrots";
import { RARITY_STYLES } from "../game/data/rarities";
import { GameState } from "../game/GameState";
import { createBrainrotIconCanvas } from "../render/icons/PieceIcons";

export class IndexModal {
  private readonly host: HTMLElement;
  private readonly state: GameState;
  private container: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(host: HTMLElement, state: GameState) {
    this.host = host;
    this.state = state;
  }

  open(): void {
    if (this.container) return;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === backdrop) this.close();
    });

    const panel = document.createElement("div");
    panel.className = "modal-panel";
    backdrop.appendChild(panel);
    this.populatePanel(panel);

    this.container = backdrop;
    this.host.appendChild(backdrop);
    this.unsubscribe = this.state.subscribe(() => {
      if (this.container && panel.isConnected) {
        this.populatePanel(panel);
      }
    });
  }

  close(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.container?.remove();
    this.container = null;
  }

  isOpen(): boolean {
    return this.container != null;
  }

  private populatePanel(panel: HTMLElement): void {
    panel.innerHTML = "";
    const total = BRAINROTS.length;
    const unlocked = BRAINROTS.filter((b) => this.state.isBrainrotUnlocked(b.id)).length;

    const header = document.createElement("div");
    header.className = "modal-header";
    header.innerHTML = `
      <div>
        <div class="modal-title">Index</div>
        <div class="modal-sub">${unlocked} of ${total} discovered</div>
      </div>
      <button class="modal-close" data-role="close" aria-label="Close">✕</button>
    `;
    panel.appendChild(header);
    header.querySelector('[data-role="close"]')?.addEventListener("pointerdown", () => this.close());

    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";
    for (const recipe of BRAINROTS) {
      list.appendChild(this.buildCard(recipe));
    }
    panel.appendChild(list);

    const footer = document.createElement("div");
    footer.className = "index-progress";
    footer.textContent = "Tap a card to track it (coming soon)";
    panel.appendChild(footer);
  }

  private buildCard(recipe: BrainrotRecipe): HTMLElement {
    const card = document.createElement("div");
    const unlocked = this.state.isBrainrotUnlocked(recipe.id);
    card.className = `index-card${unlocked ? "" : " locked"}`;

    const header = document.createElement("div");
    header.className = "ic-header";

    const portrait = document.createElement("div");
    portrait.className = "ic-portrait";
    if (unlocked) {
      portrait.appendChild(createBrainrotIconCanvas(recipe.id, 64));
    }
    header.appendChild(portrait);

    const rarityStyle = RARITY_STYLES[recipe.rarity];
    const meta = document.createElement("div");
    meta.style.flex = "1";
    meta.innerHTML = `
      <div class="ic-name">${unlocked ? escapeHtml(recipe.displayName) : "???"}</div>
      <div class="ic-rarity" style="color:${rarityStyle.outline};background:${rarityStyle.tileTop};border:2px solid ${rarityStyle.outline};">
        ${escapeHtml(rarityStyle.label)}
      </div>
      <div class="ic-tagline">${unlocked ? escapeHtml(recipe.tagline) : "Undiscovered"}</div>
      <div class="ic-passive">${
        unlocked
          ? `+${recipe.passiveIncomePerSec}/s passive income`
          : "Discover to unlock passive income"
      }</div>
    `;
    header.appendChild(meta);
    card.appendChild(header);

    return card;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}
