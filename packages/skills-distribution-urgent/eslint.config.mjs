import defineEslintHandler from '@foundry/preset-config/eslint-config'

/**
 * 使用工作区共享检查规则，保留技能正文原字节并沿用原生 Node 测试入口。
 * 构建产物由同版候选验证负责，不重复参与源码格式检查。
 */
export default defineEslintHandler(() => [
  { ignores: ['src/**/*.md', 'dist/**'] },
  {
    files: ['tests/**/*.test.mjs'],
    rules: { 'test/no-import-node-test': 'off' },
  },
])
