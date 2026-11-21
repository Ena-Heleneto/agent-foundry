import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 读取 preset-config 包根目录 package.json 中的依赖声明。
 *
 * 注意路径相对本文件上溯两级定位包根：Vite 打包配置文件后 import.meta.dirname
 * 仍指向本源码所在目录（build/handle），而非包根。
 *
 * @returns 含 dependencies 与 peerDependencies 的对象，供构建 external 配置使用。
 */
export function readDependencies(): { dependencies?: Record<string, string>, peerDependencies?: Record<string, string> } {
  const packageJson = readFileSync(resolve(import.meta.dirname, '../../package.json'), 'utf-8')
  return JSON.parse(packageJson)
}
