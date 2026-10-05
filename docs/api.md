# JSON API

Static JSON served by GitHub Pages, regenerated on every release and every registry change. No
key, no rate limit beyond GitHub's, CORS open.

Base URL: `https://mur4i.github.io/mri-fivem-liquid-glass/api/v1/`

| Endpoint | Content |
| --- | --- |
| [`index.json`](/api/v1/index.json) | List of endpoints |
| [`version.json`](/api/v1/version.json) | Latest version, npm and CDN links |
| [`options.json`](/api/v1/options.json) | Every option of `startGameGlass` with type, default and meaning |
| [`attributes.json`](/api/v1/attributes.json) | Every `data-glass*` attribute |
| [`presets.json`](/api/v1/presets.json) | Community presets |
| [`showcase.json`](/api/v1/showcase.json) | Projects using the library |

## Examples

Always load the latest build in a resource that cannot use npm:

```js
const { cdn } = await (await fetch('https://mur4i.github.io/mri-fivem-liquid-glass/api/v1/version.json')).json()
const script = document.createElement('script')
script.src = cdn.iife
document.head.append(script)
```

Apply a community preset to an element:

```js
const presets = await (await fetch('https://mur4i.github.io/mri-fivem-liquid-glass/api/v1/presets.json')).json()
const preset = presets.find((p) => p.id === 'crystal')
for (const [name, value] of Object.entries(preset.attributes)) el.setAttribute(name, value)
```

## For tools

The same data ships inside the package:

```ts
import { OPTIONS, ATTRIBUTES } from 'mri-fivem-liquid-glass/reference'
import { GLASS_DEFAULTS } from 'mri-fivem-liquid-glass'
```

For language models there is [`/llms.txt`](/llms.txt) and [`/llms-full.txt`](/llms-full.txt).
