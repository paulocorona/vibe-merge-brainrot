/**
 * Procedurally drawn cartoon placeholder icons for all pieces.
 *
 * Each icon is a function `(ctx, cx, cy, size) => void` that draws the
 * icon centered at (cx, cy) inside a square of `size` pixels. Drawing
 * uses canvas primitives so we don't need to async-load any assets.
 *
 * Per-piece PNG art (when registered in `PieceImages.ts`) is preferred
 * over the procedural drawer here — see `drawPieceIcon` below. The
 * procedural drawer is kept as a fallback so the game still renders if
 * an image is missing or hasn't finished decoding yet.
 */

import { getBrainrotImage } from "./BrainrotImages";
import { getPieceImage } from "./PieceImages";

export type IconDrawer = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) => void;

// ============ Shared helpers ============

function outlinedFill(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke = "#3d2a16",
  strokeWidth = 0.05,
  size = 1,
): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth * size;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function eggPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.bezierCurveTo(cx + w * 1.05, cy - h * 0.7, cx + w * 1.1, cy + h * 0.55, cx, cy + h);
  ctx.bezierCurveTo(cx - w * 1.1, cy + h * 0.55, cx - w * 1.05, cy - h * 0.7, cx, cy - h);
  ctx.closePath();
}

function highlight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation = -0.3,
  alpha = 0.55,
): void {
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============ Creature chain ============

const EGG_FILL = "#f3e1b8";
const EGG_STROKE = "#7a5a32";
const CROC_BODY = "#7ec25b";
const CROC_BODY_DARK = "#4f8d3a";
const TOOTH = "#ffffff";

function drawEggBase(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const w = size * 0.32;
  const h = size * 0.42;
  eggPath(ctx, cx, cy, w, h);
  outlinedFill(ctx, EGG_FILL, EGG_STROKE, 0.045, size);
  // Speckles
  ctx.fillStyle = "rgba(122, 90, 50, 0.45)";
  for (const [dx, dy, r] of [
    [0.05, -0.18, 0.03],
    [-0.12, 0.05, 0.025],
    [0.08, 0.18, 0.035],
    [-0.05, -0.05, 0.02],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx + dx * size, cy + dy * size, r * size, 0, Math.PI * 2);
    ctx.fill();
  }
  highlight(ctx, cx - w * 0.45, cy - h * 0.45, w * 0.22, h * 0.13);
}

const drawEgg: IconDrawer = (ctx, cx, cy, size) => {
  drawEggBase(ctx, cx, cy, size);
};

const drawCrackedEgg: IconDrawer = (ctx, cx, cy, size) => {
  drawEggBase(ctx, cx, cy, size);
  ctx.save();
  ctx.strokeStyle = EGG_STROKE;
  ctx.lineWidth = size * 0.04;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  const y = cy - size * 0.05;
  ctx.moveTo(cx - size * 0.25, y);
  ctx.lineTo(cx - size * 0.13, y - size * 0.05);
  ctx.lineTo(cx - size * 0.04, y + size * 0.04);
  ctx.lineTo(cx + size * 0.05, y - size * 0.06);
  ctx.lineTo(cx + size * 0.14, y + size * 0.04);
  ctx.lineTo(cx + size * 0.25, y - size * 0.02);
  ctx.stroke();
  ctx.restore();
};

const drawHatchingEgg: IconDrawer = (ctx, cx, cy, size) => {
  drawEggBase(ctx, cx, cy, size);
  // Dark hole
  ctx.save();
  ctx.fillStyle = "#3a1c0d";
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.05, size * 0.18, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Croc snout coming out — a small green muzzle with teeth
  ctx.save();
  ctx.translate(cx, cy + size * 0.05);
  // Upper jaw
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, -size * 0.04);
  ctx.quadraticCurveTo(0, -size * 0.13, size * 0.16, -size * 0.04);
  ctx.lineTo(size * 0.13, size * 0.02);
  ctx.lineTo(-size * 0.13, size * 0.02);
  ctx.closePath();
  outlinedFill(ctx, CROC_BODY, "#2c4d1d", 0.035, size);
  // Tiny eye
  ctx.beginPath();
  ctx.arc(-size * 0.06, -size * 0.06, size * 0.02, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();
  // Tiny teeth on lower edge
  ctx.fillStyle = TOOTH;
  ctx.strokeStyle = "#2c4d1d";
  ctx.lineWidth = size * 0.012;
  for (const tx of [-0.1, -0.04, 0.02, 0.08]) {
    ctx.beginPath();
    ctx.moveTo(tx * size, size * 0.015);
    ctx.lineTo(tx * size + size * 0.02, size * 0.015);
    ctx.lineTo(tx * size + size * 0.01, size * 0.045);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};

function drawCrocFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  bodyScale: number,
  snoutLength: number,
  fierce: boolean,
): void {
  // Body (back)
  ctx.save();
  ctx.beginPath();
  const bw = size * 0.36 * bodyScale;
  const bh = size * 0.18 * bodyScale;
  ctx.ellipse(cx + size * 0.05, cy + size * 0.18, bw, bh, 0, 0, Math.PI * 2);
  outlinedFill(ctx, CROC_BODY_DARK, "#2c4d1d", 0.04, size);
  // Tail nub
  ctx.beginPath();
  ctx.moveTo(cx + bw * 0.85, cy + size * 0.18);
  ctx.quadraticCurveTo(cx + bw * 1.6, cy + size * 0.05, cx + bw * 1.55, cy + size * 0.22);
  ctx.quadraticCurveTo(cx + bw * 1.1, cy + size * 0.32, cx + bw * 0.85, cy + size * 0.25);
  ctx.closePath();
  outlinedFill(ctx, CROC_BODY_DARK, "#2c4d1d", 0.035, size);

  // Head — round
  ctx.beginPath();
  ctx.arc(cx - size * 0.05, cy - size * 0.02, size * 0.22 * bodyScale, 0, Math.PI * 2);
  outlinedFill(ctx, CROC_BODY, "#2c4d1d", 0.045, size);

  // Snout
  const snoutLen = size * snoutLength;
  const snoutY = cy + size * 0.05;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.05, snoutY - size * 0.08);
  ctx.lineTo(cx - size * 0.05 - snoutLen, snoutY - size * 0.04);
  ctx.quadraticCurveTo(
    cx - size * 0.05 - snoutLen - size * 0.04,
    snoutY,
    cx - size * 0.05 - snoutLen,
    snoutY + size * 0.06,
  );
  ctx.lineTo(cx - size * 0.05, snoutY + size * 0.08);
  ctx.closePath();
  outlinedFill(ctx, CROC_BODY, "#2c4d1d", 0.04, size);

  // Teeth row on the lower jaw line
  ctx.fillStyle = TOOTH;
  ctx.strokeStyle = "#2c4d1d";
  ctx.lineWidth = size * 0.012;
  const toothCount = fierce ? 5 : 3;
  for (let i = 0; i < toothCount; i++) {
    const t = (i + 0.5) / toothCount;
    const tx = cx - size * 0.05 - snoutLen * (1 - t * 0.9);
    ctx.beginPath();
    ctx.moveTo(tx, snoutY + size * 0.05);
    ctx.lineTo(tx + size * 0.025, snoutY + size * 0.05);
    ctx.lineTo(tx + size * 0.012, snoutY + size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Eye
  const eyeX = cx - size * 0.03;
  const eyeY = cy - size * 0.1;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, size * 0.05, 0, Math.PI * 2);
  outlinedFill(ctx, "#ffffff", "#2c4d1d", 0.03, size);
  ctx.beginPath();
  ctx.arc(eyeX + size * 0.012, eyeY + size * 0.005, size * 0.025, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();

  // Eye ridge bump
  ctx.beginPath();
  ctx.arc(eyeX, eyeY - size * 0.05, size * 0.04, Math.PI, Math.PI * 2);
  ctx.fillStyle = CROC_BODY_DARK;
  ctx.fill();

  ctx.restore();
}

const drawBabyCroc: IconDrawer = (ctx, cx, cy, size) => {
  drawCrocFace(ctx, cx, cy - size * 0.02, size, 0.9, 0.18, false);
};

const drawAdultCroc: IconDrawer = (ctx, cx, cy, size) => {
  drawCrocFace(ctx, cx, cy - size * 0.02, size, 1.1, 0.28, true);
};

// ============ Machine chain ============

const STEEL_LIGHT = "#cfd6df";
const STEEL_MID = "#9aa4b1";
const STEEL_DARK = "#5e6776";
const METAL_STROKE = "#2a3140";

function drawGearShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  teeth: number,
  toothDepth: number,
  fill: string,
  stroke: string,
  size: number,
): void {
  ctx.beginPath();
  const outer = radius;
  const inner = radius - toothDepth;
  const twoPi = Math.PI * 2;
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * twoPi - Math.PI / 2;
    const half = twoPi / (teeth * 4);
    const r = i % 2 === 0 ? outer : inner;
    const x1 = cx + Math.cos(angle - half) * r;
    const y1 = cy + Math.sin(angle - half) * r;
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    const x2 = cx + Math.cos(angle + half) * r;
    const y2 = cy + Math.sin(angle + half) * r;
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  outlinedFill(ctx, fill, stroke, 0.04, size);
}

const drawGear: IconDrawer = (ctx, cx, cy, size) => {
  ctx.save();
  drawGearShape(ctx, cx, cy, size * 0.38, 8, size * 0.08, STEEL_MID, METAL_STROKE, size);
  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  outlinedFill(ctx, STEEL_LIGHT, METAL_STROKE, 0.035, size);
  // Center hole
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
  outlinedFill(ctx, "#2a3140", METAL_STROKE, 0.03, size);
  // Highlight
  highlight(ctx, cx - size * 0.12, cy - size * 0.18, size * 0.12, size * 0.05, -0.5, 0.4);
  ctx.restore();
};

const drawScrewAndNut: IconDrawer = (ctx, cx, cy, size) => {
  ctx.save();
  // Screw on left — vertical
  const sx = cx - size * 0.18;
  const sw = size * 0.13;
  const sh = size * 0.5;
  // Screw shaft
  ctx.beginPath();
  ctx.moveTo(sx - sw * 0.5, cy - sh * 0.15);
  ctx.lineTo(sx + sw * 0.5, cy - sh * 0.15);
  ctx.lineTo(sx + sw * 0.5, cy + sh * 0.42);
  ctx.lineTo(sx, cy + sh * 0.5);
  ctx.lineTo(sx - sw * 0.5, cy + sh * 0.42);
  ctx.closePath();
  outlinedFill(ctx, STEEL_MID, METAL_STROKE, 0.04, size);
  // Screw threads (horizontal lines)
  ctx.strokeStyle = METAL_STROKE;
  ctx.lineWidth = size * 0.018;
  for (const ty of [-0.05, 0.05, 0.15, 0.25, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(sx - sw * 0.42, cy + sh * ty);
    ctx.lineTo(sx + sw * 0.42, cy + sh * ty);
    ctx.stroke();
  }
  // Screw head
  ctx.beginPath();
  ctx.ellipse(sx, cy - sh * 0.18, sw * 0.95, sh * 0.13, 0, 0, Math.PI * 2);
  outlinedFill(ctx, STEEL_LIGHT, METAL_STROKE, 0.04, size);
  // Slot
  ctx.strokeStyle = METAL_STROKE;
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.moveTo(sx - sw * 0.6, cy - sh * 0.18);
  ctx.lineTo(sx + sw * 0.6, cy - sh * 0.18);
  ctx.stroke();

  // Nut on right — hexagon
  const nx = cx + size * 0.22;
  const nr = size * 0.18;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = nx + Math.cos(a) * nr;
    const py = cy + Math.sin(a) * nr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  outlinedFill(ctx, STEEL_DARK, METAL_STROKE, 0.04, size);
  // Inner hex shading
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = nx + Math.cos(a) * nr * 0.7;
    const py = cy + Math.sin(a) * nr * 0.7;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  outlinedFill(ctx, STEEL_MID, METAL_STROKE, 0.03, size);
  // Center hole
  ctx.beginPath();
  ctx.arc(nx, cy, size * 0.06, 0, Math.PI * 2);
  outlinedFill(ctx, "#2a3140", METAL_STROKE, 0.025, size);
  ctx.restore();
};

const drawTurbine: IconDrawer = (ctx, cx, cy, size) => {
  ctx.save();
  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
  outlinedFill(ctx, STEEL_DARK, METAL_STROKE, 0.04, size);
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
  outlinedFill(ctx, "#1f2735", METAL_STROKE, 0.03, size);
  // Blades
  const blades = 6;
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.08, -size * 0.06, size * 0.3, -size * 0.05);
    ctx.lineTo(size * 0.32, size * 0.02);
    ctx.quadraticCurveTo(size * 0.12, size * 0.04, 0, 0);
    ctx.closePath();
    outlinedFill(ctx, STEEL_LIGHT, METAL_STROKE, 0.03, size);
    ctx.restore();
  }
  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2);
  outlinedFill(ctx, STEEL_MID, METAL_STROKE, 0.03, size);
  ctx.restore();
};

