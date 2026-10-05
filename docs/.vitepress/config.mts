import { defineConfig } from 'vitepress'

const repo = 'https://github.com/mur4i/mri-fivem-liquid-glass'

const guideEn = [
  {
    text: 'Getting started',
    items: [
      { text: 'Introduction', link: '/guide/' },
      { text: 'Quick start', link: '/guide/getting-started' },
      { text: 'Markup', link: '/guide/markup' },
      { text: 'Options', link: '/guide/options' },
      { text: 'Shapes and lenses', link: '/guide/shapes-and-lenses' },
    ],
  },
  {
    text: 'In your resource',
    items: [
      { text: 'FiveM resource', link: '/guide/fivem' },
      { text: 'React, Vue, Svelte', link: '/guide/frameworks' },
      { text: 'Performance', link: '/guide/performance' },
      { text: 'Troubleshooting', link: '/guide/troubleshooting' },
    ],
  },
  {
    text: 'Deep dive',
    items: [
      { text: 'How it works', link: '/guide/how-it-works' },
      { text: 'JSON API', link: '/api' },
      { text: 'For AI agents', link: '/guide/ai' },
      { text: 'Contributing', link: '/guide/contributing' },
    ],
  },
]

const guidePt = [
  {
    text: 'Começando',
    items: [
      { text: 'Introdução', link: '/pt/guide/' },
      { text: 'Começo rápido', link: '/pt/guide/getting-started' },
      { text: 'Marcação', link: '/pt/guide/markup' },
      { text: 'Opções', link: '/pt/guide/options' },
      { text: 'Formatos e lentes', link: '/pt/guide/shapes-and-lenses' },
    ],
  },
  {
    text: 'No seu resource',
    items: [
      { text: 'Resource FiveM', link: '/pt/guide/fivem' },
      { text: 'Desempenho', link: '/pt/guide/performance' },
      { text: 'Para agentes de IA', link: '/pt/guide/ai' },
    ],
  },
]

export default defineConfig({
  base: '/mri-fivem-liquid-glass/',
  title: 'mri-fivem-liquid-glass',
  description: 'Real liquid glass and game blur for FiveM NUI.',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#00e699' }],
    ['meta', { property: 'og:image', content: 'https://mur4i.github.io/mri-fivem-liquid-glass/social-preview.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: repo },
      { icon: 'npm', link: 'https://www.npmjs.com/package/mri-fivem-liquid-glass' },
      { icon: 'youtube', link: 'https://www.youtube.com/watch?v=W2z3DP6N95c' },
    ],
    editLink: { pattern: `${repo}/edit/main/docs/:path` },
    footer: {
      message: 'MIT licensed. Not affiliated with Apple, Cfx.re or Rockstar Games.',
      copyright: 'Made by Murai and the MRI Brasil team',
    },
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/' },
          { text: 'Playground', link: '/playground' },
          { text: 'Presets', link: '/presets' },
          { text: 'Showcase', link: '/showcase' },
          { text: 'API', link: '/api' },
        ],
        sidebar: { '/guide/': guideEn, '/api': guideEn },
      },
    },
    pt: {
      label: 'Português',
      lang: 'pt-BR',
      link: '/pt/',
      themeConfig: {
        nav: [
          { text: 'Guia', link: '/pt/guide/' },
          { text: 'Playground', link: '/playground' },
          { text: 'Presets', link: '/presets' },
          { text: 'Vitrine', link: '/showcase' },
          { text: 'API', link: '/api' },
        ],
        sidebar: { '/pt/guide/': guidePt },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Editar esta página' },
        docFooter: { prev: 'Anterior', next: 'Próxima' },
        outline: { label: 'Nesta página' },
        lastUpdated: { text: 'Atualizado em' },
      },
    },
  },
})
