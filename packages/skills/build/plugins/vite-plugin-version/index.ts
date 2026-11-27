import type { Plugin } from 'vite'
import moment from 'moment'
import { readPackageVersion } from '#build/utils/read-package-version'

/**
 * 在构建时交付当前包版本和当次构建的发布时间戳。
 *
 * @returns 仅在构建时运行的版本插件。
 */
export default function vitePluginVersion(): Plugin {
  /**
   * 每次解析构建配置时确定，同次的各输出共用该值。
   */
  let releaseTimestamp: string
  return {
    name: 'vite-plugin-version',
    apply: 'build',
    /**
     * 在构建开始时取一次当前 UTC 时间并保留三位毫秒。
     */
    configResolved() {
      releaseTimestamp = moment.utc().locale('en').format('YYYYMMDD[T]HHmmssSSS[Z]')
    },
    /**
     * 将两个版本字段作为 UTF-8 JSON 资产交付，使用 LF 结尾。
     */
    async generateBundle() {
      /**
       * 包版本来自实际参与构建的源码清单。
       */
      const packageVersion = await readPackageVersion()
      this.emitFile({ type: 'asset', fileName: 'VERSION', source: `${JSON.stringify({ packageVersion, releaseTimestamp })}\n` })
    },
  }
}
