import type { Plugin } from 'vite'

export default function vitePluginCurl(): Plugin {
  const virtualId = 'virtual:curl'
  const resolvedId = `\0${virtualId}`
  return {
    name: 'vite-plugin-curl',
    apply: 'build',
    config: () => ({ build: { rolldownOptions: { input: { installer: virtualId } } } }),
    resolveId(id) {
      if (id === virtualId)
        return resolvedId
    },
    generateBundle(_options, bundle) {
      Object.entries(bundle).forEach(([fileName, output]) => {
        if (output.type === 'chunk' && output.isEntry && output.facadeModuleId === resolvedId) {
          delete bundle[fileName]

          if (output.sourcemapFileName)
            delete bundle[output.sourcemapFileName]
        }
      })
    },
    async writeBundle() {
    },
  }
}
