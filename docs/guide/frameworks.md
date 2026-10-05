# React, Vue, Svelte

The library is framework free: start it once, mark elements with attributes. These snippets show
where "once" lives in each framework.

::: code-group

```tsx [React]
import { useEffect } from 'react'
import { startGameGlass } from 'mri-fivem-liquid-glass'

export function App() {
  useEffect(() => {
    const glass = startGameGlass({ fallbackImage: import.meta.env.DEV ? '/dev-bg.jpg' : null })
    return () => glass.stop()
  }, [])

  return <div className="panel" data-glass="liquid">Hello</div>
}
```

```vue [Vue]
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { startGameGlass, type GameGlassHandle } from 'mri-fivem-liquid-glass'

let glass: GameGlassHandle | null = null
onMounted(() => { glass = startGameGlass() })
onBeforeUnmount(() => glass?.stop())
</script>

<template>
  <div class="panel" data-glass="liquid">Hello</div>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { onMount } from 'svelte'
  import { startGameGlass } from 'mri-fivem-liquid-glass'

  onMount(() => {
    const glass = startGameGlass()
    return () => glass.stop()
  })
</script>

<div class="panel" data-glass="liquid">Hello</div>
```

```html [Plain HTML]
<script src="https://cdn.jsdelivr.net/npm/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js"></script>
<script>
  MriLiquidGlass.startGameGlass()
</script>
<div class="panel" data-glass="liquid">Hello</div>
```

:::

## TypeScript and `data-*` in JSX

`data-glass` and friends are plain attributes, so no typing is needed. The option types ship
with the package: `GameGlassOptions`, `GameGlassHandle`.

## MRI ui-kit

Projects on [`@mriqbox/ui-kit`](https://github.com/mri-Qbox-Brasil/mri-ui-kit) 4.34+ already get
this library through the kit: `startGameGlass` is re-exported, and `startSuiteGlass` turns the
suite's "liquid" theme into glass on every surface.
