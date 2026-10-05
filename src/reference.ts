// Machine-readable reference of the public surface; the docs site, the JSON API and llms.txt are generated from it.
import { GLASS_DEFAULTS } from './liquidGlass.js'

export interface OptionInfo {
  name: keyof typeof GLASS_DEFAULTS
  type: string
  default: unknown
  description: string
}

export interface AttributeInfo {
  name: string
  values: string
  description: string
  setBy: 'you' | 'library'
}

const d = GLASS_DEFAULTS

export const OPTIONS: OptionInfo[] = [
  { name: 'selector', type: 'string', default: d.selector, description: 'CSS selector of the elements that get glass.' },
  { name: 'scale', type: 'number', default: d.scale, description: 'Size of the blur buffer relative to the screen. Lower is cheaper and softer.' },
  { name: 'blur', type: 'number', default: d.blur, description: 'Gaussian sigma of the blur, in screen pixels.' },
  { name: 'saturation', type: 'number', default: d.saturation, description: 'Saturation of the backdrop (1 keeps the game colors).' },
  { name: 'darken', type: 'number', default: d.darken, description: 'Brightness multiplier of the backdrop (below 1 darkens it).' },
  { name: 'temporal', type: 'number', default: d.temporal, description: 'Weight of each new frame at 60 fps, scaled by the real frame time. 1 disables smoothing.' },
  { name: 'zIndex', type: 'number', default: d.zIndex, description: 'z-index of the glass canvas. Your UI root must sit above it.' },
  { name: 'toneInterval', type: 'number', default: d.toneInterval, description: 'Milliseconds between data-glass-backdrop updates.' },
  { name: 'light', type: '[number, number]', default: d.light, description: 'Direction of the rim highlight in screen space (x right, y down). Default comes from the top left.' },
  { name: 'fallbackImage', type: 'string | TexImageSource | null', default: d.fallbackImage, description: 'Image used instead of the game outside FiveM (browser dev, screenshots). A canvas or video is read live every frame, so a 3D scene or a gameplay clip works as a moving backdrop. Without it the library stays off outside the game.' },
]

export const ATTRIBUTES: AttributeInfo[] = [
  { name: 'data-glass', values: '(empty) | liquid', description: 'Marks the element. Empty is frosted glass; "liquid" adds the bevelled rim with refraction, color split and highlight.', setBy: 'you' },
  { name: 'data-glass-bezel', values: 'px', description: 'Width of the bevelled rim.', setBy: 'you' },
  { name: 'data-glass-refraction', values: 'px', description: 'How far the rim (or the gem facets) bend the backdrop.', setBy: 'you' },
  { name: 'data-glass-dispersion', values: '0 to 1', description: 'Color split on the rim and in the lenses.', setBy: 'you' },
  { name: 'data-glass-specular', values: '0 to 1', description: 'Strength of the rim highlight and of the gem cut lines.', setBy: 'you' },
  { name: 'data-glass-shape', values: 'diamond', description: 'Diamond outline instead of the rounded box. border-radius rounds its tips.', setBy: 'you' },
  { name: 'data-glass-lens', values: 'gem | kaleidoscope', description: 'Faceted cut gem, or the backdrop mirrored into slices around the center.', setBy: 'you' },
  { name: 'data-glass-facets', values: 'number', description: 'Facets of the gem (default 8) or slices of the kaleidoscope (default 6).', setBy: 'you' },
  { name: 'data-glass-backdrop', values: 'bright | dark', description: 'Brightness of what is behind the element, so the text can flip color. Hysteresis keeps it from flickering.', setBy: 'library' },
]
