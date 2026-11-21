import { defineConfig } from 'vite'
import { SkillsContentPlugin } from './build/plugins/content.js'

/**
 * 独立工程唯一构建入口；技能与运行脚本只作为原始资产交付。
 * 通过插件虚拟入口驱动Vite，不生成业务JavaScript包。
 */
export default defineConfig({
  publicDir: false,
  plugins: [new SkillsContentPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: SkillsContentPlugin.entry },
  },
})
