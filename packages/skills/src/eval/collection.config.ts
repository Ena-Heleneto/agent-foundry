import { defineCollectionHandle } from '#utils/define-collection-handle'

/**
 * 评估技能仅用于开发构建，不进入测试发布或生产产物。
 */
export default defineCollectionHandle({
  enabled: mode => mode === 'development',
  packageName: 'eval',
  mcp: false,
  skill: {
    'eval-short-rule': {
      enabled: false,
    },
    'eval-with-reference': {
      enabled: true,
    },
    'eval-workflow-guide': {
      enabled: true,
    },
    'mcp-build-smoke': {
      enabled: true,
    },
  },
})
