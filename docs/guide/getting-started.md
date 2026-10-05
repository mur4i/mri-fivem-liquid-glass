# Quick start

## 1. Install

::: code-group

```bash [npm]
npm i mri-fivem-liquid-glass
```

```bash [pnpm]
pnpm add mri-fivem-liquid-glass
```

```html [No bundler]
<!-- Exposes window.MriLiquidGlass. Pin the version in production. -->
<script src="https://cdn.jsdelivr.net/npm/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js"></script>
```

:::

Offline or pinned: copy `node_modules/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js`
next to your `index.html` and list it in the `files` of your `fxmanifest.lua`.

## 2. Start it once

```ts
import { startGameGlass } from 'mri-fivem-liquid-glass'

startGameGlass()
```

With the script tag: `MriLiquidGlass.startGameGlass()`.

It returns `{ refresh, stop }`. Call it once when the NUI boots, not every time a screen opens.

## 3. Mark your surfaces

```html
<div class="panel" data-glass>Frosted panel</div>
<button class="pill" data-glass="liquid">Liquid button</button>
```

## 4. Three CSS rules

```css
/* The page must stay transparent so the game shows through. */
html, body, #root { background: transparent; }

/* The library draws on a canvas at z-index 0; your UI goes above it. */
#root { position: relative; z-index: 1; }

[data-glass] {
  background: rgba(255, 255, 255, 0.06); /* tint over the blur: keep it low */
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 16px 36px rgba(0, 0, 0, 0.3);
}

/* Flip the text over bright scenes. */
[data-glass-backdrop='bright'] { color: #111; }
```

::: danger Do not use backdrop-filter
Remove every `backdrop-filter` from glass elements. In CEF it composites against the page, not
the game, and paints a solid layer over the real glass.
:::

## 5. Develop outside the game

In a normal browser there is no game frame, so the library stays off. Pass a screenshot to see
the real look while you design:

```ts
startGameGlass({ fallbackImage: import.meta.env.DEV ? '/dev-bg.jpg' : null })
```

`fallbackImage` takes a URL, an `<img>` or a `<canvas>`.

## Next

- Tune the look in the [Playground](/playground) and copy the code.
- Read the [FiveM resource](./fivem) patterns (focus, camera drag, closing screens).
