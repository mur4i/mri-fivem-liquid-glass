<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ lang?: 'en' | 'pt' }>()
const pt = props.lang === 'pt'

type AgentId = 'claude' | 'codex' | 'cursor' | 'copilot'
const agents: { id: AgentId; label: string; run: (p: string) => string; file: string; where: string }[] = [
  { id: 'claude', label: 'Claude Code', run: (p) => `claude "${p}"`, file: '.claude/skills/mri-fivem-liquid-glass/SKILL.md', where: 'Claude Code' },
  { id: 'codex', label: 'Codex', run: (p) => `codex "${p}"`, file: 'AGENTS.md', where: 'Codex' },
  { id: 'cursor', label: 'Cursor', run: (p) => `# Cursor chat: ${p}`, file: '.cursor/rules/mri-fivem-liquid-glass.mdc', where: 'Cursor' },
  { id: 'copilot', label: 'Copilot', run: (p) => `# Copilot chat: ${p}`, file: '.github/copilot-instructions.md', where: 'Copilot' },
]
const agent = ref<AgentId>('claude')
const current = computed(() => agents.find((a) => a.id === agent.value)!)

// Prompt builder.
const what = ref('inventory')
const look = ref('liquid')
const stack = ref('react')
const targets: Record<string, [string, string]> = {
  inventory: ['my inventory NUI', 'a NUI de inventário'],
  hud: ['a HUD dock with my quick actions', 'um dock de HUD com as ações rápidas'],
  menu: ['my interaction menu (third eye / radial)', 'o meu menu de interação (third eye / radial)'],
  phone: ['my phone / tablet NUI', 'a NUI do meu celular / tablet'],
  notify: ['my notifications and toasts', 'as minhas notificações'],
}
const looks: Record<string, [string, string]> = {
  frosted: ['frosted glass panels, no rim, text always readable', 'painéis de vidro fosco, sem bisel, texto sempre legível'],
  liquid: ['frosted panels plus liquid glass buttons with refraction', 'painéis foscos e botões de liquid glass com refração'],
  gem: ['liquid glass, with a diamond gem accent for the main action', 'liquid glass, com um diamante gema na ação principal'],
  kaleido: ['liquid glass, with a kaleidoscope orb as a highlight', 'liquid glass, com um orb caleidoscópio de destaque'],
}
const stacks: Record<string, string> = { react: 'React', vue: 'Vue', svelte: 'Svelte', html: 'plain HTML' }
const prompt = computed(() => {
  const i = pt ? 1 : 0
  return pt
    ? `Use mri-fivem-liquid-glass em ${targets[what.value][i]} (${stacks[stack.value]}): ${looks[look.value][i]}. Siga a skill da biblioteca: página transparente, root acima do canvas, sem backdrop-filter, cor do texto pelo data-glass-backdrop. Diga o que precisa ser testado no jogo.`
    : `Use mri-fivem-liquid-glass in ${targets[what.value][i]} (${stacks[stack.value]}): ${looks[look.value][i]}. Follow the library skill: transparent page, UI root above the canvas, no backdrop-filter, text color from data-glass-backdrop. Tell me what to test in game.`
})

// Terminal script, typed once when it scrolls into view.
type Line = { kind: 'cmd' | 'out' | 'ok' | 'act' | 'dim'; text: string }
const script = computed<Line[]>(() => [
  { kind: 'cmd', text: 'npm i mri-fivem-liquid-glass' },
  { kind: 'dim', text: 'added 1 package in 2s' },
  { kind: 'cmd', text: `npx mri-fivem-liquid-glass setup-ai --agent=${agent.value}` },
  { kind: 'out', text: pt ? 'Ensinando liquid glass aos seus agentes de IA' : 'Teaching your AI agents liquid glass' },
  { kind: 'ok', text: `+ ${current.value.label.padEnd(14)} ${current.value.file}` },
  { kind: 'cmd', text: current.value.run(pt ? 'Coloca liquid glass na minha NUI de inventário' : 'Add liquid glass to my inventory NUI') },
  { kind: 'act', text: pt ? 'lendo a skill mri-fivem-liquid-glass' : 'reading skill mri-fivem-liquid-glass' },
  { kind: 'act', text: 'startGameGlass() -> web/src/main.tsx' },
  { kind: 'act', text: pt ? '.inventory -> data-glass  ·  botões -> data-glass="liquid"' : '.inventory -> data-glass  ·  buttons -> data-glass="liquid"' },
  { kind: 'act', text: pt ? 'removido backdrop-filter de 3 elementos' : 'removed backdrop-filter from 3 elements' },
  { kind: 'act', text: 'html, body, #root transparent  ·  #root z-index 1' },
  { kind: 'ok', text: pt ? 'pronto: abra a NUI no jogo pra ver o vidro' : 'done: open the NUI in game to see the glass' },
])

const shown = ref<Line[]>([])
const typing = ref('')
const done = ref(false)
const term = ref<HTMLElement>()
let timer = 0
let started = false
let observer: IntersectionObserver | null = null

function play() {
  clearTimeout(timer)
  shown.value = []
  typing.value = ''
  done.value = false
  const lines = script.value
  let li = 0
  let ci = 0
  const step = () => {
    if (li >= lines.length) { done.value = true; return }
    const line = lines[li]
    if (line.kind === 'cmd' && ci < line.text.length) {
      typing.value = line.text.slice(0, ++ci)
      timer = window.setTimeout(step, 16 + Math.random() * 30)
      return
    }
    shown.value.push(line)
    typing.value = ''
    ci = 0
    li++
    timer = window.setTimeout(step, line.kind === 'cmd' ? 420 : line.kind === 'act' ? 260 : 180)
  }
  step()
}

