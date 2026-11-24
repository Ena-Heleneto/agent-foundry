/**
 * 文档应用只启用内容、检查与属性化样式模块，使用Node原生SQLite。
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-11-13',
  modules: ['@nuxt/content', '@nuxt/eslint', '@unocss/nuxt'],
  css: ['~/assets/css/main.css'],
  content: { experimental: { sqliteConnector: 'native' }, build: { markdown: { highlight: { theme: 'github-dark' } } } },
  eslint: { config: { standalone: false } },
  app: { head: { htmlAttrs: { lang: 'zh-CN' }, titleTemplate: '%s · Agent Foundry', meta: [{ name: 'theme-color', content: '#f8fafc' }] } },
  devServer: { host: '0.0.0.0', port: 7000, allowedHosts: true },
  devtools: { enabled: true },
})
