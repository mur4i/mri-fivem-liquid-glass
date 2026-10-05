<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { withBase } from 'vitepress'
import { startGameGlass, type GameGlassHandle } from '../../../../src/index'
import { createHero, type Hero } from './hero'
import { copy, type Lang } from './copy'

const props = defineProps<{ lang?: Lang }>()
const c = copy[props.lang ?? 'en']
const base = props.lang === 'pt' ? '/pt' : ''

const canvas = ref<HTMLCanvasElement>()
const heroEl = ref<HTMLElement>()
const lensEl = ref<HTMLElement>()
const lens = reactive({ x: 0.79, y: 0.56, tx: 0.79, ty: 0.56 })
const modes = ['liquid', 'gem', 'kaleidoscope'] as const
const mode = ref(0)
const split = ref(50)
const promptCopied = ref(false)

async function copyPrompt() {
  await navigator.clipboard.writeText(c.prompt)
  promptCopied.value = true
  setTimeout(() => { promptCopied.value = false }, 1600)
}
let hero: Hero | null = null
let glass: GameGlassHandle | null = null
let raf = 0
let visible = true
let observer: IntersectionObserver | null = null

function lensAttrs() {
  const m = modes[mode.value]
  return {
    'data-glass': 'liquid',
    'data-glass-bezel': m === 'liquid' ? '120' : '40',
    'data-glass-refraction': m === 'liquid' ? '72' : '34',
    'data-glass-dispersion': '0.85',
    'data-glass-specular': '0.65',
    ...(m === 'gem' ? { 'data-glass-shape': 'diamond', 'data-glass-lens': 'gem' } : {}),
    ...(m === 'kaleidoscope' ? { 'data-glass-lens': 'kaleidoscope', 'data-glass-facets': '8' } : {}),
  }
}

function cycleLens() {
  mode.value = (mode.value + 1) % modes.length
  // The corner radius animates; read the final shape once the transition is over.
  requestAnimationFrame(() => glass?.refresh())
  setTimeout(() => glass?.refresh(), 560)
}

// The lens trails the pointer with a soft spring, only while the hero is on screen.
function tick() {
  raf = requestAnimationFrame(tick)
  if (!visible) return
  lens.x += (lens.tx - lens.x) * 0.08
  lens.y += (lens.ty - lens.y) * 0.08
}

function onPointer(e: PointerEvent) {
  const box = heroEl.value?.getBoundingClientRect()
  if (!box || e.clientY > box.bottom) return
  const nx = e.clientX / innerWidth
  const ny = (e.clientY - box.top) / box.height
  hero?.setPointer(nx * 2 - 1, ny * 2 - 1)
  if (innerWidth > 900) {
    lens.tx = 0.62 + nx * 0.26
    lens.ty = 0.36 + ny * 0.36
  }
}

// The site runs in a normal browser, so the header uses CSS backdrop-filter; it turns solid past the hero.
function onScroll() {
  const pastHero = scrollY > (heroEl.value?.offsetHeight ?? innerHeight) - 80
  document.documentElement.classList.toggle('mri-landing-scrolled', pastHero)
}

function dragSplit(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const box = el.parentElement!.getBoundingClientRect()
  el.setPointerCapture(e.pointerId)
  const move = (ev: PointerEvent) => { split.value = Math.min(96, Math.max(4, ((ev.clientX - box.left) / box.width) * 100)) }
  move(e)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true })
}

function keySplit(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') split.value = Math.max(4, split.value - 5)
  if (e.key === 'ArrowRight') split.value = Math.min(96, split.value + 5)
}

onMounted(() => {
  document.documentElement.classList.add('mri-landing')
  if (!document.getElementById('archivo-font')) {
    const link = document.createElement('link')
    link.id = 'archivo-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&display=swap'
    document.head.append(link)
  }
  // rAF callbacks run in registration order: move the lens before the glass reads its rect, so they never drift apart.
  tick()
  hero = createHero(canvas.value!, withBase('/scene.webp'))
  glass = startGameGlass({ fallbackImage: canvas.value!, zIndex: 1, blur: 8, saturation: 1.15 })
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    hero?.setActive(visible)
  })
  observer.observe(heroEl.value!)
  addEventListener('pointermove', onPointer, { passive: true })
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('mri-landing', 'mri-landing-scrolled')
  cancelAnimationFrame(raf)
  observer?.disconnect()
  removeEventListener('pointermove', onPointer)
  removeEventListener('scroll', onScroll)
  glass?.stop()
  hero?.dispose()
})
</script>

