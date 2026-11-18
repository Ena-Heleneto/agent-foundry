import type { Plugin } from 'vite'

/**
 * 提供工作流集合的 Speckit 挂载插件入口。
 *
 * @returns 仅声明名称的 Vite 插件。
 */
export default function vitePluginSpeckitMount(): Plugin {
  return { name: 'vite-plugin-speckit-mount' }
}
