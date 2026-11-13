import { defineCollection, defineContentConfig } from '@nuxt/content'

/**
 * 只发布专门编写的使用者文档，不自动收录规格、日志或归档。
 */
export default defineContentConfig({
  collections: {
    docs: defineCollection({ type: 'page', source: '**/*.md' }),
  },
})
