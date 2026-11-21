import { defineCollectionHandle } from '#utils/define-collection-handle'

export default defineCollectionHandle({
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
