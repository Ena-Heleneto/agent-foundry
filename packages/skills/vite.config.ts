import { defineConfig } from 'vite'
import vitePluginCurl from '#build/plugins/vite-plugin-curl/index'
import vitePluginSkill from '#build/plugins/vite-plugin-skill/index'
import vitePluginVersion from '#build/plugins/vite-plugin-version/index'
/**
 * 注册技能、curl 和统一版本插件，统一输出到dist。
 * 虚拟入口仅驱动构建流程，不作为文件交付。
 */
export default defineConfig({
  publicDir: false,
  // plugins: [skillCollectionsPlugin(), createDirectoriesPlugin()],
  plugins: [vitePluginSkill(), vitePluginCurl(), vitePluginVersion()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: ['virtual:skill', 'virtual:curl'] },
  },
})
