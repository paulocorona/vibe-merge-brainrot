import type { Board } from "../game/Board";
import { getBrainrot } from "../game/data/brainrots";
import { ChainId, CHAIN_LABEL, MAX_LEVEL, pieceId } from "../game/data/pieces";
import { GameState } from "../game/GameState";
import { createBrainrotIconCanvas, createPieceIconCanvas } from "../render/icons/PieceIcons";

export interface RecipeBarHandlers {
  readonly onDailyRewards: () => void;
  readonly onShop: () => void;
}

export class RecipeBar {
  private readonly host: HTMLElement;
  private readonly state: GameState;
  private readonly getBoard: () => Board;
  private readonly handlers: RecipeBarHandlers;
  private currentRecipeId: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private rafHandle = 0;
  private fillEls: Map<ChainId, HTMLElement> = new Map();
  private levelEls: Map<ChainId, HTMLElement> = new Map();

  constructor(host: HTMLElement, state: GameState, getBoard: () => Board, handlers: RecipeBarHandlers) {
    this.host = host;
    this.state = state;
    this.getBoard = getBoard;
    this.handlers = handlers;
    this.host.classList.add("recipe-bar");

    this.unsubscribe = state.subscribe((snap) => {
      if (snap.trackedBrainrotId !== this.currentRecipeId) {
        this.currentRecipeId = snap.trackedBrainrotId;
        this.rebuild();
      }
    });
    this.currentRecipeId = state.snapshot().trackedBrainrotId;
    this.rebuild();
    this.startPolling();
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    this.rafHandle = 0;
    this.host.innerHTML = "";
  }

  private rebuild(): void {
    this.fillEls.clear();
    this.levelEls.clear();
    this.host.innerHTML = "";

    const dailyBtn = this.makeSideBtn("daily", "📅", "Daily<br/>Rewards", true);
    dailyBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.handlers.onDailyRewards();
    });
    this.host.appendChild(dailyBtn);

    const panel = document.createElement("div");
    panel.className = "recipe-panel";
    this.host.appendChild(panel);

    const shopBtn = this.makeSideBtn("shop", "🛒", "Shop", true);
    shopBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.handlers.onShop();
    });
    this.host.appendChild(shopBtn);

    const recipeId = this.currentRecipeId;
    if (!recipeId) {
      panel.innerHTML = `<div class="recipe-title">No recipe tracked</div>`;
      return;
    }
    const recipe = getBrainrot(recipeId);

    const title = document.createElement("div");
    title.className = "recipe-title";
    title.textContent = "Tracked Brainrot";
    panel.appendChild(title);

    const fusion = document.createElement("div");
    fusion.className = "recipe-fusion";
    const leftIcon = createPieceIconCanvas(pieceId(recipe.fusion.leftChain, recipe.fusion.leftLevel), 36);
    const plus = document.createElement("span");
    plus.className = "rf-sign";
    plus.textContent = "+";
    const rightIcon = createPieceIconCanvas(pieceId(recipe.fusion.rightChain, recipe.fusion.rightLevel), 36);
    const eq = document.createElement("span");
    eq.className = "rf-sign";
    eq.textContent = "=";
    const brIcon = createBrainrotIconCanvas(recipe.id, 44);
    fusion.append(leftIcon, plus, rightIcon, eq, brIcon);
    panel.appendChild(fusion);

    const name = document.createElement("div");
    name.className = "recipe-name";
    name.textContent = recipe.displayName;
    panel.appendChild(name);

    const strip = document.createElement("div");
    strip.className = "recipe-chains-strip";
    strip.innerHTML = `
      ${renderChainRow("creature")}
      ${renderChainRow("machine")}
    `;
    panel.appendChild(strip);

    for (const chain of ["creature", "machine"] as ChainId[]) {
      const fill = strip.querySelector(`[data-chain="${chain}"] .rc-fill`) as HTMLElement;
      const level = strip.querySelector(`[data-chain="${chain}"] .rc-level`) as HTMLElement;
      if (fill) this.fillEls.set(chain, fill);
      if (level) this.levelEls.set(chain, level);
    }
  }

  private makeSideBtn(kind: "daily" | "shop", icon: string, labelHtml: string, withBadge: boolean): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = `cbtn side-btn ${kind === "daily" ? "" : ""}`;
    btn.setAttribute("data-kind", kind);
    btn.innerHTML = `
      <div class="side-btn-icon">${icon}</div>
      <div class="side-btn-label">${labelHtml}</div>
      ${withBadge ? `<div class="notify-badge">!</div>` : ""}
    `;
    return btn;
  }

  private startPolling(): void {
    const tick = (): void => {
      this.refreshProgress();
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }

  private refreshProgress(): void {
    if (!this.currentRecipeId) return;
    const board = this.getBoard();
    const highest: Record<ChainId, number> = { creature: 0, machine: 0 };
    for (const placed of board.getAllPieces()) {
      const cur = highest[placed.piece.chain];
      if (placed.piece.level > cur) highest[placed.piece.chain] = placed.piece.level;
    }
    for (const chain of ["creature", "machine"] as ChainId[]) {
      const level = highest[chain];
      const pct = (level / MAX_LEVEL) * 100;
      const fill = this.fillEls.get(chain);
      const label = this.levelEls.get(chain);
      if (fill) fill.style.width = `${pct}%`;
      if (label) label.textContent = `${level}/${MAX_LEVEL}`;
    }
  }
}

function renderChainRow(chain: ChainId): string {
  return `
    <div class="recipe-chain ${chain}" data-chain="${chain}">
      <div class="rc-dot"></div>
      <div class="rc-bar"><div class="rc-fill" style="width:0%"></div></div>
      <div class="rc-level" title="${CHAIN_LABEL[chain]} chain progress">0/${MAX_LEVEL}</div>
    </div>
  `;
}
