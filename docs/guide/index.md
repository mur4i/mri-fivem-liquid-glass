# Introduction

FiveM draws your NUI page on top of the game with the Chromium Embedded Framework (CEF). The page
is transparent, and the game is composited underneath it afterwards. That is why CSS
`backdrop-filter: blur()` gives you a flat, solid box: from the page's point of view there is
nothing behind your panel to blur.

**mri-fivem-liquid-glass** gets the live game frame into the page through the Cfx.re NUI game
view hook, blurs it on the GPU and draws it behind every element you mark, in the exact shape of
the element. On top of that it can bend the sharp image on a bevelled rim (liquid glass), cut it
into facets (gem) or mirror it into slices (kaleidoscope).

![In game: liquid glass, a faceted diamond and a kaleidoscope](/hero.webp)

## What you get

- **Frosted glass** behind any element, following `border-radius`, ancestor opacity and
  `overflow` clipping.
- **Liquid glass**: bevelled rim, refraction, color split, specular highlight.
- **Shapes and lenses**: diamond outline, faceted gem, kaleidoscope.
- **Readable text**: `data-glass-backdrop="bright|dark"` on every element.
- **Game proof**: survives loading screens, black frames and lost hooks; never stalls the GPU to
  read pixels.
- **No dependencies**, about 18 KB minified, works with any framework or plain HTML.

## Where to go next

- [Quick start](./getting-started) to have glass on screen in a few minutes.
- [Playground](/playground) to tune the look and copy the code.
- [FiveM resource](./fivem) for focus, camera and lifecycle patterns.
- [How it works](./how-it-works) if you want the details.