const copied = ref('')
async function copy(text: string, key: string) {
  await navigator.clipboard.writeText(text)
  copied.value = key
  setTimeout(() => { copied.value = '' }, 1400)
}

watch(agent, () => { if (started) play() })

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && !started) {
      started = true
      play()
    }
  }, { threshold: 0.3 })
  if (term.value) observer.observe(term.value)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  observer?.disconnect()
})

const t = (en: string, ptText: string) => (pt ? ptText : en)
</script>

<template>
  <div class="onb">
    <div class="tabs" role="tablist">
      <button v-for="a in agents" :key="a.id" role="tab" :aria-selected="agent === a.id" :class="{ on: agent === a.id }" @click="agent = a.id">{{ a.label }}</button>
    </div>

    <div ref="term" class="term" aria-label="Terminal demo">
      <div class="bar"><i /><i /><i /><span>~/my-fivem-resource</span>
        <button class="replay" @click="play">{{ t('replay', 'repetir') }}</button>
      </div>
      <div class="screen">
        <div v-for="(l, i) in shown" :key="i" :class="['ln', l.kind]">
          <template v-if="l.kind === 'cmd'"><b>$</b> {{ l.text }}</template>
          <template v-else-if="l.kind === 'act'"><b>●</b> {{ l.text }}</template>
          <template v-else>{{ l.text }}</template>
        </div>
        <div v-if="!done" class="ln cmd"><b>$</b> {{ typing }}<span class="caret" /></div>
      </div>
    </div>

    <div class="steps">
      <div class="step">
        <span class="n">1</span>
        <div>
          <strong>{{ t('Install', 'Instale') }}</strong>
          <code>npm i mri-fivem-liquid-glass</code>
        </div>
        <button @click="copy('npm i mri-fivem-liquid-glass', 'i')">{{ copied === 'i' ? t('copied', 'copiado') : t('copy', 'copiar') }}</button>
      </div>
      <div class="step">
        <span class="n">2</span>
        <div>
          <strong>{{ t('Teach your agent', 'Ensine o seu agente') }}</strong>
          <code>npx mri-fivem-liquid-glass setup-ai --agent={{ agent }}</code>
        </div>
        <button @click="copy(`npx mri-fivem-liquid-glass setup-ai --agent=${agent}`, 's')">{{ copied === 's' ? t('copied', 'copiado') : t('copy', 'copiar') }}</button>
      </div>
      <div class="step">
        <span class="n">3</span>
        <div>
          <strong>{{ t('Ask for it', 'Peça') }}</strong>
          <div class="builder">
            <select v-model="what" :aria-label="t('What', 'O quê')">
              <option v-for="(v, k) in targets" :key="k" :value="k">{{ v[pt ? 1 : 0] }}</option>
            </select>
            <select v-model="look" :aria-label="t('Look', 'Visual')">
              <option v-for="(v, k) in looks" :key="k" :value="k">{{ k }}</option>
            </select>
            <select v-model="stack" :aria-label="t('Stack', 'Stack')">
              <option v-for="(v, k) in stacks" :key="k" :value="k">{{ v }}</option>
            </select>
          </div>
          <p class="prompt">{{ prompt }}</p>
        </div>
        <button @click="copy(prompt, 'p')">{{ copied === 'p' ? t('copied', 'copiado') : t('copy', 'copiar') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onb { margin: 24px 0; }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.tabs button { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--vp-c-divider); font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.tabs button.on { color: var(--vp-c-bg); background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.term { border-radius: 14px; overflow: hidden; background: #0d1117; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); }
.bar { display: flex; align-items: center; gap: 7px; padding: 10px 14px; background: #161b22; color: #8b949e; font: 12px var(--vp-font-family-mono); }
.bar i { width: 11px; height: 11px; border-radius: 50%; background: #ff5f57; }
.bar i:nth-child(2) { background: #febc2e; }
.bar i:nth-child(3) { background: #28c840; }
.bar span { margin-left: 8px; }
.replay { margin-left: auto; color: #8b949e; font: inherit; }
.replay:hover { color: #fff; }
.screen { min-height: 330px; padding: 14px 18px; font: 13px/1.75 var(--vp-font-family-mono); color: #c9d1d9; }
.ln { white-space: pre-wrap; word-break: break-word; }
.ln b { color: #00e699; font-weight: 700; }
.ln.dim { color: #6e7681; }
.ln.ok { color: #3fb950; }
.ln.act { color: #a5d6ff; padding-left: 4px; }
.ln.act b { color: #a5d6ff; font-size: 10px; }
.caret { display: inline-block; width: 8px; height: 15px; margin-left: 2px; vertical-align: -2px; background: #c9d1d9; animation: blink 1s steps(2) 6; }
@keyframes blink { 50% { opacity: 0; } }
.steps { display: grid; gap: 10px; margin-top: 16px; }
.step { display: grid; grid-template-columns: 34px 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border: 1px solid var(--vp-c-divider); border-radius: 12px; background: var(--vp-c-bg-soft); }
.step .n { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 700; }
.step strong { display: block; margin-bottom: 4px; }
.step code { font-size: 13px; }
.step > button { padding: 5px 12px; border-radius: 8px; border: 1px solid var(--vp-c-divider); font-size: 12px; font-weight: 600; }
.step > button:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.builder { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
.builder select { padding: 4px 8px; border-radius: 8px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); font-size: 13px; }
.prompt { margin: 4px 0 0; font-size: 13px; color: var(--vp-c-text-2); }
@media (max-width: 640px) { .step { grid-template-columns: 28px 1fr; } .step > button { grid-column: 2; justify-self: start; } }
</style>
