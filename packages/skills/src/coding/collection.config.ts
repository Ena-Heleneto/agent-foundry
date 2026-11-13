import { defineCollectionHandle } from '#utils/define-collection-handle'

export default defineCollectionHandle({
  packageName: 'coding',
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
