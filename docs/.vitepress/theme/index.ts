import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { defineAsyncComponent } from 'vue'
import GlassPlayground from './components/GlassPlayground.vue'
import AiOnboarding from './components/AiOnboarding.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GlassPlayground', GlassPlayground)
    app.component('AiOnboarding', AiOnboarding)
    // Async so three.js only loads on the landing page.
    app.component('HomeLanding', defineAsyncComponent(() => import('./landing/HomeLanding.vue')))
  },
} satisfies Theme