const drawMotor: IconDrawer = (ctx, cx, cy, size) => {
  ctx.save();
  // Main cylindrical body
  const bw = size * 0.6;
  const bh = size * 0.42;
  const x = cx - bw / 2;
  const y = cy - bh / 2;
  ctx.beginPath();
  ctx.moveTo(x + bh * 0.18, y);
  ctx.lineTo(x + bw - bh * 0.18, y);
  ctx.quadraticCurveTo(x + bw, y, x + bw, y + bh * 0.5);
  ctx.quadraticCurveTo(x + bw, y + bh, x + bw - bh * 0.18, y + bh);
  ctx.lineTo(x + bh * 0.18, y + bh);
  ctx.quadraticCurveTo(x, y + bh, x, y + bh * 0.5);
  ctx.quadraticCurveTo(x, y, x + bh * 0.18, y);
  ctx.closePath();
  outlinedFill(ctx, STEEL_MID, METAL_STROKE, 0.045, size);

  // Cooling fins (vertical lines)
  ctx.strokeStyle = METAL_STROKE;
  ctx.lineWidth = size * 0.022;
  for (const f of [-0.22, -0.11, 0, 0.11, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(cx + f * size, y + bh * 0.15);
    ctx.lineTo(cx + f * size, y + bh * 0.85);
    ctx.stroke();
  }

  // Output shaft right
  ctx.beginPath();
  ctx.rect(x + bw - size * 0.02, cy - size * 0.04, size * 0.13, size * 0.08);
  outlinedFill(ctx, STEEL_LIGHT, METAL_STROKE, 0.035, size);

  // Bolt left
  ctx.beginPath();
  ctx.arc(x - size * 0.04, cy, size * 0.06, 0, Math.PI * 2);
  outlinedFill(ctx, STEEL_DARK, METAL_STROKE, 0.03, size);
  ctx.beginPath();
  ctx.arc(x - size * 0.04, cy, size * 0.025, 0, Math.PI * 2);
  ctx.fillStyle = METAL_STROKE;
  ctx.fill();

  // Highlight
  highlight(ctx, cx - size * 0.05, y + bh * 0.2, size * 0.18, size * 0.04, 0, 0.35);
  ctx.restore();
};

const drawAirplane: IconDrawer = (ctx, cx, cy, size) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 12);
  const planeBody = "#dfe6ee";
  const planeDark = "#9aa4b1";
  // Fuselage
  ctx.beginPath();
  ctx.moveTo(-size * 0.38, 0);
  ctx.quadraticCurveTo(-size * 0.4, -size * 0.08, -size * 0.28, -size * 0.08);
  ctx.lineTo(size * 0.28, -size * 0.07);
  ctx.quadraticCurveTo(size * 0.4, -size * 0.04, size * 0.4, 0);
  ctx.quadraticCurveTo(size * 0.4, size * 0.05, size * 0.28, size * 0.07);
  ctx.lineTo(-size * 0.28, size * 0.08);
  ctx.quadraticCurveTo(-size * 0.4, size * 0.08, -size * 0.38, 0);
  ctx.closePath();
  outlinedFill(ctx, planeBody, METAL_STROKE, 0.04, size);

  // Wings (upper)
  ctx.beginPath();
  ctx.moveTo(-size * 0.05, -size * 0.05);
  ctx.lineTo(-size * 0.25, -size * 0.28);
  ctx.lineTo(0, -size * 0.32);
  ctx.lineTo(size * 0.15, -size * 0.06);
  ctx.closePath();
  outlinedFill(ctx, planeDark, METAL_STROKE, 0.035, size);

  // Tail
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.05);
  ctx.lineTo(-size * 0.42, -size * 0.22);
  ctx.lineTo(-size * 0.26, -size * 0.22);
  ctx.lineTo(-size * 0.22, -size * 0.06);
  ctx.closePath();
  outlinedFill(ctx, planeDark, METAL_STROKE, 0.035, size);

  // Cockpit window
  ctx.beginPath();
  ctx.ellipse(size * 0.18, -size * 0.02, size * 0.08, size * 0.045, 0, 0, Math.PI * 2);
  outlinedFill(ctx, "#7fc4ff", METAL_STROKE, 0.03, size);

  // Propeller swoosh
  ctx.strokeStyle = METAL_STROKE;
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.arc(size * 0.4, 0, size * 0.05, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.restore();
};

