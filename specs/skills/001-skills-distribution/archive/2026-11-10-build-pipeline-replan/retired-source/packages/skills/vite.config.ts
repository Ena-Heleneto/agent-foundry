import { defineConfig } from 'vite'
import { SkillsContentPlugin } from './build/plugins/content.js'
import { SkillsDistributionPlugin } from './build/plugins/distribution.js'
import { McpManifestPlugin } from './build/plugins/mcp-manifest.js'
import { SkillsScriptsPlugin } from './build/plugins/scripts.js'

/**
 * 一次构建全部 MCP 内容、线下技能和安装脚本，分别输出到 dist 的对应目录。
 * MCP 清单由源文件自动生成到 dist/mcp，旧根清单与内部入口文件不再输出。
 * 分发插件同时输出稳定内容的正式格式开发清单和投影，不执行运行脚本。
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    lib: {
      entry: { index: SkillsContentPlugin.entry },
      formats: ['es'],
    },
    rollupOptions: {
      input: { index: SkillsContentPlugin.entry },
      output: { entryFileNames: '[name].js' },
    },
  },
  plugins: [new SkillsContentPlugin(), new SkillsScriptsPlugin(), new McpManifestPlugin(), new SkillsDistributionPlugin()],
})
