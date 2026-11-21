import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 扫描 src 目录，将每个包含 index.ts 的预设子目录识别为一个构建入口。
 *
 * Vite 打包配置文件后 import.meta.dirname 仍指向本源码所在目录（build/handle），
 * 需上溯两级定位包根后再进入 src。
 *
 * @returns 入口名（预设目录名）到入口文件绝对路径的映射。
 */
export function resolveEntries(): Record<string, string> {
  const srcRoot = resolve(import.meta.dirname, '../../src')
  return Object.fromEntries(
    readdirSync(srcRoot)
      .filter(name => statSync(resolve(srcRoot, name)).isDirectory())
      .filter((name) => {
        try {
          return statSync(resolve(srcRoot, name, 'index.ts')).isFile()
        }
        catch {
          return false
        }
      })
      .map(name => [name, resolve(srcRoot, name, 'index.ts')]),
  )
}
