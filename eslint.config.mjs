import defineEslintHandler from '@foundry/preset-config/eslint-config'

/**
 * 根目录沿用共享检查规则，历史证据及第三方测试夹具保持原字节。
 */
export default defineEslintHandler(() => [{ ignores: ['specs/**', '**/tests/fixtures/**', '.agents/**'] }])
