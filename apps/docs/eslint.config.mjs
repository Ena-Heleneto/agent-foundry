import defineEslintHandler from '@foundry/preset-config/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

/**
 * Nuxt生成规则在工作区统一检查基线上追加。
 */
export default withNuxt(defineEslintHandler())
