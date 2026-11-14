import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'

export default function vitePluginCurl(): Plugin {
  const virtualId = 'virtual:curl'
  const resolvedId = `\0${virtualId}`
  return {
    name: 'vite-plugin-curl',
    apply: 'build',
    resolveId(id) {
      if (id === virtualId)
        return resolvedId
    },
    load(id) {
      if (id === resolvedId)
        return 'export {}'
    },
    async generateBundle(_options, _bundle) {
      // this.emitFile({ type: 'asset', fileName: 'curl/install.sh', source: '#!/usr/bin/env bash\n' })

      const source = await readFile(new URL('./install.source.sh', import.meta.url))
      this.emitFile({ type: 'asset', fileName: 'curl/install.sh', source })
    },
    async writeBundle() {
      // 1. 检查运行环境。
      // 2. 下载同版安装器到临时目录。
      // 3. 校验下载内容。
      // 4. 调用现有 script/index.mjs，透传参数并清理临时文件。
    },
  }
}
