import { readRegistry, type Preset } from './registry'

declare const data: Preset[]
export { data }

export default {
  watch: ['../../../../registry/presets/*.json'],
  load: () => readRegistry<Preset>('presets'),
}
