import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import { minifyShellScript } from '#build/utils/minify-shell-script'

export default function vitePluginCurl(): Plugin {
  return {
    name: 'vite-plugin-curl',
    apply: 'build',

    async generateBundle() {
      const source = await readFile(new URL(import.meta.resolve('#install.source.sh')), 'utf8')
      this.emitFile({ type: 'asset', fileName: 'curl/install.sh', source: minifyShellScript(source) })
    },
  }
}
