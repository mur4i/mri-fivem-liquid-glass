<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { startGameGlass, type GameGlassHandle } from '../../../../src/index'
import { data as presetList } from '../data/presets.data'

type Shape = 'circle' | 'pill' | 'square' | 'diamond'
type Lens = 'liquid' | 'gem' | 'kaleidoscope'

const s = reactive({
  blur: 14,
  saturation: 115,
  bezel: 22,
  refraction: 18,
  dispersion: 50,
  specular: 45,
  facets: 8,
  tint: 6,
})
const shape = ref<Shape>('circle')
const lens = ref<Lens>('liquid')
const panelsLiquid = ref(false)
const showCode = ref(false)
const copied = ref(false)
const presetId = ref('')

const scene = ref<HTMLCanvasElement>()
const stage = ref<HTMLElement>()
const orb = ref<HTMLElement>()
const orbPos = reactive({ x: 0.52, y: 0.45 })
let image: HTMLImageElement | null = null
let glass: GameGlassHandle | null = null

const sliders: [keyof typeof s, string, number, number][] = [
  ['blur', 'Blur', 2, 30], ['saturation', 'Saturation', 50, 200], ['bezel', 'Bezel', 4, 50],
  ['refraction', 'Refraction', 0, 50], ['dispersion', 'Dispersion', 0, 100], ['specular', 'Specular', 0, 100],
  ['facets', 'Facets', 3, 16], ['tint', 'Tint', 0, 30],
]

// The backdrop canvas stands in for the game frame: the glass reads it as if it were the screen.
function paint() {
  const c = scene.value
  if (!c || !image) return
  c.width = innerWidth
  c.height = innerHeight
  const k = Math.max(innerWidth / image.width, innerHeight / image.height)
  c.getContext('2d')!.drawImage(image, (innerWidth - image.width * k) / 2, (innerHeight - image.height * k) / 2,
    image.width * k, image.height * k)
}

function restart() {
  if (!image || !scene.value) return
  glass?.stop()
  glass = startGameGlass({ fallbackImage: scene.value, blur: s.blur, saturation: s.saturation / 100, temporal: 1, zIndex: 2 })
}

function applyLens() {
  const root = stage.value
  if (!root) return
  root.style.setProperty('--pg-tint', String(s.tint / 100))
  for (const el of root.querySelectorAll<HTMLElement>('[data-glass="liquid"]')) {
    const small = Math.min(el.offsetWidth, el.offsetHeight)
    el.dataset.glassBezel = String(Math.min(s.bezel, small / 2))
    el.dataset.glassRefraction = String(s.refraction)
    el.dataset.glassDispersion = String(s.dispersion / 100)
    el.dataset.glassSpecular = String(s.specular / 100)
    if (el.dataset.glassLens) el.dataset.glassFacets = String(s.facets)
  }
  glass?.refresh()
}

function show(img: HTMLImageElement) {
  image = img
  paint()
  restart()
  requestAnimationFrame(applyLens)
}

function onResize() {
  paint()
  restart()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const img = new Image()
  img.onload = () => show(img)
  img.src = URL.createObjectURL(file)
}

function dragOrb(e: PointerEvent) {
  const el = orb.value
  if (!el) return
  el.setPointerCapture(e.pointerId)
  const box = el.getBoundingClientRect()
  const dx = e.clientX - (box.left + box.width / 2)
  const dy = e.clientY - (box.top + box.height / 2)
  const move = (ev: PointerEvent) => {
    orbPos.x = (ev.clientX - dx) / innerWidth
    orbPos.y = (ev.clientY - dy) / innerHeight
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true })
}

// Shape changes animate width, height and radius; re-read the shape every frame until it settles.
function followMorph() {
  const el = orb.value
  if (!el) return
  let running = true
  const tick = () => {
    if (!running) return
    applyLens()
    requestAnimationFrame(tick)
  }
  el.addEventListener('transitionend', () => { running = false; applyLens() }, { once: true })
  setTimeout(() => { running = false }, 700)
  requestAnimationFrame(tick)
}

function usePreset(id: string) {
  const p = presetList.find((x) => x.id === id)
  if (!p) return
  const o = p.options || {}
  if (o.blur !== undefined) s.blur = o.blur
  if (o.saturation !== undefined) s.saturation = Math.round(o.saturation * 100)
  const a = p.attributes
  const num = (k: string, scale = 1) => (a[k] !== undefined ? Number(a[k]) * scale : undefined)
  s.bezel = num('data-glass-bezel') ?? s.bezel
  s.refraction = num('data-glass-refraction') ?? s.refraction
  s.dispersion = num('data-glass-dispersion', 100) ?? s.dispersion
  s.specular = num('data-glass-specular', 100) ?? s.specular
  s.facets = num('data-glass-facets') ?? s.facets
  shape.value = a['data-glass-shape'] === 'diamond' ? 'diamond' : shape.value === 'diamond' ? 'circle' : shape.value
  lens.value = (a['data-glass-lens'] as Lens) || 'liquid'
  restart()
  requestAnimationFrame(applyLens)
}

