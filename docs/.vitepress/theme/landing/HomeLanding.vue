<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { withBase } from 'vitepress'
import { startGameGlass, type GameGlassHandle } from '../../../../src/index'
import { createCity, type City } from './city'
import { copy, type Lang } from './copy'

const props = defineProps<{ lang?: Lang }>()
const c = copy[props.lang ?? 'en']
const base = props.lang === 'pt' ? '/pt' : ''

const sky = ref<HTMLCanvasElement>()
const split = ref(50)
const compare = ref<HTMLElement>()
const gem = reactive({ x: 0, y: 0 })
const copied = ref(false)
let city: City | null = null
let glass: GameGlassHandle | null = null

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight
  city?.setScroll(max > 0 ? scrollY / max : 0)
}

function onPointer(e: PointerEvent) {
  city?.setPointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1)
}

function dragSplit(e: PointerEvent) {
  const box = compare.value
  if (!box) return
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  const move = (ev: PointerEvent) => {
    const r = box.getBoundingClientRect()
    split.value = Math.min(92, Math.max(8, ((ev.clientX - r.left) / r.width) * 100))
  }
  move(e)
  const target = e.target as HTMLElement
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', () => target.removeEventListener('pointermove', move), { once: true })
}

function dragGem(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  const sx = e.clientX - gem.x
  const sy = e.clientY - gem.y
  const move = (ev: PointerEvent) => { gem.x = ev.clientX - sx; gem.y = ev.clientY - sy }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true })
}

async function copyInstall() {
  await navigator.clipboard.writeText('npm i mri-fivem-liquid-glass')
  copied.value = true
  setTimeout(() => { copied.value = false }, 1400)
}

onMounted(() => {
  document.documentElement.classList.add('mri-landing')
  const canvas = sky.value!
  city = createCity(canvas)
  if (city) {
    glass = startGameGlass({ fallbackImage: canvas, zIndex: 1, blur: 16, saturation: 1.2 })
  } else {
    // No WebGL for the city: a real in-game frame stands in, still behind real glass.
    const img = new Image()
    img.onload = () => {
      canvas.width = innerWidth
      canvas.height = innerHeight
      const k = Math.max(innerWidth / img.width, innerHeight / img.height)
      canvas.getContext('2d')!.drawImage(img, (innerWidth - img.width * k) / 2, (innerHeight - img.height * k) / 2, img.width * k, img.height * k)
      glass = startGameGlass({ fallbackImage: canvas, zIndex: 1, blur: 16 })
    }
    img.src = withBase('/scene.webp')
  }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('pointermove', onPointer, { passive: true })
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('mri-landing')
  removeEventListener('scroll', onScroll)
  removeEventListener('pointermove', onPointer)
  glass?.stop()
  city?.dispose()
})
</script>

