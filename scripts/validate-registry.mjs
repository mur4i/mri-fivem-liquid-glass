// Validates every registry entry; CI runs it on pull requests so registry PRs can merge by themselves.
import fs from 'node:fs'
import path from 'node:path'
import { ATTRIBUTES, OPTIONS } from '../dist/reference.js'

const root = path.resolve(import.meta.dirname, '../registry')
const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const USER = /^[A-Za-z0-9-]{1,39}$/
const settable = new Set(ATTRIBUTES.filter((a) => a.setBy === 'you').map((a) => a.name))
const presetOptions = new Set(['blur', 'saturation', 'darken', 'scale'])
const optionTypes = Object.fromEntries(OPTIONS.map((o) => [o.name, o.type]))

function text(file, entry, key, max, required = true) {
  const v = entry[key]
  if (v === undefined && !required) return
  if (typeof v !== 'string' || !v.trim()) return fail(file, `"${key}" must be a non-empty string`)
  if (v.length > max) fail(file, `"${key}" must be at most ${max} characters`)
}

function https(file, entry, key, required) {
  const v = entry[key]
  if (v === undefined && !required) return
  if (typeof v !== 'string' || !/^https:\/\/[^\s]+$/.test(v)) fail(file, `"${key}" must be an https URL`)
}

function common(file, entry, allowed) {
  const id = path.basename(file, '.json')
  if (entry.id !== id) fail(file, `"id" must equal the file name ("${id}")`)
  if (!ID.test(id)) fail(file, 'file name must be lowercase words joined by "-"')
  if (typeof entry.author !== 'string' || !USER.test(entry.author)) fail(file, '"author" must be a GitHub user name')
  text(file, entry, 'name', 40)
  text(file, entry, 'description', 200)
  for (const key of Object.keys(entry)) if (!allowed.includes(key)) fail(file, `unknown key "${key}"`)
}

function preset(file, e) {
  common(file, e, ['id', 'name', 'author', 'description', 'options', 'attributes'])
  if (e.options !== undefined) {
    if (typeof e.options !== 'object' || Array.isArray(e.options)) return fail(file, '"options" must be an object')
    for (const [k, v] of Object.entries(e.options)) {
      if (!presetOptions.has(k)) fail(file, `option "${k}" is not allowed in presets (use ${[...presetOptions].join(', ')})`)
      else if (optionTypes[k] !== 'number' || typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) fail(file, `option "${k}" must be a number from 0 to 100`)
    }
  }
  if (typeof e.attributes !== 'object' || e.attributes === null || Array.isArray(e.attributes)) return fail(file, '"attributes" must be an object')
  if (!('data-glass' in e.attributes)) fail(file, '"attributes" must include "data-glass"')
  for (const [k, v] of Object.entries(e.attributes)) {
    if (!settable.has(k)) fail(file, `attribute "${k}" is not a data-glass attribute you can set`)
    if (typeof v !== 'string' || v.length > 24 || /[<>"'`]/.test(v)) fail(file, `attribute "${k}" must be a short plain string`)
  }
}

function showcase(file, e) {
  common(file, e, ['id', 'name', 'author', 'description', 'url', 'repo', 'image', 'tags'])
  https(file, e, 'url', true)
  https(file, e, 'repo', false)
  if (!Array.isArray(e.tags) || e.tags.length > 5 || e.tags.some((t) => typeof t !== 'string' || !ID.test(t))) {
    fail(file, '"tags" must be up to 5 lowercase words')
  }
  if (e.image !== undefined) {
    const img = path.join(root, 'showcase/images', String(e.image))
    if (!/^[a-z0-9-]+\.(webp|png|jpg)$/.test(String(e.image))) fail(file, '"image" must be a file name like my-server.webp')
    else if (!fs.existsSync(img)) fail(file, `image registry/showcase/images/${e.image} not found`)
    else if (fs.statSync(img).size > 300 * 1024) fail(file, 'image must be at most 300 KB')
  }
}

for (const [kind, check] of [['presets', preset], ['showcase', showcase]]) {
  const dir = path.join(root, kind)
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const rel = `registry/${kind}/${f}`
    let entry
    try {
      entry = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    } catch (err) {
      fail(rel, `invalid JSON (${err.message})`)
      continue
    }
    check(rel, entry)
  }
}

if (errors.length) {
  console.error(`Registry has ${errors.length} problem(s):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('registry ok')