// ============ Brainrots ============

const drawBombardinoCocodrilo: IconDrawer = (ctx, cx, cy, size) => {
  ctx.save();
  // Big crocodile head riding an airplane body
  // Body (plane fuselage)
  ctx.translate(cx, cy + size * 0.05);
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, 0);
  ctx.quadraticCurveTo(-size * 0.45, -size * 0.1, -size * 0.32, -size * 0.1);
  ctx.lineTo(size * 0.34, -size * 0.08);
  ctx.quadraticCurveTo(size * 0.46, -size * 0.02, size * 0.42, size * 0.04);
  ctx.lineTo(-size * 0.32, size * 0.1);
  ctx.quadraticCurveTo(-size * 0.46, size * 0.1, -size * 0.42, 0);
  ctx.closePath();
  outlinedFill(ctx, "#dfe6ee", METAL_STROKE, 0.04, size);

  // Wings
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, -size * 0.06);
  ctx.lineTo(-size * 0.3, -size * 0.3);
  ctx.lineTo(0, -size * 0.34);
  ctx.lineTo(size * 0.1, -size * 0.07);
  ctx.closePath();
  outlinedFill(ctx, STEEL_MID, METAL_STROKE, 0.035, size);

  // Croc head perched on top
  ctx.translate(0, -size * 0.18);
  // Head circle
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
  outlinedFill(ctx, CROC_BODY, "#2c4d1d", 0.045, size);
  // Snout
  ctx.beginPath();
  ctx.moveTo(-size * 0.04, -size * 0.08);
  ctx.lineTo(-size * 0.28, -size * 0.04);
  ctx.quadraticCurveTo(-size * 0.32, 0, -size * 0.28, size * 0.04);
  ctx.lineTo(-size * 0.04, size * 0.08);
  ctx.closePath();
  outlinedFill(ctx, CROC_BODY, "#2c4d1d", 0.04, size);
  // Teeth
  ctx.fillStyle = TOOTH;
  ctx.strokeStyle = "#2c4d1d";
  ctx.lineWidth = size * 0.012;
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4;
    const tx = -size * 0.04 - size * 0.22 * (1 - t * 0.9);
    ctx.beginPath();
    ctx.moveTo(tx, size * 0.045);
    ctx.lineTo(tx + size * 0.025, size * 0.045);
    ctx.lineTo(tx + size * 0.012, size * 0.085);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Eye
  ctx.beginPath();
  ctx.arc(-size * 0.02, -size * 0.1, size * 0.05, 0, Math.PI * 2);
  outlinedFill(ctx, "#ffffff", "#2c4d1d", 0.03, size);
  ctx.beginPath();
  ctx.arc(-size * 0.01, -size * 0.09, size * 0.025, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();

  // Pink rim (brainrot accent)
  ctx.restore();
};

