import type { Board, PlacedPiece } from "../game/Board";
import { computeGridLayout, cellCenter, GridLayout } from "./Layout";
import { drawEmptyCell, drawPiece, PieceDrawState } from "./PieceRenderer";

export interface DragRenderState {
  readonly piece: PlacedPiece;
  readonly x: number;
  readonly y: number;
  readonly snapRow: number | null;
  readonly snapCol: number | null;
}

export interface PieceAnimState {
  scale: number;
  alpha: number;
  rotation: number;
  highlight: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_ANIM: PieceAnimState = {
  scale: 1,
  alpha: 1,
  rotation: 0,
  highlight: 0,
  offsetX: 0,
  offsetY: 0,
};

export interface RenderContext {
  readonly board: Board;
  readonly drag: DragRenderState | null;
  readonly hiddenInstanceIds: ReadonlySet<number>;
  readonly extraDraws: ReadonlyArray<(ctx: CanvasRenderingContext2D, layout: GridLayout) => void>;
  pieceAnim(instanceId: number): PieceAnimState | null;
}

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private layout: GridLayout;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D context");
    this.canvas = canvas;
    this.ctx = ctx;
    this.layout = computeGridLayout(1, 1);
    this.resize();
  }

  getLayout(): GridLayout {
    return this.layout;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(1, this.canvas.clientWidth);
    const cssHeight = Math.max(1, this.canvas.clientHeight);
    if (this.canvas.width !== Math.round(cssWidth * dpr)) {
      this.canvas.width = Math.round(cssWidth * dpr);
    }
    if (this.canvas.height !== Math.round(cssHeight * dpr)) {
      this.canvas.height = Math.round(cssHeight * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout = computeGridLayout(cssWidth, cssHeight);
  }

  render(context: RenderContext): void {
    const ctx = this.ctx;
    const layout = this.layout;
    ctx.clearRect(0, 0, layout.cssWidth, layout.cssHeight);

    this.drawEmptyCells(layout);
    this.drawSnapHighlight(layout, context.drag);

    const pieces = context.board.getAllPieces();
    for (const placed of pieces) {
      if (context.hiddenInstanceIds.has(placed.instanceId)) continue;
      if (context.drag && context.drag.piece.instanceId === placed.instanceId) continue;
      this.drawPlacedPiece(layout, placed, context);
    }

    for (const fn of context.extraDraws) {
      fn(ctx, layout);
    }

    if (context.drag) {
      this.drawDraggedPiece(layout, context.drag, context);
    }
  }

  private drawEmptyCells(layout: GridLayout): void {
    for (let r = 0; r < layout.boardSize; r++) {
      for (let c = 0; c < layout.boardSize; c++) {
        const { x, y } = cellCenter(layout, r, c);
        drawEmptyCell(this.ctx, x, y, layout.tileSize);
      }
    }
  }

  private drawSnapHighlight(layout: GridLayout, drag: DragRenderState | null): void {
    if (!drag || drag.snapRow == null || drag.snapCol == null) return;
    const { x, y } = cellCenter(layout, drag.snapRow, drag.snapCol);
    const ctx = this.ctx;
    const size = layout.tileSize * 1.08;
    const half = size / 2;
    ctx.save();
    ctx.lineWidth = Math.max(3, layout.tileSize * 0.05);
    ctx.strokeStyle = "rgba(255, 224, 102, 0.95)";
    ctx.shadowColor = "rgba(255, 224, 102, 0.6)";
    ctx.shadowBlur = layout.tileSize * 0.18;
    ctx.setLineDash([layout.tileSize * 0.14, layout.tileSize * 0.08]);
    roundedRect(ctx, x - half, y - half, size, size, layout.cornerRadius);
    ctx.stroke();
    ctx.restore();
  }

  private drawPlacedPiece(layout: GridLayout, placed: PlacedPiece, context: RenderContext): void {
    const center = cellCenter(layout, placed.row, placed.col);
    const anim = context.pieceAnim(placed.instanceId) ?? DEFAULT_ANIM;
    const state: PieceDrawState = {
      piece: placed.piece,
      cx: center.x + anim.offsetX,
      cy: center.y + anim.offsetY,
      size: layout.tileSize,
      scale: anim.scale,
      alpha: anim.alpha,
      rotation: anim.rotation,
      highlight: anim.highlight,
      lifted: false,
    };
    drawPiece(this.ctx, state);
  }

  private drawDraggedPiece(layout: GridLayout, drag: DragRenderState, context: RenderContext): void {
    const anim = context.pieceAnim(drag.piece.instanceId) ?? DEFAULT_ANIM;
    const state: PieceDrawState = {
      piece: drag.piece.piece,
      cx: drag.x + anim.offsetX,
      cy: drag.y + anim.offsetY,
      size: layout.tileSize,
      scale: Math.max(anim.scale, 1.08),
      alpha: anim.alpha,
      rotation: anim.rotation,
      highlight: anim.highlight,
      lifted: true,
    };
    drawPiece(this.ctx, state);
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
