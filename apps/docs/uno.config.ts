import { defineConfig, presetAttributify, presetTypography, presetWind3 } from 'unocss'

/**
 * 原生组件使用属性化工具，Markdown正文由官方排版预设提供样式。
 */
export default defineConfig({
  presets: [presetWind3(), presetAttributify({ prefix: 'un-' }), presetTypography()],
  theme: { colors: { brand: '#1d4ed8' } },
})
