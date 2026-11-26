import type { Plugin } from 'vite'
import { readPackageVersion } from '#build/utils/read-package-version'

/**
 * 在构建生成阶段交付统一版本文件 VERSION，内容来自当前包的版本声明。
 *
 * @returns 仅在构建时运行的版本插件。
 */
export default function vitePluginVersion(): Plugin {
  return {
    name: 'vite-plugin-version',
    apply: 'build',
    async generateBundle() {
      const version = await readPackageVersion()
      this.emitFile({ type: 'asset', fileName: 'VERSION', source: `${version}\n` })
    },
  }
}
