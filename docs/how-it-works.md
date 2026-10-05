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
3. **Temporal mix.** Each new blur is mixed with the previous one (`temporal`, default 0.55)
   to hide the remaining flicker.
4. **Composition.** One quad per element, in full screen resolution, so rounded edges stay
   crisp. A signed distance function of the rounded box gives the antialiased edge; ancestor
   opacity and the nearest `overflow` ancestor (scissor) are applied.

## 3. Broken frames

Reading pixels straight from the GPU stalls until the game frame is done. Instead, a 32x18
thumbnail goes into a pixel buffer and is read one or two frames later, when its fence signals.
The blur only advances when that thumbnail is approved:

- **All black**: keep the last good blur. Black for about 3 seconds: recreate the hook texture
  (at most every 5 seconds).
- **Sudden darkening** (dark pixel ratio 4 points above its average, or mean brightness below
  65% of its average): skip up to 45 frames. Loading screens and transitions do this.
- **Fence never signals** for 300 frames: rebuild every GL resource.

The same thumbnail feeds `data-glass-backdrop`, with hysteresis so text does not flicker
between colors.

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

## 5. Cost

Everything heavy runs at a quarter (blur) or half (sharp) of the screen size. Composition only
shades pixels inside glass elements. With no glass element left in the DOM the loop stops; with
hidden elements it only measures rectangles.
