import type { Plugin, ResolvedConfig } from 'vite'
// import type { HookHandler, Plugin, ResolvedConfig } from 'vite'
// import { Buffer } from 'node:buffer'
// import fs from 'node:fs'
// import path from 'node:path'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

function handleConfigResolved(config: ResolvedConfig) {
  const { root } = config
  const sourceDir = join(root, 'src')
  return readdirSync(sourceDir, { withFileTypes: true })
    .filter(entry => !entry.isSymbolicLink())
    .filter(entry => entry.isDirectory())
    .map(entry => ({ name: entry.name, path: join(sourceDir, entry.name) }))
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
}

function handleBuildStart() {}

/**
 * 独立读取集合技能并交付原始资产，目录创建由目录插件负责。
 * 专用脚本、发布和清单生成不属于本插件。
 *
 * - withFileTypes: true：返回带有名称和类型的目录条目。
 * - isDirectory()：筛选子目录，过滤普通文件。
 * - entry.name：取得目录名称。
 * - join(sourceDir, entry.name)：取得对应完整路径。
 */
export default function skillCollectionsPlugin(): Plugin {
  // const _SRC_DIR = 'src'

  const _plugin: Plugin = {
    name: 'foundry:skill-collections',
    apply: 'build',
    api: {},
    // configResolved: handleConfigResolved,
    buildStart: handleBuildStart,

    // resolveId: id => id === entryId ? resolvedEntryId : undefined,
    // load: id => id === resolvedEntryId ? 'export {}' : undefined,
    // buildStart: emitAssets,
    // generateBundle: removeInternalEntry,
  }

  return _plugin
}
