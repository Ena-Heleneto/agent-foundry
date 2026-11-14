import { defineCollectionHandle } from '#utils/define-collection-handle'

export default defineCollectionHandle({
  packageName: 'profile',
  mcp: false,
  skill: {
    'shadow-profile': {
      enabled: true,
    },
  },
})
