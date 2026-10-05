# How it works

## 1. Getting the game into the page

The FiveM browser (CEF, Chromium 103) draws the NUI page on top of the game. The page itself is
transparent and never contains the game pixels, which is why `backdrop-filter` blurs nothing.

The Cfx.re NUI layer has a hook for this. When a page creates a WebGL texture with a 1x1 pixel
and then sets `TEXTURE_WRAP_T` in this exact order:

```js
gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)
gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
```

the GPU process binds the game back buffer to that texture. From then on, sampling it returns
the current game frame (without the NUI, so there is no feedback loop). The FiveM main menu and
[screenshot-basic](https://github.com/citizenfx/screenshot-basic) use the same mechanism.

Until the hook binds, the texture is still the placeholder pixel or comes out black. The game
can also recreate its back buffer, which drops the binding.

## 2. Pipeline per frame

```
game frame ──► half size (sharp) ──► quarter size ──► gaussian passes ──► temporal mix ──► blur
                     │                     │
                     │                     └──► 32x18 thumbnail ──► async readback (PBO + fence)
                     └───────────────────────────────────────────────► liquid rim refraction
```

1. **Downscale with 4 bilinear taps per texel.** Copying straight to a quarter size skips
   pixels and shimmers when the camera moves.
2. **Short gaussian taps.** A 9 tap kernel folded into 5 linear fetches, with each tap at most
   about 1.5 texels apart. The pass count comes from the requested sigma
   (`ceil((sigma / 2.4)^2)`, at most 8). Wide taps turn thin details (poles, fences) into
   patterns.
3. **Temporal mix.** Each new blur is mixed with the previous one to hide the remaining
   flicker. `temporal` (default 0.45) is the weight at 60 fps, a time constant of about 28 ms;
   the real weight is `1 - (1 - temporal)^(dt / 16.7 ms)`, so the smoothing feels the same at
   30 or 144 fps.
4. **Composition.** One quad per element, in full screen resolution, so rounded edges stay
   crisp. A signed distance function of the rounded box gives the antialiased edge; ancestor
   opacity and the nearest `overflow` ancestor (scissor) are applied.

## 3. Broken frames

Reading pixels straight from the GPU stalls until the game frame is done. Instead, a 32x18
thumbnail goes into a pixel buffer and is read one or two frames later, when its fence signals.
The blur only advances when that thumbnail is approved. Every limit is in milliseconds, so it
behaves the same at any frame rate:

- **All black**: keep the last good blur. Black for 2.5 s means the hook dropped: recreate the
  hook texture (at most every 4 s).
- **Sudden darkening**: the share of dark pixels jumps 8 points above its running average, or
  the brightness falls below 55% of it (scenes already darker than about 10% are left alone).
  Loading fades and menus do this; up to 800 ms of it is hidden behind the last good frame.
  The averages follow the scene with a 250 ms half life.
- **Fence never signals** for 4 s: rebuild every GL resource.

The same thumbnail feeds `data-glass-backdrop`. Gamma luma around 0.46 (linear about 0.18) is
where black and white text have the same contrast, so the text turns dark above 0.52 and light
again below 0.40; the gap keeps it from flickering.

## 4. Liquid rim

The sharp half size frame is double buffered and only swapped in after approval, so a black
frame never shows up in the rim.

Inside the rim, with `rim` going from 1 at the edge to 0 where the bezel ends:

- **Refraction**: sample the sharp frame at `normal * rim^2.2 * refraction` outwards, so the
  edge shows the backdrop from just outside the element, bent like a convex lens.
- **Mix**: `smoothstep(0.15, 0.85, rim)` blends sharp and blurred, so the rim is clear and the
  middle stays frosted for text.
- **Dispersion**: red and blue sample with the offset 30% larger and smaller than green.
- **Highlight**: `rim^7` times the light direction; the opposite side gets 35%.

The `liquid` preset: bezel 22% of the shortest side (8 to 28 px), refraction 0.8 of the bezel,
dispersion 0.5, highlight 0.45.

## 5. Shapes and lenses

- `data-glass-shape="diamond"` swaps the rounded box distance function for a rounded rhombus.
  Everything else (rim, refraction, highlight) follows the new outline.
- `data-glass-lens="gem"`: a flat table in the middle (42% of the size) magnifies the sharp
  frame; around it the crown is split into `facets` flat faces. Each face bends the backdrop
  along its own direction and gets its own brightness from the light, with bright cut lines
  between faces and stronger color split.
- `data-glass-lens="kaleidoscope"`: the angle around the center is folded into one mirrored
  wedge (`facets` slices), which reads the sharp backdrop behind the element. Moving the
  element changes the pattern.

## 6. Cost

Everything heavy runs at a quarter (blur) or half (sharp) of the screen size. Composition only
shades pixels inside glass elements. With no glass element left in the DOM the loop stops; with
hidden elements it only measures rectangles.