const orbAttrs = computed(() => {
  const a: Record<string, string> = { 'data-glass': 'liquid' }
  if (shape.value === 'diamond') a['data-glass-shape'] = 'diamond'
  if (lens.value !== 'liquid') a['data-glass-lens'] = lens.value
  return a
})

const code = computed(() => {
  const attrs = { ...orbAttrs.value }
  attrs['data-glass-bezel'] = String(s.bezel)
  attrs['data-glass-refraction'] = String(s.refraction)
  attrs['data-glass-dispersion'] = String(s.dispersion / 100)
  attrs['data-glass-specular'] = String(s.specular / 100)
  if (lens.value !== 'liquid') attrs['data-glass-facets'] = String(s.facets)
  const html = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join('\n     ')
  return `import { startGameGlass } from 'mri-fivem-liquid-glass'

startGameGlass({ blur: ${s.blur}, saturation: ${(s.saturation / 100).toFixed(2)} })

<div ${html}></div>`
})

async function copy() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

watch(() => [s.blur, s.saturation], restart)
watch(() => [s.bezel, s.refraction, s.dispersion, s.specular, s.facets, s.tint], applyLens)
watch(shape, followMorph, { flush: 'post' })
watch([lens, panelsLiquid], () => requestAnimationFrame(applyLens), { flush: 'post' })
watch(presetId, (id) => id && usePreset(id))

onMounted(() => {
  const img = new Image()
  img.onload = () => {
    show(img)
    const wanted = new URLSearchParams(location.search).get('preset')
    if (wanted) presetId.value = wanted
  }
  img.src = withBase('/scene.webp')
  addEventListener('resize', onResize)
  addEventListener('dragover', (e) => e.preventDefault())
  addEventListener('drop', onDrop)
})

onBeforeUnmount(() => {
  glass?.stop()
  glass = null
  removeEventListener('resize', onResize)
  removeEventListener('drop', onDrop)
})

const panel = computed(() => (panelsLiquid.value ? 'liquid' : ''))
</script>

<template>
  <div class="pg">
    <canvas ref="scene" class="pg-scene" aria-hidden="true" />
    <div ref="stage" class="pg-stage">
      <section class="pg-panel pg-brand" :data-glass="panel">
        <h1>Playground</h1>
        <p class="soft">Everything here is the real library. Drag the orb, morph it, then copy the code.</p>
      </section>

      <nav class="pg-panel pg-menu" :data-glass="panel">
        <div v-for="(t, i) in ['Open trunk', 'Check engine', 'Lock vehicle']" :key="t" class="pg-item" data-glass="liquid">
          <span class="key">{{ 'EFG'[i] }}</span>{{ t }}
        </div>
      </nav>

      <div class="pg-gem" data-glass="liquid" data-glass-shape="diamond" data-glass-lens="gem" />
      <div class="pg-kaleido" data-glass="liquid" data-glass-lens="kaleidoscope">kaleidoscope</div>

      <div
        id="pg-orb"
        ref="orb"
        :class="['pg-orb', `shape-${shape}`]"
        v-bind="orbAttrs"
        :style="{ left: `${orbPos.x * 100}%`, top: `${orbPos.y * 100}%` }"
        @pointerdown="dragOrb"
      >
        <span v-if="lens === 'liquid' && shape !== 'diamond'">Drag me</span>
      </div>

      <div class="pg-panel pg-dock" :data-glass="panel">
        <div v-for="n in 5" :key="n" class="pg-key" data-glass="liquid">{{ n }}</div>
      </div>

      <section class="pg-panel pg-controls" :data-glass="panel">
        <h2>Morph the glass</h2>
        <label v-for="[k, label, min, max] in sliders" :key="k" class="row">
          {{ label }}<input v-model.number="s[k]" type="range" :min="min" :max="max"><output>{{ s[k] }}</output>
        </label>
        <div class="chips">
          <button v-for="x in ['circle', 'pill', 'square', 'diamond']" :key="x" :class="['chip', { on: shape === x }]" data-glass="liquid" @click="shape = x as Shape">{{ x }}</button>
        </div>
        <div class="chips">
          <button v-for="x in ['liquid', 'gem', 'kaleidoscope']" :key="x" :class="['chip', { on: lens === x }]" data-glass="liquid" @click="lens = x as Lens">{{ x === 'kaleidoscope' ? 'kaleido' : x }}</button>
        </div>
        <div class="chips">
          <button :class="['chip', { on: !panelsLiquid }]" data-glass="liquid" @click="panelsLiquid = false">frosted panels</button>
          <button :class="['chip', { on: panelsLiquid }]" data-glass="liquid" @click="panelsLiquid = true">liquid panels</button>
        </div>
        <div class="foot">
          <select v-model="presetId" aria-label="Preset">
            <option value="">Preset…</option>
            <option v-for="p in presetList" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button class="chip on code-btn" data-glass="liquid" @click="showCode = !showCode">{{ showCode ? 'hide code' : 'get code' }}</button>
        </div>
        <p class="soft hint">Drop a GTA screenshot anywhere to test on a real frame.</p>
      </section>

      <section v-if="showCode" class="pg-panel pg-code" data-glass>
        <pre>{{ code }}</pre>
        <button class="chip on" data-glass="liquid" @click="copy">{{ copied ? 'copied' : 'copy' }}</button>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Layers: scene (1) < glass canvas (2, inserted on <body>) < stage (3); .pg itself must not create a stacking context. */
