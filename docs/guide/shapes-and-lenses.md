# Shapes and lenses

## Diamond

```html
<div class="gem" data-glass="liquid" data-glass-shape="diamond"></div>
```

```css
.gem {
  width: 160px;
  height: 160px;
  border: 0;
  box-shadow: none;
  /* your own tint and border follow the diamond too */
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}
```

The element stays a box for layout; the glass is drawn as a diamond inside it. `border-radius`
rounds the tips.

## Gem

A flat table in the middle magnifies the scene; around it the crown is split into facets, each
bending the backdrop its own way, with cut lines and strong color split.

```html
<div data-glass="liquid" data-glass-shape="diamond" data-glass-lens="gem" data-glass-facets="8"></div>
```

Works on any shape, but the diamond outline sells it. Raise `data-glass-dispersion` for more
rainbow, `data-glass-refraction` for a harder cut.

## Kaleidoscope

The backdrop behind the element mirrored into slices around the center. Moving the element (or
the camera) changes the pattern.

```html
<div data-glass="liquid" data-glass-lens="kaleidoscope" data-glass-facets="8"></div>
```

## Morphing

Width, height and `border-radius` can animate with CSS transitions. During the transition the
glass needs to re-read the shape each frame:

```ts
function followMorph(el: HTMLElement, glass: { refresh(): void }) {
  let running = true
  const tick = () => { if (running) { glass.refresh(); requestAnimationFrame(tick) } }
  el.addEventListener('transitionend', () => { running = false; glass.refresh() }, { once: true })
  requestAnimationFrame(tick)
}
```

Try every combination in the [Playground](/playground).
