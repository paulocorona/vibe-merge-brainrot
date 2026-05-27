import type { BrainrotRecipe } from "../game/data/brainrots";
import { createBrainrotIconCanvas } from "../render/icons/PieceIcons";

export interface UnlockPopupHandlers {
  readonly onContinue: () => void;
  readonly getIndexButtonRect: () => DOMRect;
}

export class UnlockPopup {
  private readonly host: HTMLElement;
  private readonly handlers: UnlockPopupHandlers;
  private root: HTMLElement | null = null;

  constructor(host: HTMLElement, handlers: UnlockPopupHandlers) {
    this.host = host;
    this.handlers = handlers;
  }

  show(recipe: BrainrotRecipe): void {
    if (this.root) this.dismiss();
    const bg = document.createElement("div");
    bg.className = "unlock-popup-bg";

    const rays = document.createElement("div");
    rays.className = "unlock-rays";
    bg.appendChild(rays);

    const card = document.createElement("div");
    card.className = "unlock-card";

    const badge = document.createElement("div");
    badge.className = "uc-badge";
    badge.textContent = "★ Brainrot Unlocked ★";
    card.appendChild(badge);

    const portrait = document.createElement("div");
    portrait.className = "uc-portrait";
    portrait.appendChild(createBrainrotIconCanvas(recipe.id, 120));
    card.appendChild(portrait);

    const name = document.createElement("div");
    name.className = "uc-name";
    name.textContent = recipe.displayName;
    card.appendChild(name);

    const tagline = document.createElement("div");
    tagline.className = "uc-tagline";
    tagline.textContent = recipe.tagline;
    card.appendChild(tagline);

    const cta = document.createElement("div");
    cta.className = "uc-cta";
    cta.textContent = "Tap anywhere to continue";
    card.appendChild(cta);

    bg.appendChild(card);

    this.root = bg;
    this.host.appendChild(bg);

    const dismiss = (e: Event): void => {
      e.preventDefault();
      this.flyToIndex(recipe);
    };
    bg.addEventListener("pointerdown", dismiss, { once: true });

    setTimeout(() => {
      if (this.root === bg) this.flyToIndex(recipe);
    }, 3500);
  }

  private flyToIndex(recipe: BrainrotRecipe): void {
    if (!this.root) return;
    const root = this.root;
    this.root = null;

    const card = root.querySelector(".unlock-card") as HTMLElement | null;
    if (card) {
      card.style.transition = "transform 240ms ease-out, opacity 240ms ease-out";
      card.style.transform = "scale(0.4)";
      card.style.opacity = "0";
    }

    const target = this.handlers.getIndexButtonRect();
    const hostRect = this.host.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "unlock-flying-icon";
    fly.appendChild(createBrainrotIconCanvas(recipe.id, 58));

    const startX = hostRect.width / 2 - 32;
    const startY = hostRect.height / 2 - 32;
    fly.style.left = `${startX}px`;
    fly.style.top = `${startY}px`;
    fly.style.transition =
      "transform 600ms cubic-bezier(0.45, 0, 0.55, 1), opacity 600ms ease-out";
    root.appendChild(fly);

    const dx = target.left - hostRect.left + target.width / 2 - (startX + 32);
    const dy = target.top - hostRect.top + target.height / 2 - (startY + 32);

    requestAnimationFrame(() => {
      fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.45)`;
      fly.style.opacity = "0.2";
    });

    setTimeout(() => {
      root.remove();
      this.handlers.onContinue();
    }, 640);
  }

  private dismiss(): void {
    this.root?.remove();
    this.root = null;
  }
}
