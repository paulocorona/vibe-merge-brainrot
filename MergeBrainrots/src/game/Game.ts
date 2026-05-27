import { InputController, DragInfo } from "../input/InputController";
import {
  Animator,
  makeConsumedAnim,
  makeMergeResultAnim,
  makeShakeAnim,
  makeSpawnAnim,
  makeVacuumAnim,
} from "../render/Animations";
import { cellCenter, GridLayout } from "../render/Layout";
import { ParticleSystem } from "../render/ParticleSystem";
import { drawPiece } from "../render/PieceRenderer";
import {
  DragRenderState,
  PieceAnimState,
  RenderContext,
  Renderer,
} from "../render/Renderer";
import { pickRandom, pickWeighted, type WeightedItem } from "../util/rng";
import { Board, PlacedPiece } from "./Board";
import { ComboTracker } from "./ComboTracker";
import { BrainrotRecipe } from "./data/brainrots";
import { PieceDef } from "./data/pieces";
import { chainRarity, DEFAULT_PIECE_RARITY, RARITY_STYLES } from "./data/rarities";
import { INITIAL_SPAWN_POOL, type SpawnPoolEntry } from "./data/spawnPool";
import { GameState, PersistedState } from "./GameState";
import { MergeOutcome, resolveMerge } from "./MergeResolver";
import { Spawner } from "./Spawner";

export const UPGRADE_BASE_COST = 25;
export const UPGRADE_COST_GROWTH = 1.8;
export const UPGRADE_MAX_LEVEL = 9;

