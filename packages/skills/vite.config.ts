import { defineConfig } from 'vite'
import vitePluginCurl from '#build/plugins/vite-plugin-curl/index'
import vitePluginSkill from '#build/plugins/vite-plugin-skill/index'
/**
 * 注册独立目录插件及现有技能资产插件，统一输出到dist。
 * 虚拟入口仅驱动构建流程，不作为文件交付。
 */
export default defineConfig({
  publicDir: false,
  // plugins: [skillCollectionsPlugin(), createDirectoriesPlugin()],
  plugins: [vitePluginSkill(), vitePluginCurl()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: ['virtual:skill', 'virtual:curl'] },
  },
})
