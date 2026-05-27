import type { PieceDef } from "./data/pieces";

export const BOARD_SIZE = 5;

export interface Cell {
  readonly row: number;
  readonly col: number;
}

let nextInstanceId = 1;

export interface PlacedPiece {
  readonly instanceId: number;
  piece: PieceDef;
  row: number;
  col: number;
}

export function makePlacedPiece(piece: PieceDef, row: number, col: number): PlacedPiece {
  return { instanceId: nextInstanceId++, piece, row, col };
}

export class Board {
  readonly size: number;
  private readonly cells: Array<PlacedPiece | null>;

  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.cells = new Array(size * size).fill(null);
  }

  private idx(row: number, col: number): number {
    return row * this.size + col;
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && col >= 0 && row < this.size && col < this.size;
  }

  getPieceAt(row: number, col: number): PlacedPiece | null {
    if (!this.inBounds(row, col)) return null;
    return this.cells[this.idx(row, col)] ?? null;
  }

  getEmptyCells(): Cell[] {
    const out: Cell[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.cells[this.idx(r, c)] == null) out.push({ row: r, col: c });
      }
    }
    return out;
  }

  getAllPieces(): PlacedPiece[] {
    const out: PlacedPiece[] = [];
    for (const cell of this.cells) {
      if (cell) out.push(cell);
    }
    return out;
  }

  isFull(): boolean {
    return this.cells.every((c) => c != null);
  }

  isEmpty(): boolean {
    return this.cells.every((c) => c == null);
  }

  /**
   * Places a piece in an empty cell. Returns the placed piece, or null if
   * the cell was occupied (or out of bounds).
   */
  place(piece: PieceDef, row: number, col: number): PlacedPiece | null {
    if (!this.inBounds(row, col)) return null;
    const i = this.idx(row, col);
    if (this.cells[i] != null) return null;
    const placed = makePlacedPiece(piece, row, col);
    this.cells[i] = placed;
    return placed;
  }

  /**
   * Removes whatever is at (row, col) and returns it (or null).
   */
  remove(row: number, col: number): PlacedPiece | null {
    if (!this.inBounds(row, col)) return null;
    const i = this.idx(row, col);
    const existing = this.cells[i] ?? null;
    this.cells[i] = null;
    return existing;
  }

  /**
   * Moves a piece from (fromRow, fromCol) to (toRow, toCol). The destination
   * must be empty. Returns true on success.
   */
  move(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    if (!this.inBounds(fromRow, fromCol) || !this.inBounds(toRow, toCol)) return false;
    const fi = this.idx(fromRow, fromCol);
    const ti = this.idx(toRow, toCol);
    if (fi === ti) return false;
    const moving = this.cells[fi];
    if (!moving) return false;
    if (this.cells[ti] != null) return false;
    this.cells[ti] = moving;
    this.cells[fi] = null;
    moving.row = toRow;
    moving.col = toCol;
    return true;
  }

  /**
   * Swaps the contents of two cells. Either may be empty. Returns true if
   * anything actually changed.
   */
  swap(aRow: number, aCol: number, bRow: number, bCol: number): boolean {
    if (!this.inBounds(aRow, aCol) || !this.inBounds(bRow, bCol)) return false;
    const ai = this.idx(aRow, aCol);
    const bi = this.idx(bRow, bCol);
    if (ai === bi) return false;
    const a = this.cells[ai] ?? null;
    const b = this.cells[bi] ?? null;
    this.cells[ai] = b;
    this.cells[bi] = a;
    if (a) {
      a.row = bRow;
      a.col = bCol;
    }
    if (b) {
      b.row = aRow;
      b.col = aCol;
    }
    return true;
  }

  /**
   * Replaces the piece at (row, col) with a new piece def, preserving the
   * cell location but creating a new instance id (for animation tracking).
   * The previous occupant is discarded.
   */
  replace(row: number, col: number, newDef: PieceDef): PlacedPiece | null {
    if (!this.inBounds(row, col)) return null;
    const i = this.idx(row, col);
    const placed = makePlacedPiece(newDef, row, col);
    this.cells[i] = placed;
    return placed;
  }

  clear(): PlacedPiece[] {
    const removed: PlacedPiece[] = [];
    for (let i = 0; i < this.cells.length; i++) {
      const p = this.cells[i];
      if (p) removed.push(p);
      this.cells[i] = null;
    }
    return removed;
  }
}
