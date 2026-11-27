import { defineConfig } from 'vite'
import { readDependencies } from './build/handle/readDependencies.handle'
import { resolveEntries } from './build/handle/resolveEntries.handle'
import { copyJsonAssets } from './build/plugin/copyJsonAssets.plugin'

const { dependencies, peerDependencies } = readDependencies()

/**
 * 声明为依赖的包名清单，用于构建期 external 判定。
 */
const externalPackages = [...Object.keys(dependencies ?? {}), ...Object.keys(peerDependencies ?? {})]

export default defineConfig({
  plugins: [copyJsonAssets()],
  build: {
    lib: {
      entry: resolveEntries(),
      formats: ['es'],
    },
    rollupOptions: {
      external: (id: string) =>
        id.startsWith('node:') || externalPackages.some(pkg => id === pkg || id.startsWith(`${pkg}/`)),
      output: {
        entryFileNames: '[name]/index.js',
      },
    },
  },
})
