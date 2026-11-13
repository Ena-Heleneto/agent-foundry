import { defineConfig } from 'vite'
// import skillCollectionsPlugin from './build/plugins/collections.js'
// import createDirectoriesPlugin from './build/plugins/create-directories.js'
import vitePluginSkill from '#build/plugins/vite-plugin-skill.plugin'
/**
 * 注册独立目录插件及现有技能资产插件，统一输出到dist。
 * 虚拟入口仅驱动构建流程，不作为文件交付。
 */
export default defineConfig({
  publicDir: false,
  // plugins: [skillCollectionsPlugin(), createDirectoriesPlugin()],
  plugins: [vitePluginSkill()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: 'virtual:skill' },
  },
})
