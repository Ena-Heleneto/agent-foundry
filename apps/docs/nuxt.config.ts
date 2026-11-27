/**
 * 文档应用使用原生 SQLite 读取内容，Nuxt UI 和 Tailwind 通过 tw 前缀与 UnoCSS 共存。
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-11-13',
  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/ui', '@unocss/nuxt'],
  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false,
    fonts: false,
    theme: { prefix: 'tw' },
  },
  content: { experimental: { sqliteConnector: 'native' }, build: { markdown: { highlight: { theme: 'github-dark' } } } },
  eslint: { config: { standalone: false } },
  app: { head: { htmlAttrs: { lang: 'zh-CN' }, titleTemplate: '%s · Agent Foundry', meta: [{ name: 'theme-color', content: '#f8fafc' }] } },
  devServer: { host: '0.0.0.0', port: 7000, allowedHosts: true },
  devtools: { enabled: true },
})
