# Brainrot Merge

A tactile collectible dopamine machine built around absurd meme discovery.

This is the **v0 prototype** of the game described in [DevelopmentPlan.md](DevelopmentPlan.md).
It implements the GDD §24 Prototype scope: a 4x4 grid, tap-to-spawn, drag-to-merge,
and a single Brainrot — **Bombardiero Cocodrilo** — discoverable end-to-end.

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
    ui/                         HTML/CSS chrome (top bar, recipe, bottom bar, modal)
    audio/                      WebAudio sfx stubs
    persist/                    localStorage save/load
    util/                       rng, easing
```

## What's in v0

- 4x4 grid, drag to merge
- One Brainrot — Bombardiero Cocodrilo — with two **5-level** chains
  - Creature: Egg → Cracked Egg → Hatching Egg → Baby Crocodile → Adult Crocodile
  - Machine: Gear → Screw & Nut → Turbine → Motor → Airplane
- Cartoon visual reskin: bright sky/water background, green tiles on
  wooden pedestals, big bold cartoon buttons
- Procedural placeholder icons (replaceable via `src/render/icons/PieceIcons.ts`)
- Top button row: **Daily Rewards** (left) and **Shop** (right), both
  visual-only placeholders for now (they log on tap)
- Tap-to-spawn with a progress meter and a hidden lagging-chain bias
- Combo system with juicy merge feedback (pop, particles, sparkles)
- INDEX modal with one card and recipe preview
- Brainrot unlock popup with light-ray reveal
- Spawn-button upgrade still wired up under the hood — it will surface in
  the Shop screen when that is built
- Currency + passive income per unlocked Brainrot
- localStorage persistence (currency, INDEX, upgrades)

## Swapping in real art

All piece visuals are drawn procedurally in
`src/render/icons/PieceIcons.ts`. To replace a placeholder with real art,
either rewrite the corresponding draw function or load an image and
`ctx.drawImage(img, cx - size/2, cy - size/2, size, size)` in its place.
Everything downstream (board, animations, UI chrome) goes through the
same registry so changes propagate everywhere.

## What's deferred (vertical slice / V1)

- Other 4 Brainrots
- Full INDEX with silhouettes + rarity colors
- Rarity system (Common / Rare / Legendary)
- Grid expansion past 4x4
- Offline-progress summary popup
- Direct item purchases
- Real art assets, real audio
- Port to Meta Horizon Worlds (phase 2)