// ============ Registry ============

export const PIECE_ICONS: Record<string, IconDrawer> = {
  "creature-1": drawEgg,
  "creature-2": drawCrackedEgg,
  "creature-3": drawHatchingEgg,
  "creature-4": drawBabyCroc,
  "creature-5": drawAdultCroc,
  "machine-1": drawGear,
  "machine-2": drawScrewAndNut,
  "machine-3": drawTurbine,
  "machine-4": drawMotor,
  "machine-5": drawAirplane,
};

export const BRAINROT_ICONS: Record<string, IconDrawer> = {
  "bombardino-cocodrilo": drawBombardinoCocodrilo,
};

export function drawPieceIcon(
  pieceId: string,
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const img = getPieceImage(pieceId);
  if (img) {
    drawImageIcon(ctx, img, cx, cy, size);
    return;
  }
  const drawer = PIECE_ICONS[pieceId];
  if (drawer) drawer(ctx, cx, cy, size);
}

/**
 * Blits a piece image centered at (cx, cy) inside a square of `size`
 * pixels. The image is fit using "contain" semantics so non-square
 * artwork keeps its aspect ratio without bleeding outside the tile.
 *
 * IMAGE_OVERSCAN compensates for the transparent padding around the
 * actual artwork in our piece PNGs — without it the icons read as
 * noticeably smaller than the procedural placeholders that fill their
 * full bounding box. 1.3 was chosen to roughly match the visual weight
 * of the procedural icons; tweak per-piece if individual assets end up
 * needing more or less aggressive cropping.
 */
