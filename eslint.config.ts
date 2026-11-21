import defineEslintHandler from '@foundry/preset-config/eslint-config'

/**
 * 根目录通过预设子包的公开入口加载共享规则，历史证据及第三方测试夹具保持原字节。
 */
export default defineEslintHandler(() => [{ ignores: ['specs/**', '**/tests/fixtures/**', '.agents/**'] }])
