import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import GlassPlayground from './components/GlassPlayground.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GlassPlayground', GlassPlayground)
  },
} satisfies Theme
