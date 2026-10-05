---
title: Showcase
---

<script setup>
import { withBase } from 'vitepress'
import { data as entries } from './.vitepress/theme/data/showcase.data'
</script>

# Showcase

Servers and resources using liquid glass. Add yours with one JSON file in
[`registry/showcase`](https://github.com/mur4i/mri-fivem-liquid-glass/tree/main/registry/showcase):
it merges by itself when valid ([how](/guide/contributing#registry-pull-requests)).

<div class="show-grid">
  <a v-for="e in entries" :key="e.id" class="show" :href="e.url" target="_blank" rel="noopener">
    <img v-if="e.image" :src="withBase(`/showcase/${e.image}`)" :alt="e.name" loading="lazy">
    <div class="body">
      <h3>{{ e.name }}</h3>
      <p>{{ e.description }}</p>
      <small>@{{ e.author }}<span v-for="t in e.tags" :key="t" class="tag">{{ t }}</span></small>
    </div>
  </a>
</div>

<style>
.show-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; margin-top: 24px; }
.show { display: block; border: 1px solid var(--vp-c-divider); border-radius: 16px; overflow: hidden; background: var(--vp-c-bg-soft); text-decoration: none !important; color: inherit !important; transition: transform 0.15s; }
.show:hover { transform: translateY(-2px); }
.show img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.show .body { padding: 14px 16px; }
.show h3 { margin: 0 0 6px; }
.show p { margin: 0 0 8px; font-size: 14px; color: var(--vp-c-text-2); }
.tag { margin-left: 8px; padding: 1px 8px; border-radius: 999px; background: var(--vp-c-brand-soft); font-size: 12px; }
</style>
