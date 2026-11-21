import type { Plugin } from 'vite'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 构建结束后将 src 下各预设目录根级的 JSON 资产复制到 dist 对应子目录。
 *
 * 数据型预设（如 tsconfig-json）没有 JS 入口，其 .json 文件经此插件随 dist 分发，
 * 与 exports 的 ".\/*.json": "./dist/*.json" 通用映射配合对外解析。
 * import.meta.dirname 指向本源码所在目录（build/plugin），需上溯两级定位包根。
 *
 * @returns 执行 JSON 资产复制的 Vite 插件。
 */
export function copyJsonAssets(): Plugin {
  const packageRoot = resolve(import.meta.dirname, '../..')
  const plugin: Plugin = {
    name: 'copy-json-assets',
    closeBundle() {
      const srcRoot = resolve(packageRoot, 'src')
      for (const name of readdirSync(srcRoot)) {
        const dir = resolve(srcRoot, name)
        if (!statSync(dir).isDirectory())
          continue
        const jsonFiles = readdirSync(dir).filter(file => file.endsWith('.json'))
        if (jsonFiles.length === 0)
          continue
        mkdirSync(resolve(packageRoot, 'dist', name), { recursive: true })
        for (const file of jsonFiles) {
          copyFileSync(resolve(dir, file), resolve(packageRoot, 'dist', name, file))
        }
      }
    },
  }
  return plugin
}
