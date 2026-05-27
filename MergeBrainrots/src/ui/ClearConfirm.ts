export interface ClearConfirmHandlers {
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export class ClearConfirm {
  private readonly host: HTMLElement;
  private pill: HTMLElement | null = null;
  private timeoutHandle = 0;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  show(handlers: ClearConfirmHandlers): void {
    this.dismiss();
    const pill = document.createElement("div");
    pill.className = "confirm-pill";
    pill.innerHTML = `
      <span>Wipe the board?</span>
      <button data-role="cancel">Cancel</button>
      <button class="yes" data-role="confirm">Wipe</button>
    `;
    pill.querySelector('[data-role="cancel"]')?.addEventListener("pointerdown", () => {
      this.dismiss();
      handlers.onCancel();
    });
    pill.querySelector('[data-role="confirm"]')?.addEventListener("pointerdown", () => {
      this.dismiss();
      handlers.onConfirm();
    });
    this.pill = pill;
    this.host.appendChild(pill);

    this.timeoutHandle = window.setTimeout(() => {
      this.dismiss();
      handlers.onCancel();
    }, 4000);
  }

  private dismiss(): void {
    if (this.timeoutHandle) {
      window.clearTimeout(this.timeoutHandle);
      this.timeoutHandle = 0;
    }
    this.pill?.remove();
    this.pill = null;
  }
}
