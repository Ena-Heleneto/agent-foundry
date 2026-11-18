import type { PluginOption } from 'vite'
import { lstatSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { scanCollections } from '#utils/scan-skills'

/**
 * 在 Vite 配置加载阶段按稳定顺序加载显式开启插件的集合入口。
 *
 * @param sourceDir 集合来源目录，缺省通过 #src 定位当前包的 src。
 * @returns 子插件工厂的结果，保留嵌套结构交给 Vite 处理。
 * @throws 子插件导入或工厂调用失败时，附带实际入口路径。
 */
export default async function vitePluginEngine(
  sourceDir = fileURLToPath(import.meta.resolve('#src')),
): Promise<PluginOption[]> {
  const enabledCollections = (await scanCollections(sourceDir)).filter(({ config }) => config.plugin === true)

  const plugins: PluginOption[] = []
  for (const { directory } of enabledCollections) {
    const pluginDirectory = join(directory, 'plugin')
    if (!lstatSync(pluginDirectory, { throwIfNoEntry: false })?.isDirectory())
      continue

    const names = readdirSync(pluginDirectory, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name.startsWith('vite-plugin-'))
      .map(entry => entry.name)
      .sort()

    for (const name of names) {
      const entryPath = join(pluginDirectory, name, 'index.ts')
      if (!lstatSync(entryPath, { throwIfNoEntry: false })?.isFile())
        continue

      try {
        const { default: createPlugin }: { default: () => PluginOption } = await import(pathToFileURL(entryPath).href)
        if (typeof createPlugin !== 'function')
          throw new TypeError('默认导出必须是 Vite 插件工厂')
        plugins.push(await createPlugin())
      }
      catch (cause) {
        throw new Error(`加载集合子插件失败：${entryPath}`, { cause })
      }
    }
  }
  return plugins
}
