#!/usr/bin/env node
// npx mri-fivem-liquid-glass setup-ai: teaches the AI agents of the current project how to use this library.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const skillFile = path.resolve(here, '../skills/mri-fivem-liquid-glass/SKILL.md')
const cwd = process.cwd()
const START = '<!-- mri-fivem-liquid-glass:start -->'
const END = '<!-- mri-fivem-liquid-glass:end -->'

const agents = {
  claude: { label: 'Claude Code', file: '.claude/skills/mri-fivem-liquid-glass/SKILL.md', mode: 'copy', detect: ['.claude', 'CLAUDE.md'] },
  codex: { label: 'Codex and AGENTS.md agents', file: 'AGENTS.md', mode: 'block', detect: ['AGENTS.md', '.codex'] },
  cursor: { label: 'Cursor', file: '.cursor/rules/mri-fivem-liquid-glass.mdc', mode: 'cursor', detect: ['.cursor'] },
  copilot: { label: 'GitHub Copilot', file: '.github/copilot-instructions.md', mode: 'block', detect: ['.github/copilot-instructions.md'] },
}

const color = (c, s) => (process.stdout.isTTY ? `\x1b[${c}m${s}\x1b[0m` : s)
const green = (s) => color('32', s)
const dim = (s) => color('2', s)

function body() {
  return fs.readFileSync(skillFile, 'utf8').replace(/^---[\s\S]*?---\n+/, '')
}

function write(agent) {
  const target = path.join(cwd, agent.file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  if (agent.mode === 'copy') {
    fs.copyFileSync(skillFile, target)
  } else if (agent.mode === 'cursor') {
    const rule = `---\ndescription: Liquid glass and game blur in FiveM NUI with mri-fivem-liquid-glass\nglobs: ["**/*.html", "**/*.tsx", "**/*.vue", "**/*.svelte", "**/*.css", "**/*.lua"]\nalwaysApply: false\n---\n\n${body()}`
    fs.writeFileSync(target, rule)
  } else {
    // Idempotent block: re-running replaces the previous one instead of appending again.
    const block = `${START}\n${body().trim()}\n${END}\n`
    const old = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
    const next = old.includes(START)
      ? old.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), block)
      : `${old}${old && !old.endsWith('\n') ? '\n' : ''}${old ? '\n' : ''}${block}`
    fs.writeFileSync(target, next)
  }
  console.log(`  ${green('+')} ${agent.label.padEnd(28)} ${dim(agent.file)}`)
}

function setupAi(args) {
  const asked = args.flatMap((a) => (a.startsWith('--agent=') ? a.slice(8).split(',') : []))
  let chosen = asked.includes('all') ? Object.keys(agents) : asked
  if (!chosen.length) {
    chosen = Object.keys(agents).filter((k) => agents[k].detect.some((d) => fs.existsSync(path.join(cwd, d))))
    if (!chosen.length) chosen = ['claude', 'codex']
  }
  const unknown = chosen.filter((k) => !agents[k])
  if (unknown.length) {
    console.error(`Unknown agent: ${unknown.join(', ')}. Use ${Object.keys(agents).join(', ')} or all.`)
    process.exit(1)
  }
  console.log(`\nTeaching your AI agents liquid glass ${dim(`(${cwd})`)}\n`)
  for (const k of chosen) write(agents[k])
  console.log(`\nDone. Ask your agent, for example:\n\n  ${green('"Add liquid glass to my inventory NUI: frosted panel, liquid buttons, keep the text readable."')}\n`)
  console.log(dim('Docs: https://mur4i.github.io/mri-fivem-liquid-glass/  Improvements: open a pull request upstream.\n'))
}

const [cmd, ...rest] = process.argv.slice(2)
if (cmd === 'setup-ai') setupAi(rest)
else {
  console.log(`mri-fivem-liquid-glass

  npx mri-fivem-liquid-glass setup-ai                 detect agents in this project and teach them
  npx mri-fivem-liquid-glass setup-ai --agent=all     claude, codex (AGENTS.md), cursor, copilot
  npx mri-fivem-liquid-glass setup-ai --agent=claude,cursor
`)
}
