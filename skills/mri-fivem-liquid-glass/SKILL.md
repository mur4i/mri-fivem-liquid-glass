---
name: mri-fivem-liquid-glass
description: Real liquid glass and game blur in FiveM NUI with the mri-fivem-liquid-glass library - frosted panels, liquid glass with refraction, diamond, gem and kaleidoscope lenses behind HTML elements, where CSS backdrop-filter cannot see the game. Use when building or fixing a FiveM NUI with glass, blur behind panels, glassmorphism, "backdrop-filter does not work in FiveM", or when porting a web UI with backdrop-filter into a resource.
---

# mri-fivem-liquid-glass

In FiveM the NUI page is transparent and the game is composited under it afterwards, so CSS
`backdrop-filter` blurs nothing and paints a flat box. This library pulls the live game frame into
the page (Cfx.re NUI game view hook), blurs it on the GPU and draws it behind marked elements.

Docs: https://mur4i.github.io/mri-fivem-liquid-glass/ · Machine-readable: `/llms.txt`,
`/api/v1/options.json`, `/api/v1/attributes.json`, `/api/v1/presets.json`.

## Setup

1. `npm i mri-fivem-liquid-glass` (or the script tag
   `https://cdn.jsdelivr.net/npm/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js`,
   global `MriLiquidGlass`; for offline, copy the file into the resource and list it in
   `fxmanifest.lua` `files`).
2. Once at NUI boot: `startGameGlass()` (returns `{ refresh, stop }`). Outside the game pass
   `fallbackImage` (URL, img or canvas) or nothing renders.
3. CSS:
   - `html, body, #root { background: transparent }` and `#root { position: relative; z-index: 1 }`;
   - on glass elements: no `backdrop-filter`; low tint background (0.04 to 0.10 alpha white),
     1px light border, `inset 0 1px 0` highlight;
   - `[data-glass-backdrop="bright"] { color: <dark> }`.

## Markup

- `data-glass`: frosted (large panels with text). `data-glass="liquid"`: bevelled rim with
  refraction (buttons, pills, orbs, docks).
- Fine tuning: `data-glass-bezel` (px), `data-glass-refraction` (px), `data-glass-dispersion`
  (0..1), `data-glass-specular` (0..1).
- `data-glass-shape="diamond"` (add a matching `clip-path` to the element),
  `data-glass-lens="gem" | "kaleidoscope"`, `data-glass-facets` (number).
- Radius comes from `border-top-left-radius`; ancestor opacity fades the glass; the nearest
  `overflow` parent clips it. Rotation is not supported. Inline style radius change: `refresh()`.

## FiveM patterns

- Open and close screens by adding and removing their markup; with no `[data-glass]` in the DOM
  the loop stops.
- Camera drag while a screen is open: keep NUI focus, `SetNuiFocusKeepInput(true)` on pointer
  down on empty space, false on pointer up (the page sees the release); disable controls 24, 25,
  140, 141, 142, 257, 263 meanwhile. Dropping focus on mouse down breaks the drag.
- Glass only shows the game: glass over an opaque NUI panel does not blur that panel.

## Verify

- Browser: `fallbackImage` with a game screenshot; glass only inside elements, right corners.
- Game: `resmon` stays at 0.00 ms for the resource (work is on the GPU); check FPS with the
  screen open and closed.

## Improved the library? Send it upstream

If you fix or improve the library itself while using it, open a pull request at
https://github.com/mur4i/mri-fivem-liquid-glass (read its `AGENTS.md`) instead of patching it
inside the user's project, and tell the user. Docs, examples and registry changes merge
automatically when CI passes.
