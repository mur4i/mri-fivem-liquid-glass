<script setup>
import { ATTRIBUTES } from '../../src/reference'
</script>

# Markup

Everything is driven by `data-*` attributes on your elements. Changes are picked up by
themselves: add, remove or edit an attribute and the glass follows on the next frame.

## Attributes

<table>
  <thead><tr><th>Attribute</th><th>Values</th><th>Set by</th><th>Effect</th></tr></thead>
  <tbody>
    <tr v-for="a in ATTRIBUTES" :key="a.name">
      <td><code>{{ a.name }}</code></td>
      <td>{{ a.values }}</td>
      <td>{{ a.setBy }}</td>
      <td>{{ a.description }}</td>
    </tr>
  </tbody>
</table>

Any fine tuning attribute (or a lens) also turns the rim on for a plain `data-glass` element.

## Frosted or liquid?

Use **frosted** (`data-glass`) for large panels with content: lists, forms, chat. A bevel there
competes with the text. Use **liquid** (`data-glass="liquid"`) for small, highlighted pieces:
buttons, pills, orbs, docks, HUD widgets.

```html
<section class="inventory" data-glass>...</section>
<button class="action" data-glass="liquid" data-glass-bezel="14" data-glass-refraction="20">Use</button>
```

## Shape follows your CSS

The glass reads the element's box every frame:

- `border-radius` (from `border-top-left-radius`) rounds the glass, including `50%` circles and
  `999px` pills;
- the opacity of the element **and all its parents** fades the glass, so CSS fade animations work;
- the nearest parent with `overflow` other than `visible` clips it;
- `transform: scale()` and `translate()` work; rotations are clipped to the bounding box.

If you change the radius through inline `style`, call `refresh()` on the handle. Class and
`data-glass*` changes are detected automatically.

## Text color

`data-glass-backdrop` is written by the library from the brightness behind each element, with
hysteresis so it does not flicker:

```css
[data-glass-backdrop='bright'] { color: #111; }
[data-glass-backdrop='dark'] { color: #fff; }
```
