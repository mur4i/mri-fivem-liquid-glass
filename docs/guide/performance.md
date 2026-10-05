# Performance

## Measured in game

With the full [showcase resource](https://github.com/mur4i/mri-fivem-liquid-glass/tree/main/examples/showcase-resource)
open (21 glass elements, including a large kaleidoscope), on an RTX 4060 Laptop and i7-13650HX at
1080p:

- **`resmon`: 0.00 ms and 0.00%** for the resource: nothing runs in Lua, the work happens on the
  GPU inside the NUI.
- **No measurable FPS drop**: with the screen closed the scene swings between 89 and 98 fps;
  with everything open it stays around 90.

![resmon at 0.00 ms with the showcase open](/perf-resmon.webp)

Got numbers on other hardware? Share them in an
[issue](https://github.com/mur4i/mri-fivem-liquid-glass/issues): they help everyone.

## Why it is cheap

- The blur runs on a copy of the game at a quarter of the screen size; the sharp copy for
  refraction is at half size.
- The final drawing only shades the pixels inside your glass elements.
- Reading back pixels (to detect black frames and to choose the text tone) uses a 32x18
  thumbnail read asynchronously, so the GPU never waits.
- No glass element in the DOM: the loop stops. Hidden elements: nothing is drawn.

## Tips

- Prefer a few large glass surfaces over many tiny ones.
- Keep glass off always-on HUD pieces; it shines on screens the player opens.
- Lower `scale` (for example `0.2`) on weak GPUs; raise `blur` to compensate the softer look.
- Remove closed screens from the DOM instead of hiding them.
