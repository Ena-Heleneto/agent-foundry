import { defineCollectionHandle } from '#utils/define-collection-handle'

/**
 * 设置 coding 集合参与发布，并声明启用的技能。
 */
export default defineCollectionHandle({
  packageName: 'coding',
  publish: true,
  mcp: false,
  skill: {
    'business-node-delivery': {
      enabled: false,
    },
    'document-changed-symbols': {
      enabled: true,
    },
  },
})
