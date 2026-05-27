import { Board, PlacedPiece } from "./Board";
import { BrainrotRecipe, findBrainrotForFusion } from "./data/brainrots";
import { PieceDef, isMaxLevel, nextLevelPiece } from "./data/pieces";

export type MergeOutcome =
  | { kind: "none"; reason: "different-pieces" | "out-of-bounds" | "same-cell" | "max-level" }
  | {
      kind: "merge";
      newPiece: PlacedPiece;
      from: PlacedPiece; // discarded source (no longer on board)
      into: PlacedPiece; // discarded destination (replaced by newPiece)
      result: PieceDef;
    }
  | {
      kind: "brainrot";
      recipe: BrainrotRecipe;
      consumed: [PlacedPiece, PlacedPiece];
      atRow: number;
      atCol: number;
    };

/**
 * Attempts to merge the piece dragged from (fromRow,fromCol) onto
 * (toRow,toCol). The drop cell becomes the result location, and the source
 * cell is emptied.
 */
export function resolveMerge(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): MergeOutcome {
  if (fromRow === toRow && fromCol === toCol) {
    return { kind: "none", reason: "same-cell" };
  }
  const from = board.getPieceAt(fromRow, fromCol);
  const into = board.getPieceAt(toRow, toCol);
  if (!from || !into) {
    return { kind: "none", reason: "out-of-bounds" };
  }

  // Brainrot fusion check first — any two opposite-chain max-level pieces in
  // a registered recipe count as a fusion, regardless of order.
  const recipe = findBrainrotForFusion(
    from.piece.chain,
    from.piece.level,
    into.piece.chain,
    into.piece.level,
  );
  if (recipe) {
    board.remove(from.row, from.col);
    board.remove(into.row, into.col);
    return {
      kind: "brainrot",
      recipe,
      consumed: [from, into],
      atRow: toRow,
      atCol: toCol,
    };
  }

  if (from.piece.id !== into.piece.id) {
    return { kind: "none", reason: "different-pieces" };
  }
  if (isMaxLevel(from.piece)) {
    // Two L6 of the SAME chain do not merge — they have to go into a fusion.
    return { kind: "none", reason: "max-level" };
  }

  const upgraded = nextLevelPiece(from.piece);
  if (!upgraded) {
    return { kind: "none", reason: "max-level" };
  }

  board.remove(from.row, from.col);
  const newPiece = board.replace(toRow, toCol, upgraded);
  if (!newPiece) {
    // Should never happen — replace only fails on out-of-bounds and we just removed in-bounds.
    return { kind: "none", reason: "out-of-bounds" };
  }
  return {
    kind: "merge",
    newPiece,
    from,
    into,
    result: upgraded,
  };
}
