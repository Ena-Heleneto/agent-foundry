import { defineCollectionHandle } from '#utils/define-collection-handle'

/**
 * 交付独立的会话记录 Skill，供项目按会话归属和触发规则使用。
 */
export default defineCollectionHandle({
  enabled: true,
  packageName: 'profile',
  mcp: false,
  skill: {
    'conversation-recording': { enabled: true },
  },
})
