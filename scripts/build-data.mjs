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
