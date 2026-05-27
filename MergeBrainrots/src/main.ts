import { AudioManager } from "./audio/AudioManager";
import { Game } from "./game/Game";
import { attachAutoSave, loadState } from "./persist/Save";
import { preloadPieceImages } from "./render/icons/PieceImages";
import { preloadTileSprite } from "./render/TileSprite";
import { BottomBar } from "./ui/BottomBar";
import { ClearConfirm } from "./ui/ClearConfirm";
import { IndexModal } from "./ui/IndexModal";
import { RecipeBar } from "./ui/RecipeBar";
import { TooltipController } from "./ui/Tooltip";
import { TopBar } from "./ui/TopBar";
import { UnlockPopup } from "./ui/UnlockPopup";

async function bootstrap(): Promise<void> {
  // Set the phone-frame background image URL via a CSS variable so it
  // respects whatever subpath the app is served from. CSS `url()` can't
  // see `import.meta.env.BASE_URL`, so we plumb it through here.
  document.documentElement.style.setProperty(
    "--bg-url",
    `url("${import.meta.env.BASE_URL}assets/ui/background.png")`,
  );

  // Preload art assets before constructing the UI so static icon
  // canvases (RecipeBar, IndexModal, UnlockPopup) blit the real PNGs
  // on first paint rather than the procedural fallback. The board
  // canvas redraws every frame, so even a fire-and-forget preload
  // would work for it — awaiting just unifies the boot path.
  await Promise.all([
    preloadTileSprite().catch((err) => {
      console.error("[tile-sprite] preload failed", err);
    }),
    preloadPieceImages().catch((err) => {
      console.error("[piece-images] preload failed", err);
    }),
  ]);

  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element #game-canvas not found");
  }
  const topBarHost = mustGet("top-bar");
  const recipeBarHost = mustGet("recipe-bar");
  const bottomBarHost = mustGet("bottom-bar");
  const modalRoot = mustGet("modal-root");
  const popupRoot = mustGet("popup-root");
  const tooltipRoot = mustGet("tooltip-root");
  const phoneFrame = mustGet("phone-frame");

  const savedState = loadState();
  const game = new Game(canvas, savedState);
  const audio = new AudioManager();

  const openShop = (): void => {
    audio.resumeOnGesture();
    audio.play("ui-tap");
    console.info("[shop] Tapped — coming soon.");
  };
  const openDailyRewards = (): void => {
    audio.resumeOnGesture();
    audio.play("ui-tap");
    console.info("[daily-rewards] Tapped — coming soon.");
  };

  const topBar = new TopBar(topBarHost, game.state, { onCoinAdd: openShop });
  const recipeBar = new RecipeBar(recipeBarHost, game.state, () => game.getBoard(), {
    onDailyRewards: openDailyRewards,
    onShop: openShop,
  });
  const indexModal = new IndexModal(modalRoot, game.state);
  const tooltips = new TooltipController(tooltipRoot);
  const clearConfirm = new ClearConfirm(popupRoot);
  const unlockPopup = new UnlockPopup(popupRoot, {
    onContinue: () => {},
    getIndexButtonRect: () => bottomBar.getIndexButtonRect(),
  });

  const bottomBar = new BottomBar(bottomBarHost, game.state, {
    onSpawnTap: () => {
      audio.resumeOnGesture();
      tooltips.hide();
      game.state.markSpawnTooltipSeen();
      audio.play("spawn-tick");
      game.spawnTap();
    },
    onClearTap: () => {
      audio.resumeOnGesture();
      clearConfirm.show({
        onConfirm: () => {
          audio.play("board-clear");
          game.clearBoard();
        },
        onCancel: () => {},
      });
    },
    onIndexTap: () => {
      audio.resumeOnGesture();
      audio.play("ui-tap");
      indexModal.open();
    },
    onUpgradeTap: () => {
      audio.resumeOnGesture();
      if (game.purchaseUpgrade()) {
        audio.play("upgrade");
      } else {
        audio.play("drop-fail");
      }
    },
    getSpawnProgress: () => game.getSpawnProgress(),
    getUpgradeCost: () => game.getUpgradeCost(),
    canUpgrade: () => game.canPurchaseUpgrade(),
  });

  game.events = {
    onSpawn: ({ placed }) => {
      audio.play("spawn-drop");
      maybeShowDragTooltip(placed);
    },
    onMerge: ({ reward, combo, screen }) => {
      audio.play(combo > 1 ? "merge-combo" : "merge-pop");
      if (combo > 1 || reward >= 20) {
        spawnComboFlash(combo, reward, screen, phoneFrame);
      }
    },
    onInvalidDrop: () => {
      audio.play("drop-fail");
    },
    onBrainrotUnlocked: ({ recipe }) => {
      audio.play("brainrot-unlock");
      unlockPopup.show(recipe);
      game.state.unlockBrainrot(recipe.id);
    },
    onBoardCleared: () => {},
  };

  const unsubSave = attachAutoSave(game.state);
  void unsubSave;

  function maybeShowDragTooltip(placed: { row: number; col: number }): void {
    if (game.state.hasSeenDragTooltip()) return;
    const piece = game.getBoard().getPieceAt(placed.row, placed.col);
    if (!piece) return;
    const screen = game.getCellScreenPosition(placed.row, placed.col);
    const tile = game.getTileSize();
    const fakeRect = new DOMRect(screen.x - tile / 2, screen.y - tile / 2, tile, tile);
    tooltips.show({
      target: fakeRect,
      text: "Drag onto a matching tile to merge!",
      direction: "above",
      autoHideMs: 4500,
    });
    game.state.markDragTooltipSeen();
  }

  if (!game.state.hasSeenSpawnTooltip()) {
    setTimeout(() => {
      tooltips.show({
        target: bottomBar.getSpawnButtonRect(),
        text: "Tap to spawn pieces!",
        direction: "above",
        autoHideMs: 6000,
      });
    }, 600);
  }

  game.start();

  if (import.meta.env.DEV) {
    const w = window as unknown as {
      __game?: Game;
      __audio?: AudioManager;
      __topBar?: TopBar;
      __recipeBar?: RecipeBar;
      __bottomBar?: BottomBar;
    };
    w.__game = game;
    w.__audio = audio;
    w.__topBar = topBar;
    w.__recipeBar = recipeBar;
    w.__bottomBar = bottomBar;
  }
}

function mustGet(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

function spawnComboFlash(
  combo: number,
  reward: number,
  screen: { x: number; y: number },
  phoneFrame: HTMLElement,
): void {
  const rect = phoneFrame.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "combo-flash";
  el.textContent = combo > 1 ? `x${combo}!  +${reward}` : `+${reward}`;
  el.style.left = `${screen.x - rect.left}px`;
  el.style.top = `${screen.y - rect.top - 20}px`;
  phoneFrame.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
  });
} else {
  void bootstrap();
}
