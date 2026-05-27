import { PieceDef } from "../game/data/pieces";
import {
  chainRarity,
  DEFAULT_PIECE_RARITY,
  EMPTY_CELL_STYLE,
  RARITY_STYLES,
  type Rarity,
  type RarityStyle,
} from "../game/data/rarities";
import { drawPieceIcon } from "./icons/PieceIcons";
import { getTileSprite } from "./TileSprite";

export interface PieceDrawState {
  readonly piece: PieceDef;
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
  readonly scale: number;
  readonly alpha: number;
  readonly rotation: number;
  readonly highlight: number;
  readonly lifted: boolean;
}

const WOOD_LIGHT = "#a47148";
const WOOD_DARK = "#5b3a1f";
const WOOD_OUTLINE = "#3d2510";

function pieceRarity(piece: PieceDef): Rarity {
  return chainRarity(piece.chain) ?? DEFAULT_PIECE_RARITY;
}

function pieceTileStyle(piece: PieceDef): RarityStyle {
  return RARITY_STYLES[pieceRarity(piece)];
}

/**
 * Vertical center of the green region inside the source PNG, as a
 * fraction from -0.5 (top) to 0.5 (bottom). Tuned by inspecting the
 * artwork: the green band runs roughly y=30..380 of 512, so its midpoint
 * sits ~205/512 = 0.4 from the top → ~-0.1 from the image's vertical
 * center. The icon and inner highlights are anchored to this so they
 * land on the green "stone" rather than the brown plinth.
 */
const GREEN_CENTER_Y_FRAC = -0.1;
/**
 * Icon size as a fraction of the full tile sprite (drawSize). Picked so
 * the icon fills most of the green "stone" surface without overlapping
 * the brown plinth or the rounded outline.
 */
const ICON_SIZE_FRAC = 0.6;

/**
 * Draws a single piece tile. Prefers the pre-rendered, rarity-tinted
 * tile sprite (loaded from `tile-base.png`); falls back to the original
 * procedural tile + wooden pedestal if the sprite isn't ready yet so
 * the first paint after a hard reload never shows missing tiles.
 */
export function drawPiece(ctx: CanvasRenderingContext2D, state: PieceDrawState): void {
  const { piece, cx, cy, size, scale, alpha, rotation, highlight, lifted } = state;
  if (alpha <= 0 || scale <= 0) return;

  const drawSize = size * scale;
  const tileRadius = drawSize * 0.16;
  const sprite = getTileSprite(pieceRarity(piece));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  if (rotation !== 0) ctx.rotate(rotation);

  if (lifted) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = drawSize * 0.25;
    ctx.shadowOffsetY = drawSize * 0.12;
  }

  if (sprite) {
    drawTileSprite(ctx, sprite, drawSize);
  } else {
    drawProceduralTile(ctx, drawSize, pieceTileStyle(piece));
  }

  if (lifted) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Icon sits centered on the green "stone" portion of the tile.
  const iconCx = 0;
  const iconCy = GREEN_CENTER_Y_FRAC * drawSize;
  const iconSize = drawSize * ICON_SIZE_FRAC;
  drawPieceIcon(piece.id, ctx, iconCx, iconCy, iconSize);

  if (highlight > 0) {
    ctx.globalAlpha = alpha * highlight;
    ctx.lineWidth = Math.max(2, drawSize * 0.06);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    const ringSize = drawSize * 0.92;
    roundedRectPath(ctx, -ringSize / 2, -ringSize / 2, ringSize, ringSize, tileRadius);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTileSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  drawSize: number,
): void {
  ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
}

function drawProceduralTile(
  ctx: CanvasRenderingContext2D,
  drawSize: number,
  style: RarityStyle,
): void {
  const half = drawSize / 2;
  const tileRadius = drawSize * 0.16;
  const woodH = drawSize * 0.1;
  const woodTop = half - woodH;
  drawWoodenBase(ctx, -half + drawSize * 0.04, woodTop, drawSize - drawSize * 0.08, woodH);

  const tileSize = drawSize * 0.88;
  const tileX = -tileSize / 2;
  const tileY = half - woodH - tileSize + drawSize * 0.02;

  const grad = ctx.createLinearGradient(0, tileY, 0, tileY + tileSize);
  grad.addColorStop(0, style.tileTop);
  grad.addColorStop(1, style.tileBottom);
  roundedRectPath(ctx, tileX, tileY, tileSize, tileSize, tileRadius);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = drawSize * 0.05;
  ctx.strokeStyle = style.outline;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function drawWoodenBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const r = Math.min(h * 0.45, w * 0.1);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, WOOD_LIGHT);
  grad.addColorStop(1, WOOD_DARK);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(1, h * 0.18);
  ctx.strokeStyle = WOOD_OUTLINE;
  ctx.lineJoin = "round";
  ctx.stroke();
  // Subtle horizontal grain line
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
  ctx.lineWidth = Math.max(0.5, h * 0.08);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.06, y + h * 0.55);
  ctx.lineTo(x + w * 0.94, y + h * 0.55);
  ctx.stroke();
  ctx.restore();
}

export function drawEmptyCell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const sprite = getTileSprite("empty");
  if (sprite) {
    ctx.drawImage(sprite, cx - size / 2, cy - size / 2, size, size);
    return;
  }

  // Fallback: solid grey rounded rect with no brown plinth (matches the
  // "fully grey" empty look once the sprite is available).
  const tileSize = size * 0.88;
  const tileRadius = size * 0.16;
  const tileX = cx - tileSize / 2;
  const tileY = cy - tileSize / 2;
  ctx.save();
  roundedRectPath(ctx, tileX, tileY, tileSize, tileSize, tileRadius);
  const grad = ctx.createLinearGradient(0, tileY, 0, tileY + tileSize);
  grad.addColorStop(0, EMPTY_CELL_STYLE.tileTop);
  grad.addColorStop(1, EMPTY_CELL_STYLE.tileBottom);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = size * 0.04;
  ctx.strokeStyle = EMPTY_CELL_STYLE.outline;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function roundedRectPath(
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