const IMAGE_OVERSCAN = 1.3;

function drawImageIcon(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
): void {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw === 0 || ih === 0) return;
  const scale = (Math.min(size / iw, size / ih)) * IMAGE_OVERSCAN;
  const drawW = iw * scale;
  const drawH = ih * scale;
  ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
}

export function drawBrainrotIcon(
  brainrotId: string,
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const img = getBrainrotImage(brainrotId);
  if (img) {
    drawImageIcon(ctx, img, cx, cy, size);
    return;
  }
  const drawer = BRAINROT_ICONS[brainrotId];
  if (drawer) drawer(ctx, cx, cy, size);
}

/**
 * Builds a DOM canvas element with the requested piece icon drawn into it.
 * Use this for HTML overlay UIs (IndexModal, RecipeBar, etc.).
 */
export function createPieceIconCanvas(pieceId: string, sizePx = 48): HTMLCanvasElement {
  return createIconCanvas((ctx, size) => drawPieceIcon(pieceId, ctx, size / 2, size / 2, size), sizePx);
}

export function createBrainrotIconCanvas(brainrotId: string, sizePx = 64): HTMLCanvasElement {
  return createIconCanvas(
    (ctx, size) => drawBrainrotIcon(brainrotId, ctx, size / 2, size / 2, size),
    sizePx,
  );
}

function createIconCanvas(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  sizePx: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(sizePx * dpr);
  canvas.height = Math.round(sizePx * dpr);
  canvas.style.width = `${sizePx}px`;
  canvas.style.height = `${sizePx}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, sizePx);
  }
  return canvas;
}
