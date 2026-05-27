import type { Board, PlacedPiece } from "../game/Board";
import {
  canvasToCell,
  cellCenter,
  GridLayout,
  nearestCell,
} from "../render/Layout";

export interface DragInfo {
  readonly piece: PlacedPiece;
  pointerX: number;
  pointerY: number;
  readonly startedAt: number;
  totalMovement: number;
  readonly grabOffsetX: number;
  readonly grabOffsetY: number;
}

export interface InputHandlers {
  readonly getBoard: () => Board;
  readonly getLayout: () => GridLayout;
  readonly onDragStart: (info: DragInfo) => void;
  readonly onDragMove: (info: DragInfo) => void;
  readonly onDrop: (info: DragInfo, target: { row: number; col: number } | null) => void;
  readonly onTap: (target: { row: number; col: number } | null) => void;
}

interface PendingTap {
  readonly kind: "tap";
  readonly startedAt: number;
  readonly startX: number;
  readonly startY: number;
  pointerX: number;
  pointerY: number;
  totalMovement: number;
}

interface ActiveDrag {
  readonly kind: "drag";
  readonly info: DragInfo;
}

type Active = PendingTap | ActiveDrag;

const TAP_MAX_MOVEMENT = 8;
const TAP_MAX_DURATION_MS = 220;

export class InputController {
  private readonly canvas: HTMLCanvasElement;
  private readonly handlers: InputHandlers;
  private active: Active | null = null;
  private pointerId: number | null = null;

  constructor(canvas: HTMLCanvasElement, handlers: InputHandlers) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.attach();
  }

  getDrag(): DragInfo | null {
    return this.active?.kind === "drag" ? this.active.info : null;
  }

  getSnapTarget(): { row: number; col: number } | null {
    const drag = this.getDrag();
    if (!drag) return null;
    return nearestCell(this.handlers.getLayout(), drag.pointerX, drag.pointerY);
  }

  destroy(): void {
    this.detach();
  }

  private attach(): void {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
    this.canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  private detach(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  private readonly onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private toCanvasCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (this.active || this.pointerId != null) return;
    if (e.button !== undefined && e.button !== 0) return;

    const { x, y } = this.toCanvasCoords(e);
    const layout = this.handlers.getLayout();
    const cell = canvasToCell(layout, x, y);

    if (!cell) {
      this.handlers.onTap(null);
      return;
    }

    this.pointerId = e.pointerId;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail if the canvas is detached; ignore.
    }

    const piece = this.handlers.getBoard().getPieceAt(cell.row, cell.col);
    if (!piece) {
      this.active = {
        kind: "tap",
        startedAt: performance.now(),
        startX: x,
        startY: y,
        pointerX: x,
        pointerY: y,
        totalMovement: 0,
      };
      return;
    }

    const center = cellCenter(layout, cell.row, cell.col);
    const drag: DragInfo = {
      piece,
      pointerX: x,
      pointerY: y,
      startedAt: performance.now(),
      totalMovement: 0,
      grabOffsetX: x - center.x,
      grabOffsetY: y - center.y,
    };
    this.active = { kind: "drag", info: drag };
    this.handlers.onDragStart(drag);
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId || !this.active) return;
    const { x, y } = this.toCanvasCoords(e);

    if (this.active.kind === "tap") {
      const dx = x - this.active.pointerX;
      const dy = y - this.active.pointerY;
      this.active.totalMovement += Math.hypot(dx, dy);
      this.active.pointerX = x;
      this.active.pointerY = y;
      return;
    }

    const drag = this.active.info;
    const dx = x - drag.pointerX;
    const dy = y - drag.pointerY;
    drag.totalMovement += Math.hypot(dx, dy);
    drag.pointerX = x;
    drag.pointerY = y;
    this.handlers.onDragMove(drag);
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    const active = this.active;
    this.pointerId = null;
    this.active = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    if (!active) return;

    const layout = this.handlers.getLayout();

    if (active.kind === "tap") {
      const duration = performance.now() - active.startedAt;
      if (active.totalMovement < TAP_MAX_MOVEMENT && duration < TAP_MAX_DURATION_MS) {
        const cell = canvasToCell(layout, active.pointerX, active.pointerY);
        this.handlers.onTap(cell);
      }
      return;
    }

    const drag = active.info;
    const duration = performance.now() - drag.startedAt;
    const isTap = drag.totalMovement < TAP_MAX_MOVEMENT && duration < TAP_MAX_DURATION_MS;
    if (isTap) {
      this.handlers.onTap({ row: drag.piece.row, col: drag.piece.col });
      this.handlers.onDrop(drag, { row: drag.piece.row, col: drag.piece.col });
      return;
    }
    const target = nearestCell(layout, drag.pointerX, drag.pointerY);
    this.handlers.onDrop(drag, target);
  };

  private readonly onPointerCancel = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    const active = this.active;
    this.pointerId = null;
    this.active = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    if (active?.kind === "drag") {
      const drag = active.info;
      this.handlers.onDrop(drag, { row: drag.piece.row, col: drag.piece.col });
    }
  };
}
