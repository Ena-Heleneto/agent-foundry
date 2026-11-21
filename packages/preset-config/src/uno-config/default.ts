import type { UserConfig } from 'unocss'
import { dirname } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import {
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

/**
 * 组装 uno-config 预设的完整默认配置：空 shortcuts 集合、五个默认 preset
 * （wind4、attributify、icons scale 1.2、typography、DM 系列 web-fonts）与两个默认
 * transformer（directives、variant-group）。
 *
 * 本地字体处理器的 `cwd` 在本函数执行期间就地求值：取调用栈中首个非本模块、
 * 非 node_modules 加载器内部的文件帧（兼容 jiti 加载配置时产生的裸路径帧）所在目录，
 * 使字体文件落盘到消费方包目录，解析失败回退 `process.cwd()`；
 * 该求值不能延后（字体下载时调用方帧已出栈），故默认配置只能以函数形式导出。
 *
 * @returns 完整默认 UnoCSS 配置。
 */
export function buildDefaults(): UserConfig {
  return {
    shortcuts: {},
    presets: [
      presetWind4(),
      presetAttributify(),
      presetIcons({ scale: 1.2 }),
      presetTypography(),
      presetWebFonts({
        fonts: { sans: 'DM Sans', serif: 'DM Serif Display', mono: 'DM Mono' },
        processors: createLocalFontProcessor({
          cwd: (() => {
            const selfDir = dirname(fileURLToPath(import.meta.url))
            const callerPath = new Error('resolveConsumerRoot callsite').stack?.split('\n').map(line => /(?:file:\/\/)?(\/[^)\s]+?\.[cm]?[jt]s):\d+:\d+/.exec(line)?.[1]).find(path => path !== undefined && !path.startsWith(selfDir) && !path.includes('/node_modules/'))
            return callerPath ? dirname(callerPath) : process.cwd()
          })(),
        }),
      }),
    ],
    transformers: [transformerDirectives(), transformerVariantGroup()],
  }
}
