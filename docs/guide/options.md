<script setup>
import { OPTIONS } from '../../src/reference'
const show = (v) => (v === null ? 'null' : JSON.stringify(v))
</script>

# Options

```ts
import { startGameGlass, GLASS_DEFAULTS } from 'mri-fivem-liquid-glass'

const glass = startGameGlass({ blur: 18, saturation: 1.2 })
// glass.refresh() re-reads radius, clipping and attributes after inline style changes
// glass.stop() removes the canvas and stops everything
```

This table is generated from the library source, so it is always current.

<table>
  <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr v-for="o in OPTIONS" :key="o.name">
      <td><code>{{ o.name }}</code></td>
      <td><code>{{ o.type }}</code></td>
      <td><code>{{ show(o.default) }}</code></td>
      <td>{{ o.description }}</td>
    </tr>
  </tbody>
</table>

The same data is available as JSON at [`/api/v1/options.json`](/api).

## Changing options at runtime

Options are read when the glass starts. To change `blur` or `saturation` live, stop and start
again; it is cheap:

```ts
let glass = startGameGlass({ blur: 14 })

function setBlur(value: number) {
  glass.stop()
  glass = startGameGlass({ blur: value })
}
```

Per element looks (bezel, refraction, dispersion, lenses) are attributes, so they change live
without a restart. See [Markup](./markup).