export interface GameEvents {
  onSpawn?: (event: { placed: PlacedPiece; screen: { x: number; y: number } }) => void;
  onMerge?: (event: {
    result: PlacedPiece;
    reward: number;
    combo: number;
    screen: { x: number; y: number };
  }) => void;
  onInvalidDrop?: (event: { row: number; col: number }) => void;
  onBrainrotUnlocked?: (event: {
    recipe: BrainrotRecipe;
    row: number;
    col: number;
    rect: DOMRect;
  }) => void;
  onBoardCleared?: () => void;
  onStateChanged?: (state: GameState) => void;
}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly board: Board;
  private readonly input: InputController;
  private readonly spawner: Spawner;
  private readonly combo: ComboTracker;
  private readonly particles: ParticleSystem;
  private readonly animator: Animator;
  readonly state: GameState;
  events: GameEvents = {};

  private running = false;
  private rafHandle = 0;
  private lastFrameMs = 0;
  private resizeObserver: ResizeObserver | null = null;
  private currentDrag: DragInfo | null = null;
  private hiddenIds: Set<number> = new Set();
  private passiveCarrySec = 0;
  private ghosts: GhostPiece[] = [];

  constructor(canvas: HTMLCanvasElement, initialState: Partial<PersistedState> = {}) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.board = new Board();
    this.spawner = new Spawner();
    this.combo = new ComboTracker();
    this.particles = new ParticleSystem();
    this.animator = new Animator();
    this.state = new GameState(initialState);
    this.input = new InputController(canvas, {
      getBoard: () => this.board,
      getLayout: () => this.renderer.getLayout(),
      onDragStart: (info) => this.handleDragStart(info),
      onDragMove: (info) => this.handleDragMove(info),
      onDrop: (info, target) => this.handleDrop(info, target),
      onTap: () => {},
    });
    this.observeResize();
    this.applySpawnUpgrade();
    this.seedInitialPieces();
  }

  /**
   * Pre-fills the board with a handful of starter pieces so the player
   * doesn't open the game to an empty 8x8 grid. Skipped when the board
   * is already populated (e.g. saved-state hydration in the future).
   */
  private seedInitialPieces(): void {
    if (!this.board.isEmpty()) return;
    // Roughly 25% fill of the board, capped at a friendly opener count.
    const seedCount = Math.min(14, Math.floor((this.board.size * this.board.size) * 0.22));
    const weighted: WeightedItem<SpawnPoolEntry>[] = INITIAL_SPAWN_POOL.map((entry) => ({
      value: entry,
      weight: entry.baseWeight,
    }));
    for (let i = 0; i < seedCount; i++) {
      const empties = this.board.getEmptyCells();
      if (empties.length === 0) break;
      const cell = pickRandom(empties);
      const pick = pickWeighted(weighted);
      this.board.place(pick.piece, cell.row, cell.col);
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameMs = performance.now();
    const loop = (now: number): void => {
      const dt = Math.min(0.1, (now - this.lastFrameMs) / 1000);
      this.lastFrameMs = now;
      this.update(dt, now);
      this.draw(now);
      if (this.running) {
        this.rafHandle = requestAnimationFrame(loop);
      }
    };
    this.rafHandle = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    this.input.destroy();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  getBoard(): Board {
    return this.board;
  }

  getSpawnProgress(): number {
    return this.spawner.getProgress();
  }

  spawnTap(): void {
    this.spawner.tap();
    this.trySpawnNow();
  }

  /**
   * Used by the spawn button upgrade. Lower values = tap fills faster, so
   * fewer taps are required per spawn.
   */
  applySpawnUpgrade(): void {
    const level = this.state.spawnUpgradeLevel;
    const baseTaps = 10;
    const taps = Math.max(1, baseTaps - level);
    this.spawner.setTapChunk(1 / taps);
  }

  getUpgradeCost(): number {
    return Math.round(UPGRADE_BASE_COST * Math.pow(UPGRADE_COST_GROWTH, this.state.spawnUpgradeLevel));
  }

  canPurchaseUpgrade(): boolean {
    if (this.state.spawnUpgradeLevel >= UPGRADE_MAX_LEVEL) return false;
    return this.state.currency >= this.getUpgradeCost();
  }

  /**
   * Returns true if the purchase happened. Caller is responsible for
   * playing the upgrade sound.
   */
  purchaseUpgrade(): boolean {
    if (!this.canPurchaseUpgrade()) return false;
    const cost = this.getUpgradeCost();
    if (!this.state.trySpendCurrency(cost)) return false;
    this.state.incrementSpawnUpgrade();
    this.applySpawnUpgrade();
    return true;
  }

  getCellScreenPosition(row: number, col: number): { x: number; y: number } {
    const layout = this.renderer.getLayout();
    const c = cellCenter(layout, row, col);
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + c.x, y: rect.top + c.y };
  }

  getTileSize(): number {
    return this.renderer.getLayout().tileSize;
  }

  clearBoard(): void {
    const layout = this.renderer.getLayout();
    const bottomY = layout.cssHeight + layout.tileSize * 0.5;
    const vacuumX = layout.originX + layout.tileSize * layout.boardSize * 0.5 + layout.gap * (layout.boardSize - 1) * 0.5;
    const pieces = this.board.getAllPieces();
    const now = performance.now();
    let delay = 0;
    for (const placed of pieces) {
      const from = cellCenter(layout, placed.row, placed.col);
      this.animator.add(
        makeVacuumAnim(
          placed.instanceId,
          now,
          from,
          { x: vacuumX, y: bottomY },
          delay,
        ),
      );
      delay += 30;
    }
    setTimeout(() => {
      this.board.clear();
      this.animator.clear();
      this.events.onBoardCleared?.();
    }, delay + 420);
  }

  private observeResize(): void {
    this.renderer.resize();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.renderer.resize());
      this.resizeObserver.observe(this.canvas);
    }
    window.addEventListener("resize", () => this.renderer.resize());
  }

  private update(dt: number, nowMs: number): void {
    this.animator.setNow(nowMs);
    this.animator.tick();
    this.particles.update(dt);
    this.combo.tick(nowMs);
    this.spawner.update(dt);
    this.trySpawnNow();
    this.tickPassiveIncome(dt);
  }

  private tickPassiveIncome(dt: number): void {
    const rate = this.state.passiveIncomePerSec();
    if (rate <= 0) return;
    this.passiveCarrySec += dt;
    const whole = Math.floor(this.passiveCarrySec * rate);
    if (whole > 0) {
      this.state.addCurrency(whole);
      this.passiveCarrySec -= whole / rate;
    }
  }

  private trySpawnNow(): SpawnSummary | null {
    if (!this.spawner.isReady()) return null;
    const event = this.spawner.trySpawn(this.board);
    if (!event) return null;
    this.animator.add(makeSpawnAnim(event.placed.instanceId, performance.now()));
    const screen = this.getCellScreenPosition(event.placed.row, event.placed.col);
    this.events.onSpawn?.({ placed: event.placed, screen });
    return { placed: event.placed };
  }

  private handleDragStart(info: DragInfo): void {
    this.currentDrag = info;
  }

  private handleDragMove(info: DragInfo): void {
    this.currentDrag = info;
  }

  private handleDrop(info: DragInfo, target: { row: number; col: number } | null): void {
    this.currentDrag = null;
    if (!target) return;
    const fromR = info.piece.row;
    const fromC = info.piece.col;
    if (target.row === fromR && target.col === fromC) return;
    if (!this.board.inBounds(target.row, target.col)) return;

    const dropOn = this.board.getPieceAt(target.row, target.col);
    if (!dropOn) {
      this.board.move(fromR, fromC, target.row, target.col);
      return;
    }

    const outcome = resolveMerge(this.board, fromR, fromC, target.row, target.col);
    this.handleOutcome(outcome, target, info.piece);
  }

  private handleOutcome(
    outcome: MergeOutcome,
    target: { row: number; col: number },
    dragged: PlacedPiece,
  ): void {
    if (outcome.kind === "none") {
      // Try swap; if even that fails (e.g. same cell), nudge with a shake.
      const swapped = this.board.swap(dragged.row, dragged.col, target.row, target.col);
      if (!swapped) {
        this.animator.add(makeShakeAnim(dragged.instanceId, performance.now()));
        this.events.onInvalidDrop?.(target);
      }
      return;
    }

    const layout = this.renderer.getLayout();
    const now = performance.now();

    if (outcome.kind === "merge") {
      this.flashMerge(outcome.newPiece, outcome.from, outcome.into, outcome.result, layout, now);
      return;
    }

    if (outcome.kind === "brainrot") {
      this.flashBrainrot(outcome.recipe, outcome.consumed[0], outcome.consumed[1], target, layout, now);
      return;
    }
  }

  private flashMerge(
    newPiece: PlacedPiece,
    from: PlacedPiece,
    into: PlacedPiece,
    result: PieceDef,
    layout: GridLayout,
    nowMs: number,
  ): void {
    const center = cellCenter(layout, newPiece.row, newPiece.col);
    const rarity = chainRarity(result.chain) ?? DEFAULT_PIECE_RARITY;
    const accent = RARITY_STYLES[rarity].accent;
    this.particles.burst(center.x, center.y, accent, {
      count: 14 + result.level * 2,
      speed: 180 + result.level * 30,
      size: 5 + result.level * 0.5,
    });
    this.particles.sparkle(center.x, center.y);
    this.animator.add(makeMergeResultAnim(newPiece.instanceId, nowMs));

    // The source/target pieces are already removed from the board, but we
    // play a quick "consumed" animation tracked by instance id over the
    // briefly-hidden snapshot. Since the board no longer references them,
    // we render them ourselves through the extraDraws hook in flashGhost.
    this.flashGhost(from, into, center, nowMs);

    const combo = this.combo.registerMerge(nowMs);
    const multiplier = combo <= 1 ? 1 : 1 + (combo - 1) * 0.25;
    const reward = Math.round(result.mergeReward * multiplier);
    this.state.addCurrency(reward);
    const screen = this.getCellScreenPosition(newPiece.row, newPiece.col);
    this.events.onMerge?.({ result: newPiece, reward, combo, screen });
  }

  private flashBrainrot(
    recipe: BrainrotRecipe,
    a: PlacedPiece,
    b: PlacedPiece,
    target: { row: number; col: number },
    layout: GridLayout,
    nowMs: number,
  ): void {
    const center = cellCenter(layout, target.row, target.col);
    this.particles.burst(center.x, center.y, recipe.color, {
      count: 60,
      speed: 360,
      size: 9,
      life: 0.9,
    });
    this.particles.sparkle(center.x, center.y, "#ffffff");
    this.flashGhost(a, b, center, nowMs);
    const rect = this.canvas.getBoundingClientRect();
    this.events.onBrainrotUnlocked?.({
      recipe,
      row: target.row,
      col: target.col,
      rect,
    });
  }

  /**
   * Plays the consumed-piece fade for two pieces that have already been
   * removed from the board. We render them via extraDraws by snapshotting
   * their last known piece def + position.
   */
  private flashGhost(a: PlacedPiece, b: PlacedPiece, toCenter: { x: number; y: number }, nowMs: number): void {
    const ghosts: GhostPiece[] = [
      { id: -a.instanceId - 1000, piece: a.piece, row: a.row, col: a.col },
      { id: -b.instanceId - 1000, piece: b.piece, row: b.row, col: b.col },
    ];
    for (const g of ghosts) this.ghosts.push(g);

    const layout = this.renderer.getLayout();
    for (const g of ghosts) {
      const from = cellCenter(layout, g.row, g.col);
      this.animator.add({
        ...makeConsumedAnim(g.id, nowMs, toCenter, from),
        onComplete: () => {
          this.ghosts = this.ghosts.filter((x) => x.id !== g.id);
        },
      });
    }
  }

  private draw(nowMs: number): void {
    this.animator.setNow(nowMs);

    const drag: DragRenderState | null = this.currentDrag
      ? {
          piece: this.currentDrag.piece,
          x: this.currentDrag.pointerX - this.currentDrag.grabOffsetX,
          y: this.currentDrag.pointerY - this.currentDrag.grabOffsetY,
          snapRow: this.input.getSnapTarget()?.row ?? null,
          snapCol: this.input.getSnapTarget()?.col ?? null,
        }
      : null;

    const renderContext: RenderContext = {
      board: this.board,
      drag,
      hiddenInstanceIds: this.hiddenIds,
      extraDraws: [
        (ctx, layout) => this.drawGhosts(ctx, layout),
        (ctx) => this.particles.draw(ctx),
      ],
      pieceAnim: (instanceId) => {
        const state: PieceAnimState = {
          scale: 1,
          alpha: 1,
          rotation: 0,
          highlight: 0,
          offsetX: 0,
          offsetY: 0,
        };
        this.animator.apply(instanceId, state);
        return state;
      },
    };
    this.renderer.render(renderContext);
  }

  private drawGhosts(ctx: CanvasRenderingContext2D, layout: GridLayout): void {
    if (this.ghosts.length === 0) return;
    for (const g of this.ghosts) {
      const state: PieceAnimState = {
        scale: 1,
        alpha: 1,
        rotation: 0,
        highlight: 0,
        offsetX: 0,
        offsetY: 0,
      };
      this.animator.apply(g.id, state);
      const center = cellCenter(layout, g.row, g.col);
      drawGhost(ctx, g.piece, center.x, center.y, layout.tileSize, state);
    }
  }
}

interface SpawnSummary {
  readonly placed: PlacedPiece;
}

interface GhostPiece {
  readonly id: number;
  readonly piece: PieceDef;
  readonly row: number;
  readonly col: number;
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  piece: PieceDef,
  cx: number,
  cy: number,
  size: number,
  state: PieceAnimState,
): void {
  drawPiece(ctx, {
    piece,
    cx: cx + state.offsetX,
    cy: cy + state.offsetY,
    size,
    scale: state.scale,
    alpha: state.alpha,
    rotation: state.rotation,
    highlight: state.highlight,
    lifted: false,
  });
}