<template>
  <div class="landing">
    <canvas ref="canvas" class="backdrop" aria-hidden="true" />

    <section ref="heroEl" class="hero">
      <div class="hero-copy">
        <h1>{{ c.title }}</h1>
        <p class="lead">{{ c.lead }}</p>
        <div class="actions">
          <a class="btn primary" :href="withBase(`${base}/guide/getting-started`)">{{ c.start }}</a>
          <a class="btn ghost" href="https://www.youtube.com/watch?v=W2z3DP6N95c" target="_blank" rel="noopener">{{ c.watch }}</a>
        </div>
      </div>
      <button
        ref="lensEl"
        :class="['lens', `lens-${modes[mode]}`]"
        v-bind="lensAttrs()"
        :style="{ left: `${lens.x * 100}%`, top: `${lens.y * 100}%` }"
        :aria-label="c.lens"
        @click="cycleLens"
      />
      <p class="lens-note">{{ c.lens }}</p>
    </section>

    <div class="page">
      <section class="band">
        <h2>{{ c.inGameTitle }}</h2>
        <div class="stills">
          <figure class="still big">
            <img :src="withBase('/stills/sun-gem.webp')" :alt="c.stills[0][0]" loading="lazy">
            <figcaption><strong>{{ c.stills[0][0] }}.</strong> {{ c.stills[0][1] }}</figcaption>
          </figure>
          <figure class="still">
            <img :src="withBase('/stills/gem-city.webp')" :alt="c.stills[1][0]" loading="lazy">
            <figcaption><strong>{{ c.stills[1][0] }}.</strong> {{ c.stills[1][1] }}</figcaption>
          </figure>
          <figure class="still">
            <img :src="withBase('/stills/kaleido-trees.webp')" :alt="c.stills[2][0]" loading="lazy">
            <figcaption><strong>{{ c.stills[2][0] }}.</strong> {{ c.stills[2][1] }}</figcaption>
          </figure>
        </div>
      </section>

      <section class="band why">
        <div class="why-text">
          <h2>{{ c.whyTitle.split('backdrop-filter')[0] }}<span class="nowrap">backdrop-filter</span>{{ c.whyTitle.split('backdrop-filter')[1] }}</h2>
          <p v-for="(t, i) in c.whyText" :key="i">{{ t }}</p>
        </div>
        <div class="compare">
          <img :src="withBase('/compare/after.webp')" :alt="c.after" loading="lazy">
          <img class="before" :src="withBase('/compare/before.webp')" :alt="c.before" loading="lazy" :style="{ clipPath: `inset(0 ${100 - split}% 0 0)` }">
          <span class="tag left">{{ c.before }}</span>
          <span class="tag right">{{ c.after }}</span>
          <button
            class="handle"
            role="slider"
            :aria-valuenow="Math.round(split)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${c.before} / ${c.after}`"
            :style="{ left: `${split}%` }"
            @pointerdown="dragSplit"
            @keydown="keySplit"
          />
        </div>
      </section>

      <section class="band use">
        <h2>{{ c.useTitle }}</h2>
        <pre class="code"><code><span class="k">import</span> { startGameGlass } <span class="k">from</span> <span class="s">'mri-fivem-liquid-glass'</span>
startGameGlass()
&lt;div <span class="a">data-glass</span>=<span class="s">"liquid"</span>&gt;...&lt;/div&gt;</code></pre>
        <div class="prompt">
          <p class="prompt-label">{{ c.promptLabel }}</p>
          <div class="prompt-row">
            <code>{{ c.prompt }}</code>
            <button class="btn primary small" @click="copyPrompt">{{ promptCopied ? c.copied : c.copy }}</button>
          </div>
        </div>
        <p class="note">{{ c.useNote }} <code>npx mri-fivem-liquid-glass setup-ai</code> <a :href="withBase(`${base}/guide/ai`)">{{ c.aiLink }}</a></p>
      </section>

      <section class="band proof">
        <p>{{ c.proof }} <a :href="withBase(`${base}/guide/performance`)">{{ c.proofLink }}</a></p>
      </section>

      <section class="band end">
        <h2>{{ c.endTitle }}</h2>
        <p>{{ c.endText }}</p>
        <div class="actions">
          <a class="btn primary" :href="withBase(`${base}/guide/`)">{{ c.docs }}</a>
          <a class="btn ghost" :href="withBase('/playground')">{{ c.playground }}</a>
          <a class="btn ghost" href="https://github.com/mur4i/mri-fivem-liquid-glass">GitHub</a>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
