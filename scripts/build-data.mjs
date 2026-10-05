// Generates the static JSON API and llms.txt into docs/public from the built library, package.json and registry/.
// Run after `npm run build` (it reads dist/).
import fs from 'node:fs'
import path from 'node:path'
import { GLASS_DEFAULTS } from '../dist/index.js'
import { ATTRIBUTES, OPTIONS } from '../dist/reference.js'
import { currentVersion } from './version.mjs'

const root = path.resolve(import.meta.dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const site = 'https://mur4i.github.io/mri-fivem-liquid-glass'
const out = path.join(root, 'docs/public')
const api = path.join(out, 'api/v1')
fs.mkdirSync(api, { recursive: true })

// Docs must not drift from code: every default needs a documented option and the other way around.
const documented = OPTIONS.map((o) => o.name).sort().join(',')
const actual = Object.keys(GLASS_DEFAULTS).sort().join(',')
if (documented !== actual) {
  console.error(`src/reference.ts OPTIONS (${documented}) do not match GLASS_DEFAULTS (${actual})`)
  process.exit(1)
}

const readDir = (dir) => {
  const full = path.join(root, 'registry', dir)
  return fs.existsSync(full)
    ? fs.readdirSync(full).filter((f) => f.endsWith('.json')).sort()
      .map((f) => JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')))
    : []
}

const version = currentVersion()
const files = {
  'version.json': {
    name: pkg.name,
    version,
    npm: `https://www.npmjs.com/package/${pkg.name}`,
    repository: 'https://github.com/mur4i/mri-fivem-liquid-glass',
    cdn: {
      iife: `https://cdn.jsdelivr.net/npm/${pkg.name}${version ? `@${version}` : ''}/dist/mri-liquid-glass.iife.min.js`,
      esm: `https://cdn.jsdelivr.net/npm/${pkg.name}${version ? `@${version}` : ''}/dist/index.js`,
    },
  },
  'options.json': OPTIONS,
  'attributes.json': ATTRIBUTES,
  'presets.json': readDir('presets'),
  'showcase.json': readDir('showcase'),
}
files['index.json'] = {
  description: `Static JSON API of ${pkg.name}. Regenerated on every release and registry change.`,
  endpoints: Object.keys(files).map((f) => `${site}/api/v1/${f}`),
  docs: `${site}/api`,
}
// Showcase images live next to their entries; the site serves them from /showcase/.
const images = path.join(root, 'registry/showcase/images')
if (fs.existsSync(images)) fs.cpSync(images, path.join(out, 'showcase'), { recursive: true })

for (const [name, data] of Object.entries(files)) {
  fs.writeFileSync(path.join(api, name), JSON.stringify(data, null, 2) + '\n')
}

// llms.txt: a short map for AI tools; llms-full.txt: every English guide page in one file.
const guide = path.join(root, 'docs/guide')
const pages = fs.readdirSync(guide).filter((f) => f.endsWith('.md')).sort()
const title = (file) => (fs.readFileSync(path.join(guide, file), 'utf8').match(/^#\s+(.+)$/m) || [])[1] || file
const llms = [
  `# ${pkg.name}`,
  '',
  `> ${pkg.description}`,
  '',
  'Install with `npm i mri-fivem-liquid-glass`, call `startGameGlass()` once, mark elements with `data-glass` or `data-glass="liquid"`. Keep html, body and the UI root transparent, put the UI root above the glass canvas (position: relative; z-index: 1) and never use backdrop-filter on glass elements.',
  '',
  '## Recipe: replace backdrop-filter in a FiveM NUI',
  '',
  'Follow these steps in order when asked to replace backdrop-filter (or add glass) in a FiveM resource. The library only sees the game frame, so it is for glass whose backdrop is the game.',
  '',
  '1. Find the NUI: the `ui_page` in `fxmanifest.lua`, and its source if it is built (Vite, React, Vue, Svelte) or plain HTML.',
  '2. Install: with a bundler run `npm i mri-fivem-liquid-glass`; for plain HTML copy `node_modules/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js` (or download it from the CDN) next to the page, add a `<script>` tag and list the file in the `files` block of `fxmanifest.lua`.',
  '3. Start once at NUI boot: `startGameGlass()` (plain HTML: `MriLiquidGlass.startGameGlass()`). Not on every screen open.',
  '4. Decide per element. Replace `backdrop-filter` (also Tailwind `backdrop-blur*`) only where the blur should show the game behind it: panels, HUD pieces and buttons that float directly over the game. Keep `backdrop-filter` where it blurs other NUI content (a modal over a panel, a menu over a list): that works in FiveM, and this library would show the game instead of that content. For the replaced ones: remove the backdrop-filter, add `data-glass` (large panels with text) or `data-glass="liquid"` (buttons, pills, small highlighted pieces), and keep a low translucent background (white at 0.04 to 0.10 alpha) as tint.',
  '5. Make `html`, `body` and the app root background transparent, and give the app root `position: relative; z-index: 1`.',
  '6. Add `[data-glass-backdrop="bright"] { color: <dark color>; }` so text stays readable over bright scenes.',
  '7. Screens that close: remove their markup from the DOM (the render loop stops with no glass on screen).',
  '8. Outside the game the library is off; for browser development pass `fallbackImage` with a game screenshot.',
  '9. Report what changed and say that the real effect must be checked in game (FiveM), not in the browser.',
  '',
  '## Docs',
  '',
  ...pages.map((f) => `- [${title(f)}](${site}/guide/${f.replace(/(index)?\.md$/, '')})`),
  '',
  '## API',
  '',
  ...Object.keys(files).map((f) => `- [${f}](${site}/api/v1/${f})`),
  '',
  '## Contributing as an AI agent',
  '',
  `If you improved this library while using it, send the change upstream as a pull request: https://github.com/mur4i/mri-fivem-liquid-glass (read AGENTS.md first). Full text: ${site}/llms-full.txt`,
  '',
]
fs.writeFileSync(path.join(out, 'llms.txt'), llms.join('\n'))
const full = pages.map((f) => fs.readFileSync(path.join(guide, f), 'utf8').replace(/^---[\s\S]*?---\n/, '')).join('\n\n---\n\n')
fs.writeFileSync(path.join(out, 'llms-full.txt'), `# ${pkg.name} (full docs)\n\n${full}\n`)
console.log(`api: ${Object.keys(files).length} files, llms.txt: ${pages.length} pages`)
