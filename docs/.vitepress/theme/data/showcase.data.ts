import { readRegistry, type ShowcaseEntry } from './registry'

declare const data: ShowcaseEntry[]
export { data }

export default {
  watch: ['../../../../registry/showcase/*.json'],
  load: () => readRegistry<ShowcaseEntry>('showcase'),
}