html.mri-landing body { background: #0f1424; }
html.mri-landing .VPNavBar,
html.mri-landing .VPNavBar .content-body,
html.mri-landing .VPNavBar .divider { background: transparent !important; transition: background 0.3s; }
html.mri-landing.mri-landing-scrolled .VPNavBar,
html.mri-landing.mri-landing-scrolled .VPNavBar .content-body { background: rgba(15, 20, 36, 0.72) !important; backdrop-filter: blur(18px) saturate(160%); -webkit-backdrop-filter: blur(18px) saturate(160%); }
html.mri-landing .VPNavBar .divider { display: none; }
/* Floating glass header over the hero. */
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar { --vp-c-text-1: #f3efea; --vp-c-text-2: rgba(243, 239, 234, 0.88); --vp-c-text-3: rgba(243, 239, 234, 0.78); --vp-c-divider: rgba(255, 255, 255, 0.22); }
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .wrapper {
  margin: 10px 16px 0;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px) saturate(190%) brightness(1.08);
  -webkit-backdrop-filter: blur(10px) saturate(190%) brightness(1.08);
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 18px 40px rgba(15, 20, 36, 0.35);
}
html.mri-landing .VPNavBar .content-body,
html.mri-landing .VPNavBar .title { background: transparent !important; border: 0 !important; }
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .DocSearch-Button { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .DocSearch-Button .DocSearch-Button-Key { background: rgba(255, 255, 255, 0.12); color: #f3efea; border-color: rgba(255, 255, 255, 0.3); }
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .DocSearch-Button .DocSearch-Button-Keys,
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .DocSearch-Button .DocSearch-Button-Keys *,
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .DocSearch-Button .DocSearch-Button-Placeholder,
html.mri-landing:not(.mri-landing-scrolled) .VPNavBar .DocSearch-Button .DocSearch-Search-Icon { color: rgba(243, 239, 234, 0.88); }
html.mri-landing .VPNavBar .title,
html.mri-landing .VPNavBarMenuLink,
html.mri-landing .VPNavBar .VPSocialLink { color: #f3efea; }
</style>

<style scoped>
.landing {
  --dusk: #0f1424;
  --peach: #f2a07b;
  --lilac: #a99ad6;
  --paper: #f3efea;
  --soft: rgba(243, 239, 234, 0.7);
  --mri: #00e699;
  font-family: 'Archivo', var(--vp-font-family-base);
  color: var(--paper);
}
/* Layers: backdrop (0) < glass canvas (1, on <body>) < content (2). */
.backdrop { position: fixed; inset: 0; z-index: 0; width: 100vw; height: 100vh; display: block; }
.hero { position: relative; z-index: 2; height: calc(100vh - var(--vp-nav-height)); min-height: 560px; }
.hero::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 60% 70% at 12% 92%, rgba(15, 20, 36, 0.82), rgba(15, 20, 36, 0) 70%); }
.hero-copy { position: absolute; left: max(32px, 5vw); bottom: 9vh; max-width: 640px; }
h1 { margin: 0; font-size: clamp(46px, 7.2vw, 116px); line-height: 0.92; letter-spacing: -0.02em; font-weight: 850; font-stretch: 125%; text-shadow: 0 6px 40px rgba(15, 20, 36, 0.55); }
.lead { margin: 22px 0 28px; max-width: 34em; font-size: 18px; line-height: 1.55; color: rgba(243, 239, 234, 0.9); text-shadow: 0 2px 16px rgba(15, 20, 36, 0.7); }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.btn { display: inline-flex; align-items: center; padding: 13px 24px; border-radius: 999px; font-weight: 650; font-size: 15px; text-decoration: none !important; transition: background 0.2s, color 0.2s; }
.btn.primary { background: var(--mri); color: #08251b !important; }
.btn.primary:hover { background: #3df0b3; }
.btn.ghost { color: var(--paper) !important; border: 1px solid rgba(243, 239, 234, 0.4); }
.btn.ghost:hover { background: rgba(243, 239, 234, 0.12); }
.btn:focus-visible, .handle:focus-visible, .lens:focus-visible { outline: 3px solid var(--mri); outline-offset: 3px; }

.lens { position: absolute; width: min(34vw, 360px); aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; cursor: pointer; background: none; border: 0; padding: 0; transition: border-radius 0.5s cubic-bezier(.2, .9, .3, 1.2); }
.lens-gem { border: 0; border-radius: 4%; box-shadow: none; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
.lens-note { position: absolute; right: max(32px, 5vw); bottom: 9vh; z-index: 2; max-width: 280px; margin: 0; font-size: 13px; line-height: 1.5; color: var(--soft); text-align: right; text-shadow: 0 2px 12px rgba(15, 20, 36, 0.8); }

.page { position: relative; z-index: 2; background: var(--dusk); }
.band { max-width: 1160px; margin: 0 auto; padding: 120px max(32px, 5vw) 0; }
h2 { margin: 0 0 32px; padding: 0; border: 0; font-size: clamp(30px, 3.8vw, 52px); line-height: 1.02; letter-spacing: -0.015em; font-weight: 800; font-stretch: 118%; color: var(--paper); }

.stills { display: grid; grid-template-columns: 1.55fr 1fr; grid-template-rows: auto auto; gap: 18px; }
.still { margin: 0; }
.still.big { grid-row: span 2; }
.still img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 14px; }
.still.big img { aspect-ratio: auto; height: calc(100% - 56px); min-height: 320px; }
figcaption { margin-top: 10px; font-size: 14px; line-height: 1.5; color: var(--soft); }
figcaption strong { color: var(--paper); font-weight: 650; }

.why { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 56px; align-items: center; }
.nowrap { white-space: nowrap; }
.why h2 { font-size: clamp(28px, 3vw, 42px); }
.why-text p { margin: 0 0 16px; font-size: 17px; line-height: 1.65; color: var(--soft); max-width: 34em; }
.compare { position: relative; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; user-select: none; }
.compare img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.tag { position: absolute; top: 14px; padding: 6px 12px; border-radius: 999px; background: rgba(15, 20, 36, 0.72); font-size: 13px; font-weight: 600; pointer-events: none; }
.tag.left { left: 14px; }
.tag.right { right: 14px; }
.handle { position: absolute; top: 0; bottom: 0; width: 44px; margin-left: -22px; cursor: ew-resize; touch-action: none; }
.handle::before { content: ''; position: absolute; left: 21px; top: 0; bottom: 0; width: 2px; background: var(--paper); }
.handle::after { content: ''; position: absolute; left: 6px; top: 50%; width: 32px; height: 32px; margin-top: -16px; border-radius: 50%; background: var(--paper); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4); }

.code { margin: 0 0 18px; padding: 22px 26px; border-radius: 14px; background: #0a0e1a; border: 1px solid rgba(169, 154, 214, 0.18); font: 15px/1.8 var(--vp-font-family-mono); color: #e7e3f2; overflow-x: auto; }
.code .k { color: var(--peach); }
.code .s { color: #a5d6ff; }
.code .a { color: var(--lilac); }
.prompt { margin: 0 0 22px; padding: 18px 20px; border-radius: 14px; background: linear-gradient(180deg, rgba(169, 154, 214, 0.14), rgba(169, 154, 214, 0.05)); border: 1px solid rgba(169, 154, 214, 0.3); }
.prompt-label { margin: 0 0 10px; font-size: 14px; color: var(--soft); }
.prompt-row { display: flex; gap: 14px; align-items: center; }
.prompt-row code { flex: 1; font: 15px/1.55 var(--vp-font-family-mono); color: var(--paper); background: none; padding: 0; }
.btn.small { padding: 9px 16px; font-size: 14px; white-space: nowrap; }
@media (max-width: 640px) { .prompt-row { flex-direction: column; align-items: flex-start; } }
.note { margin: 0; font-size: 16px; line-height: 1.7; color: var(--soft); }
.note code { padding: 3px 8px; border-radius: 6px; background: #0a0e1a; color: var(--paper); }
.note a, .proof a { color: var(--peach); }

.proof p { margin: 0; max-width: 24em; font-size: clamp(24px, 2.8vw, 38px); line-height: 1.25; font-weight: 700; font-stretch: 112%; color: var(--paper); }
.proof a { font-size: 16px; font-weight: 600; font-stretch: 100%; white-space: nowrap; }
.end { padding-bottom: 140px; }
.end p { max-width: 36em; margin: -12px 0 28px; font-size: 17px; line-height: 1.65; color: var(--soft); }

@media (max-width: 900px) {
  .lens { left: 50% !important; top: 34% !important; width: 58vw; }
  .lens-note { display: none; }
  .hero-copy { right: 24px; left: 24px; bottom: 6vh; }
  .stills, .why { grid-template-columns: 1fr; }
  .still.big { grid-row: auto; }
  .still.big img { height: auto; aspect-ratio: 16 / 10; min-height: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .lens { transition: none; }
}
</style>
