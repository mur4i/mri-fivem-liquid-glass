---
title: Presets
---

<script setup>
import { withBase } from 'vitepress'
import { data as presets } from './.vitepress/theme/data/presets.data'
const attrs = (p) => Object.entries(p.attributes).map(([k, v]) => v === '' ? k : `${k}="${v}"`).join(' ')
const opts = (p) => p.options ? `startGameGlass(${JSON.stringify(p.options)})` : ''
</script>

# Presets

Ready looks from the community. Pick one in the [Playground](/playground), or copy the
attributes. Want to add yours? One JSON file in
[`registry/presets`](https://github.com/mur4i/mri-fivem-liquid-glass/tree/main/registry/presets),
it merges by itself when valid ([how](/guide/contributing#registry-pull-requests)).

<div class="preset-grid">
  <div v-for="p in presets" :key="p.id" class="preset">
    <h3>{{ p.name }}</h3>
    <p>{{ p.description }}</p>
    <pre><code>&lt;div {{ attrs(p) }}&gt;&lt;/div&gt;</code></pre>
    <pre v-if="opts(p)"><code>{{ opts(p) }}</code></pre>
    <small>by <a :href="`https://github.com/${p.author}`">@{{ p.author }}</a> · <a :href="withBase(`/playground?preset=${p.id}`)">try it</a></small>
  </div>
</div>

<style>
.preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 24px; }
.preset { padding: 16px 18px; border: 1px solid var(--vp-c-divider); border-radius: 14px; background: var(--vp-c-bg-soft); }
.preset h3 { margin: 0 0 6px; }
.preset p { margin: 0 0 10px; color: var(--vp-c-text-2); font-size: 14px; }
.preset pre { margin: 0 0 8px; padding: 8px 10px; border-radius: 8px; background: var(--vp-c-bg-alt); font-size: 12px; white-space: pre-wrap; word-break: break-all; }
</style>
