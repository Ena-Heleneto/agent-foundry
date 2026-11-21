import { defineCollectionHandle } from '#utils/define-collection-handle'

/**
 * 旧影子画像退役后的 profile 集合，等待新流程按各自验收启用。
 */
export default defineCollectionHandle({
  packageName: 'profile',
  mcp: false,
  skill: {},
})