.pg { position: static; }
.pg-scene { position: fixed; inset: 0; z-index: 1; width: 100%; height: 100%; }
.pg-stage { position: fixed; inset: var(--vp-nav-height) 0 0 0; overflow: hidden; z-index: 3; color: #fff; font: 500 14px/1.4 var(--vp-font-family-base); --pg-tint: 0.06; user-select: none; }
.soft { color: rgba(255, 255, 255, 0.75); }
[data-glass] {
  position: absolute;
  background: rgba(255, 255, 255, var(--pg-tint));
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 18px 40px rgba(0, 0, 0, 0.28);
  transition: color 0.25s;
}
[data-glass-backdrop='bright'] { color: #14111c; }
[data-glass-backdrop='bright'] .soft { color: rgba(20, 17, 28, 0.7); }
.pg-brand { left: 28px; top: 24px; width: 380px; padding: 20px 22px; border-radius: 24px; }
.pg-brand h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.pg-brand p { margin: 0; }
.pg-menu { right: 28px; top: 24px; width: 230px; padding: 8px; border-radius: 22px; display: flex; flex-direction: column; gap: 6px; }
.pg-item { position: relative; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 16px; }
.key { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: rgba(255, 255, 255, 0.14); }
.pg-gem { right: 270px; top: 36%; width: 160px; height: 160px; border: 0; border-radius: 6px; box-shadow: none; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
.pg-kaleido { left: 34%; top: 30%; width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 600; }
.pg-orb {
  width: 190px; height: 190px; border-radius: 50%; transform: translate(-50%, -50%); cursor: grab; display: grid; place-items: center; font-weight: 600; touch-action: none;
  transition: width 0.45s cubic-bezier(.2, .9, .3, 1.2), height 0.45s cubic-bezier(.2, .9, .3, 1.2), border-radius 0.45s cubic-bezier(.2, .9, .3, 1.2);
}
.pg-orb.shape-pill { width: 280px; height: 104px; border-radius: 999px; }
.pg-orb.shape-square { border-radius: 34px; }
.pg-orb.shape-diamond { width: 230px; height: 230px; border: 0; border-radius: 6px; box-shadow: none; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
.pg-dock { left: 50%; bottom: 24px; transform: translateX(-50%); padding: 9px; border-radius: 999px; display: flex; gap: 10px; }
.pg-key { position: relative; width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 16px; }
.pg-controls { left: 28px; bottom: 24px; width: 300px; padding: 14px 16px; border-radius: 22px; }
.pg-controls h2 { margin: 0 0 6px; padding: 0; border: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
.row { display: grid; grid-template-columns: 78px 1fr 34px; align-items: center; gap: 8px; margin: 2px 0; font-size: 13px; }
.row output { text-align: right; font-variant-numeric: tabular-nums; }
input[type='range'] { width: 100%; accent-color: #00e699; }
.chips, .foot { display: flex; gap: 6px; margin-top: 8px; }
.chip { position: relative; flex: 1; padding: 6px 0; border-radius: 999px; font-size: 12px; font-weight: 600; color: inherit; cursor: pointer; }
.chip.on { outline: 2px solid #00e699; outline-offset: -2px; }
.foot select { flex: 1; padding: 5px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.35); color: #fff; border: 1px solid rgba(255, 255, 255, 0.25); font-size: 12px; }
.code-btn { flex: 1; }
.hint { margin: 8px 0 0; font-size: 12px; }
.pg-code { right: 28px; bottom: 24px; width: min(460px, 46vw); padding: 14px; border-radius: 18px; }
.pg-code pre { margin: 0 0 10px; white-space: pre-wrap; font: 12px/1.5 var(--vp-font-family-mono); }
.pg-code .chip { width: 100%; }
/* Short screens: the controls need the height, the title panel steps aside. */
@media (max-height: 760px) {
  .pg-brand { display: none; }
  .pg-controls { bottom: 16px; }
}
@media (max-width: 900px) {
  .pg-menu, .pg-gem, .pg-kaleido, .pg-code { display: none; }
  .pg-brand { width: calc(100% - 56px); }
  .pg-controls { width: calc(100% - 56px); bottom: 100px; }
}
</style>
