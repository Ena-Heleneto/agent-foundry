import defineEslintHandler from '@foundry/preset-config/eslint-config'

/**
 * 保留技能 Markdown 提示词与构建产物的忽略规则，
 * 让源码中的脚本和包内测试接受共享 ESLint 检查；原字节第三方夹具不参与格式改写。
 * 分发契约由既有 Node 测试入口执行，禁止格式修复将其改写为未使用的 Vitest。
 */
export default defineEslintHandler(() => [
  { ignores: ['src/**/*.md', 'dist/**', 'tests/fixtures/**'] },
  {
    files: ['tests/distribution/*.test.mjs'],
    rules: { 'test/no-import-node-test': 'off' },
  },
])
