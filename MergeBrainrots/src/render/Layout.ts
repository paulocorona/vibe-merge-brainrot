import { BOARD_SIZE } from "../game/Board";

export interface GridLayout {
  readonly originX: number;
  readonly originY: number;
  readonly tileSize: number;
  readonly gap: number;
  readonly cornerRadius: number;
  readonly cellSize: number;
  readonly boardSize: number;
  readonly cssWidth: number;
  readonly cssHeight: number;
}

const GAP_RATIO = 0.06;
const PADDING_RATIO = 0.04;
const TILE_RADIUS_RATIO = 0.18;

export function computeGridLayout(cssWidth: number, cssHeight: number, boardSize = BOARD_SIZE): GridLayout {
  const side = Math.min(cssWidth, cssHeight);
  const padding = side * PADDING_RATIO;
  const inner = side - padding * 2;
  // Solve: boardSize * tile + (boardSize - 1) * gap = inner where gap = tile * GAP_RATIO
  const tileSize = inner / (boardSize + (boardSize - 1) * GAP_RATIO);
  const gap = tileSize * GAP_RATIO;
  const usedWidth = boardSize * tileSize + (boardSize - 1) * gap;
  const originX = (cssWidth - usedWidth) / 2;
  const originY = (cssHeight - usedWidth) / 2;
  return {
    originX,
    originY,
    tileSize,
    gap,
    cornerRadius: tileSize * TILE_RADIUS_RATIO,
    cellSize: tileSize + gap,
    boardSize,
    cssWidth,
    cssHeight,
  };
}

export function cellToCanvas(layout: GridLayout, row: number, col: number): { x: number; y: number } {
  const x = layout.originX + col * (layout.tileSize + layout.gap);
  const y = layout.originY + row * (layout.tileSize + layout.gap);
  return { x, y };
}

export function cellCenter(layout: GridLayout, row: number, col: number): { x: number; y: number } {
  const { x, y } = cellToCanvas(layout, row, col);
  return { x: x + layout.tileSize / 2, y: y + layout.tileSize / 2 };
}

export function canvasToCell(
  layout: GridLayout,
  x: number,
  y: number,
): { row: number; col: number } | null {
  const localX = x - layout.originX;
  const localY = y - layout.originY;
  if (localX < 0 || localY < 0) return null;
  const step = layout.tileSize + layout.gap;
  const col = Math.floor(localX / step);
  const row = Math.floor(localY / step);
  if (row < 0 || col < 0 || row >= layout.boardSize || col >= layout.boardSize) return null;
  // Reject if pointer landed in the gap, not on a tile.
  const cellLeft = col * step;
  const cellTop = row * step;
  if (localX - cellLeft > layout.tileSize || localY - cellTop > layout.tileSize) return null;
  return { row, col };
}

/**
 * Returns the nearest cell to the given canvas position, even if the
 * pointer is in a gap or off the board. Used for magnetic snapping during
 * drag.
 */
export function nearestCell(
  layout: GridLayout,
  x: number,
  y: number,
): { row: number; col: number } {
  const step = layout.tileSize + layout.gap;
  const col = Math.max(0, Math.min(layout.boardSize - 1, Math.round((x - layout.originX) / step)));
  const row = Math.max(0, Math.min(layout.boardSize - 1, Math.round((y - layout.originY) / step)));
  return { row, col };
}
