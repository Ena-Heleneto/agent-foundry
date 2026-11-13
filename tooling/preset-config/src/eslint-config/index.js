import antfu from '@antfu/eslint-config'

/**
 * 复用原工程的追加配置协议，并显式启用此monorepo需要的Vue规则。
 * @param {() => Parameters<ReturnType<typeof antfu>['append']>[0]} [next] 消费方配置。
 * @returns {ReturnType<typeof antfu>} 完整规则配置。
 */
export default function defineEslintHandler(next) {
  return next
    ? antfu({ vue: true, unocss: true, formatters: true, pnpm: true, isInEditor: false, antislop: true }).append(next())
    : antfu({ vue: true, unocss: true, formatters: true, pnpm: true, isInEditor: false, antislop: true })
}
