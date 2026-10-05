// Reads the community registry (registry/presets, registry/showcase) at build time.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Preset {
  id: string
  name: string
  author: string
  description: string
  options?: { blur?: number; saturation?: number; darken?: number }
  attributes: Record<string, string>
}

export interface ShowcaseEntry {
  id: string
  name: string
  author: string
  description: string
  url: string
  repo?: string
  image?: string
  tags: string[]
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../registry')

export function readRegistry<T>(kind: 'presets' | 'showcase'): T[] {
  const dir = path.join(root, kind)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as T)
}