<template>
  <div class="landing">
    <canvas ref="sky" class="sky" aria-hidden="true" />
    <div class="shade" aria-hidden="true" />

    <section class="hero wrap">
      <div class="hero-text">
        <p class="eyebrow">{{ c.eyebrow }}</p>
        <h1><span>{{ c.title1 }}</span><span class="grad">{{ c.title2 }}</span></h1>
        <p class="lead">{{ c.lead }}</p>
        <div class="ctas">
          <a class="pill primary" data-glass="liquid" :href="withBase(`${base}/guide/getting-started`)">{{ c.ctaStart }}</a>
          <a class="pill" data-glass="liquid" :href="withBase(`${base}/guide/ai`)">{{ c.ctaAi }}</a>
          <a class="pill" data-glass="liquid" :href="withBase('/playground')">{{ c.ctaPlay }}</a>
        </div>
        <p class="live"><span class="dot" />{{ c.live }}</p>
      </div>

      <div class="mock" aria-hidden="true">
        <div class="inv" data-glass>
          <div class="inv-head"><strong>{{ c.hudTitle }}</strong><span>{{ c.hudWeight }}</span></div>
          <div class="bar"><i /></div>
          <div class="slots">
            <div v-for="n in 9" :key="n" class="slot" data-glass="liquid"><b>{{ ['W', 'B', 'K', 'P', 'M', 'R', 'L', 'C', 'D'][n - 1] }}</b><small>x{{ n }}</small></div>
          </div>
        </div>
        <div class="speed" data-glass="liquid"><strong>128</strong><span>km/h</span></div>
        <div class="gem" data-glass="liquid" data-glass-shape="diamond" data-glass-lens="gem" :style="{ transform: `translate(${gem.x}px, ${gem.y}px)` }" @pointerdown="dragGem" />
        <div class="kaleido" data-glass="liquid" data-glass-lens="kaleidoscope" data-glass-facets="8"><span>{{ c.kaleido }}</span></div>
      </div>
    </section>

    <section class="wrap block">
      <div class="head">
        <h2>{{ c.problemTitle }}</h2>
        <p>{{ c.problemText }}</p>
      </div>
      <div ref="compare" class="compare">
        <div class="side flat" :style="{ width: `${split}%` }">
          <div class="ui"><strong>{{ c.before }}</strong><span>{{ c.beforeNote }}</span><i /><i /><i /></div>
        </div>
        <div class="side real" data-glass :style="{ left: `${split}%`, width: `${100 - split}%` }">
          <div class="ui"><strong>{{ c.after }}</strong><span>{{ c.afterNote }}</span><i /><i /><i /></div>
        </div>
        <button class="handle" :style="{ left: `${split}%` }" aria-label="Compare" @pointerdown="dragSplit"><span /></button>
      </div>
    </section>

    <section class="wrap block">
      <div class="head"><h2>{{ c.forTitle }}</h2><p>{{ c.forText }}</p></div>
      <div class="grid three">
        <article v-for="(u, i) in c.uses" :key="i" class="card" data-glass>
          <span class="icon" data-glass="liquid">{{ i + 1 }}</span>
          <h3>{{ u[0] }}</h3>
          <p>{{ u[1] }}</p>
        </article>
      </div>
    </section>

    <section class="wrap block">
      <div class="head"><h2>{{ c.howTitle }}</h2></div>
      <div class="grid four steps">
        <article v-for="(h, i) in c.how" :key="i" class="card" data-glass>
          <span class="num" data-glass="liquid">{{ i + 1 }}</span>
          <h3>{{ h[0] }}</h3>
          <p>{{ h[1] }}</p>
        </article>
      </div>
    </section>

    <section class="wrap block">
      <div class="head"><h2>{{ c.startTitle }}</h2><p>{{ c.startText }}</p></div>
      <div class="grid two">
        <article class="card code" data-glass>
<pre><span class="k">npm</span> i mri-fivem-liquid-glass

<span class="k">import</span> { startGameGlass } <span class="k">from</span> <span class="s">'mri-fivem-liquid-glass'</span>
startGameGlass()

&lt;div <span class="a">data-glass</span>&gt;Frosted panel&lt;/div&gt;
&lt;button <span class="a">data-glass</span>=<span class="s">"liquid"</span>&gt;Liquid button&lt;/button&gt;</pre>
          <button class="pill small" data-glass="liquid" @click="copyInstall">{{ copied ? 'copied' : 'copy install' }}</button>
        </article>
        <article class="card ai" data-glass>
          <h3>{{ c.aiTitle }}</h3>
          <p>{{ c.aiText }}</p>
          <code>npx mri-fivem-liquid-glass setup-ai</code>
          <a class="pill primary" data-glass="liquid" :href="withBase(`${base}/guide/ai`)">{{ c.aiLink }}</a>
        </article>
      </div>
    </section>

    <section class="wrap block">
      <div class="stats">
        <div v-for="s in c.stats" :key="s[1]" class="stat" data-glass="liquid"><strong>{{ s[0] }}</strong><span>{{ s[1] }}</span></div>
      </div>
    </section>

    <section class="wrap block last">
      <article class="card community" data-glass>
        <h2>{{ c.communityTitle }}</h2>
        <p>{{ c.communityText }}</p>
        <div class="ctas">
          <a class="pill primary" data-glass="liquid" :href="withBase(`${base}/guide/`)">{{ c.docs }}</a>
          <a class="pill" data-glass="liquid" :href="withBase('/showcase')">{{ c.showcase }}</a>
          <a class="pill" data-glass="liquid" :href="withBase('/presets')">{{ c.presets }}</a>
          <a class="pill" data-glass="liquid" href="https://github.com/mur4i/mri-fivem-liquid-glass">GitHub</a>
        </div>
      </article>
    </section>
  </div>
