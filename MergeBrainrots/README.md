# Brainrot Merge

A tactile collectible dopamine machine built around absurd meme discovery.

**Play it online:** <https://paulocorona.github.io/vibe-merge-brainrot/>

This is the **v0 prototype** of the game described in [DevelopmentPlan.md](DevelopmentPlan.md).
It implements the GDD §24 Prototype scope: a 4x4 grid, tap-to-spawn, drag-to-merge,
and a single Brainrot — **Bombardino Cocodrilo** — discoverable end-to-end.

## Stack

- Plain TypeScript (no game framework)
- HTML5 Canvas for the merge grid + animations + particles
- HTML/CSS overlay for the UI chrome
- Vite for dev server + build
- `localStorage` for save data

No runtime dependencies. The game runs in any modern mobile or desktop browser.

## Run it

```bash
cd MergeBrainrots
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

The viewport is portrait phone-shaped. On desktop it is centered as a phone frame;
on mobile it fills the screen.

## Scripts

| Script              | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR |
| `npm run build`     | Type-check and build to `dist/`    |
| `npm run preview`   | Preview the built bundle           |
| `npm run typecheck` | Type-check without emitting        |

## Project layout

```
MergeBrainrots/
  DevelopmentPlan.md            full GDD
  index.html                    canvas + UI shell
  src/
    main.ts                     entry point
    style.css                   layout + theme
    game/                       game logic (board, spawner, merge rules, data)
    render/                     canvas renderer + animations + particles
    input/                      pointer/drag handling
    ui/                         HTML/CSS chrome (top bar, bottom bar, modal)
    audio/                      WebAudio sfx stubs
    persist/                    localStorage save/load
    util/                       rng, easing
```

## What's in v0

- 4x4 grid, drag to merge
- One Brainrot — Bombardino Cocodrilo — with two **5-level** chains
  - Creature: Egg → Cracked Egg → Baby Croc → Young Croc → Adult Croc
  - Machine: Gear → Screw & Nut → Spark Plug → Motor → Airplane
- Cartoon visual reskin: bright sky/water background, rarity-tinted tiles
  on wooden pedestals, big bold cartoon buttons
- PNG art for piece chains and the Bombardino Cocodrilo portrait, with
  procedural fallbacks for anything missing (`src/render/icons/PieceIcons.ts`)
- Top bar: lone coin pill (live currency + passive income readout)
- Tap-to-spawn with a progress meter and a hidden lagging-chain bias
- Combo system with juicy merge feedback (pop, particles, sparkles)
- INDEX modal with one Brainrot card (rarity badge + tagline)
- Brainrot unlock popup with light-ray reveal
- Spawn-button upgrade still wired up under the hood — it will surface in
  a future Shop screen
- Currency + passive income per unlocked Brainrot
- localStorage persistence (currency, INDEX, upgrades) with stale-state
  healing for renamed brainrots

## Swapping in real art

All piece visuals are drawn procedurally in
`src/render/icons/PieceIcons.ts`. To replace a placeholder with real art,
either rewrite the corresponding draw function or load an image and
`ctx.drawImage(img, cx - size/2, cy - size/2, size, size)` in its place.
Everything downstream (board, animations, UI chrome) goes through the
same registry so changes propagate everywhere.

The bottom-bar buttons, tile sprite, phone-frame background, and the
machine-chain piece images are loaded by URL from `public/assets/`. The
deploy workflow runs `scripts/generate-placeholders.mjs` before each
build, which writes 1x1 transparent PNGs at the expected paths if real
art isn't present yet — drop final PNGs into the matching paths under
`public/assets/` to override the placeholders (the script skips files
that already exist).

## Deploying

A push to `main` or `master` triggers
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which
builds `MergeBrainrots` and publishes to GitHub Pages. The first
successful run goes live at the URL above.

## What's deferred (vertical slice / V1)

- Other 4 Brainrots
- Full INDEX with silhouettes + rarity colors
- Rarity system (Common / Rare / Legendary)
- Grid expansion past 4x4
- Offline-progress summary popup
- Direct item purchases
- Real art assets, real audio
- Port to Meta Horizon Worlds (phase 2)
