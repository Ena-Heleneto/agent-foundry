import { defineCollectionHandle } from '#utils/define-collection-handle'

export default defineCollectionHandle({
  enabled: true,
  packageName: 'profile',
  mcp: false,
  skill: {
    'conversation-recording': { enabled: true },
  },
})
