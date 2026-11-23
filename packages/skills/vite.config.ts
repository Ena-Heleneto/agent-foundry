import { defineConfig } from 'vite'
import vitePluginCurl from '#build/plugins/vite-plugin-curl/index'
import vitePluginEngine from '#build/plugins/vite-plugin-engine/index'
import vitePluginSkill from '#build/plugins/vite-plugin-skill/index'
import vitePluginVersion from '#build/plugins/vite-plugin-version/index'
/**
 * 注册技能、curl、统一版本插件及集合插件引擎，统一输出到 dist。
 * 复用技能虚拟入口驱动构建，不交付占位 JS 文件。
 * 发布模式按集合配置加载参与发布的子插件。
 */
export default defineConfig(({ mode }) => ({
  publicDir: false,
  // plugins: [skillCollectionsPlugin(), createDirectoriesPlugin()],
  plugins: [vitePluginSkill(), vitePluginCurl(), vitePluginVersion(), vitePluginEngine(mode === 'release')],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: ['virtual:skill'] },
  },
}))
