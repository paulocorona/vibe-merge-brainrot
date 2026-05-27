export type TooltipDirection = "above" | "below";

export interface TooltipOptions {
  readonly target: HTMLElement | DOMRect;
  readonly text: string;
  readonly direction?: TooltipDirection;
  readonly offsetPx?: number;
  readonly autoHideMs?: number;
}

export class TooltipController {
  private readonly host: HTMLElement;
  private current: HTMLElement | null = null;
  private hideTimer = 0;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  show(opts: TooltipOptions): void {
    this.hide();
    const tip = document.createElement("div");
    tip.className = `tooltip ${opts.direction ?? "below"}`;
    tip.textContent = opts.text;
    this.current = tip;
    this.host.appendChild(tip);

    const rect = opts.target instanceof HTMLElement ? opts.target.getBoundingClientRect() : opts.target;
    const hostRect = this.host.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const offset = opts.offsetPx ?? 10;
    const targetCenterX = rect.left - hostRect.left + rect.width / 2;
    let left = targetCenterX - tipRect.width / 2;
    left = Math.max(8, Math.min(hostRect.width - tipRect.width - 8, left));
    tip.style.left = `${left}px`;
    if ((opts.direction ?? "below") === "below") {
      tip.style.top = `${rect.bottom - hostRect.top + offset}px`;
    } else {
      tip.style.top = `${rect.top - hostRect.top - tipRect.height - offset}px`;
    }

    if (opts.autoHideMs) {
      this.hideTimer = window.setTimeout(() => this.hide(), opts.autoHideMs);
    }
  }

  hide(): void {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }
    this.current?.remove();
    this.current = null;
  }

  isVisible(): boolean {
    return this.current != null;
  }
}
