// {
//   "packageName": null,
//   "mcp": false,
//   "skill": {
//     "nuxt-ui-styling": {},
//     "vue-reactivity": {}
//   }
// }

import { defineCollectionHandle } from '#utils/define-collection-handle'

export default defineCollectionHandle({
  packageName: 'frontend',
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
