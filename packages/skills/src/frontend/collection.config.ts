import { defineCollectionHandle } from '#utils/define-collection-handle'

/**
 * 设置 frontend 集合参与发布，并声明启用的技能。
 */
export default defineCollectionHandle({
  packageName: 'frontend',
  publish: true,
  mcp: false,
  skill: {
    'nuxt-ui-styling': {
      enabled: true,
    },
    'vue-reactivity': {
      enabled: true,
    },
  },
})
