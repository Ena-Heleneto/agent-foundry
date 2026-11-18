import type { PluginOption } from 'vite'
import { fileURLToPath } from 'node:url'
import { scanCollections } from '#build/utils/scan-skills'

/**
 * 在 Vite 配置加载阶段筛选显式开启插件的集合。
 *
 * @param sourceDir 集合来源目录，缺省通过 #src 定位当前包的 src。
 * @returns 当前集合扫描阶段的空插件列表。
 */
export default async function vitePluginEngine(
  sourceDir = fileURLToPath(import.meta.resolve('#src')),
): Promise<PluginOption[]> {
  const enabledCollections = (await scanCollections(sourceDir)).filter(({ config }) => config.plugin === true)
  return enabledCollections.flatMap(() => [])
}