</template>

<style>
html.mri-landing body { background: #07060d; }
html.mri-landing .VPNavBar,
html.mri-landing .VPNavBar.has-sidebar .content-body,
html.mri-landing .VPNavBar .divider { background: rgba(7, 6, 13, 0.55) !important; backdrop-filter: blur(14px); }
html.mri-landing .VPNavBar .title,
html.mri-landing .VPNavBarMenuLink,
html.mri-landing .VPNavBar .VPSocialLink { color: rgba(255, 255, 255, 0.86); }
</style>

<style scoped>
.landing { --ink: #fff; --soft: rgba(255, 255, 255, 0.72); color: var(--ink); font-family: var(--vp-font-family-base); }
/* Layers: city (0) < glass canvas (1, on <body>) < content (2). */
.sky { position: fixed; inset: 0; z-index: 0; width: 100vw; height: 100vh; display: block; }
.shade { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 70% 80% at 18% 45%, rgba(7, 6, 13, 0.72), transparent 70%), linear-gradient(180deg, transparent 60%, rgba(7, 6, 13, 0.35)); }
.wrap { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 0 28px; }
[data-glass] {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 24px 60px rgba(0, 0, 0, 0.35);
}
[data-glass-backdrop='bright'] { color: #14111c; }

.hero { min-height: calc(100vh - var(--vp-nav-height)); display: grid; grid-template-columns: 1.05fr 0.95fr; align-items: center; gap: 40px; padding-top: 30px; padding-bottom: 60px; }
.eyebrow { margin: 0 0 18px; font: 700 13px var(--vp-font-family-mono); letter-spacing: 0.08em; color: #7cf5c8; text-shadow: 0 0 18px rgba(0, 230, 153, 0.45); text-transform: uppercase; }
h1 { margin: 0; font-size: clamp(44px, 6.4vw, 92px); line-height: 0.98; letter-spacing: -0.035em; font-weight: 800; }
h1 span { display: block; }
.grad { background: linear-gradient(100deg, #00e699 0%, #7cc4ff 45%, #e3a6ff 85%); -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: 6px; }
.lead { max-width: 560px; margin: 26px 0 30px; font-size: 19px; line-height: 1.55; color: rgba(255, 255, 255, 0.86); text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6); }
.ctas { display: flex; flex-wrap: wrap; gap: 12px; }
.pill { position: relative; display: inline-flex; align-items: center; padding: 13px 22px; border-radius: 999px; font-weight: 650; font-size: 15px; color: #fff !important; text-decoration: none !important; transition: transform 0.15s; }
.pill:hover { transform: translateY(-2px); }
.pill.primary { background: rgba(0, 230, 153, 0.22); border-color: rgba(0, 230, 153, 0.55); }
.pill.small { padding: 8px 16px; font-size: 13px; }
.live { display: flex; align-items: flex-start; gap: 10px; max-width: 520px; margin-top: 28px; font-size: 13px; color: rgba(255, 255, 255, 0.55); }
.dot { flex: none; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: #00e699; box-shadow: 0 0 12px #00e699; }

.mock { position: relative; height: 560px; }
.inv { position: absolute; left: 4%; top: 6%; width: 330px; padding: 18px; border-radius: 26px; }
.inv-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; }
.inv-head span { font-size: 12px; color: var(--soft); }
.bar { height: 5px; margin: 10px 0 14px; border-radius: 9px; background: rgba(255, 255, 255, 0.12); overflow: hidden; }
.bar i { display: block; width: 31%; height: 100%; background: linear-gradient(90deg, #00e699, #7cc4ff); }
.slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.slot { position: relative; aspect-ratio: 1; border-radius: 16px; display: grid; place-items: center; align-content: center; gap: 2px; }
.slot b { font-size: 20px; opacity: 0.9; }
.slot small { font-size: 11px; color: var(--soft); }
.speed { position: absolute; right: 6%; top: 2%; width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; align-content: center; }
.speed strong { font-size: 40px; line-height: 1; font-weight: 800; }
.speed span { font-size: 12px; color: var(--soft); }
.gem { position: absolute; right: 10%; top: 44%; width: 170px; height: 170px; border: 0; border-radius: 6px; box-shadow: none; cursor: grab; touch-action: none; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
.gem:active { cursor: grabbing; }
.kaleido { position: absolute; left: 24%; bottom: 0; width: 170px; height: 170px; border-radius: 50%; display: grid; place-items: center; }
.kaleido span { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255, 255, 255, 0.85); }

.block { padding-top: 110px; }
.block.last { padding-bottom: 140px; }
.head { max-width: 720px; margin-bottom: 32px; }
h2 { margin: 0 0 10px; padding: 0; border: 0; font-size: clamp(30px, 3.6vw, 48px); line-height: 1.08; letter-spacing: -0.025em; font-weight: 800; color: #fff; }
.head p { margin: 0; font-size: 18px; line-height: 1.55; color: var(--soft); }

.compare { position: relative; height: 340px; border-radius: 30px; }
.side { position: absolute; top: 0; height: 100%; overflow: hidden; }
.side.flat { left: 0; border-radius: 30px 0 0 30px; background: rgba(150, 150, 160, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); }
.side.real { border-radius: 0 30px 30px 0; }
.ui { position: absolute; top: 36px; width: 380px; display: flex; flex-direction: column; gap: 10px; }
.flat .ui { left: 36px; }
.real .ui { right: 36px; text-align: right; align-items: flex-end; }
.ui strong { font-size: 22px; }
.ui span { color: var(--soft); }
.ui i { display: block; height: 12px; width: 70%; border-radius: 8px; background: rgba(255, 255, 255, 0.22); }
.ui i:nth-of-type(2) { width: 52%; }
.ui i:nth-of-type(3) { width: 61%; }
.handle { position: absolute; top: 50%; z-index: 3; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: #fff; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); cursor: ew-resize; touch-action: none; }
.handle span { display: block; width: 18px; height: 18px; margin: auto; border-left: 3px solid #14111c; border-right: 3px solid #14111c; }
.handle::before { content: ''; position: absolute; left: 21px; top: -147px; width: 4px; height: 340px; background: rgba(255, 255, 255, 0.9); z-index: -1; }

.grid { display: grid; gap: 18px; }
.three { grid-template-columns: repeat(3, 1fr); }
.four { grid-template-columns: repeat(4, 1fr); }
.two { grid-template-columns: 1.15fr 0.85fr; }
.card { position: relative; padding: 24px; border-radius: 24px; }
.card h3 { margin: 14px 0 8px; font-size: 19px; color: inherit; }
.card p { margin: 0; color: var(--soft); line-height: 1.55; font-size: 15px; }
.icon, .num { position: relative; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; font-weight: 800; color: #7cf5c8; }
.num { border-radius: 50%; }
.code pre { margin: 0 0 18px; font: 14px/1.7 var(--vp-font-family-mono); color: #e6edf3; white-space: pre-wrap; }
.code .k { color: #ff7b9c; }
.code .s { color: #a5d6ff; }
.code .a { color: #7cf5c8; }
.ai code { display: block; margin: 16px 0 20px; padding: 12px 14px; border-radius: 12px; background: rgba(0, 0, 0, 0.35); font-size: 14px; color: #7cf5c8; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat { position: relative; padding: 22px; border-radius: 999px; text-align: center; }
.stat strong { display: block; font-size: 34px; font-weight: 800; letter-spacing: -0.02em; }
.stat span { color: var(--soft); font-size: 14px; }
.community { padding: 40px; text-align: center; }
.community p { max-width: 640px; margin: 0 auto 24px; font-size: 17px; }
.community .ctas { justify-content: center; }

@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; }
  .mock { height: 440px; }
  .three { grid-template-columns: 1fr 1fr; }
  .four, .stats { grid-template-columns: 1fr 1fr; }
  .two { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .mock .gem, .mock .kaleido, .speed { display: none; }
  .inv { left: 0; width: 100%; }
  .three, .four { grid-template-columns: 1fr; }
  .ui { width: 240px; }
  .stat { border-radius: 24px; }
}
</style>
