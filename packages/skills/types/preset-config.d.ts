/**
 * @foundry/preset-config 的 dist 产物未携带 .d.ts 声明，消费方在 strict 模式下
 * 会得到 TS7016；此处为 packages/skills 实际使用到的子路径补模块声明。
 */
declare module '@foundry/preset-config/eslint-config' {
  /**
   * 共享 ESLint 预设工厂（antfu 系）
   * @param _next 可选 thunk，返回共享工厂实际支持的单项或多项 flat config
   * @returns 可由 ESLint 等待解析的 flat config 数组
   */
  export default function defineEslintHandler(
    _next?: () => Record<string, unknown> | Record<string, unknown>[],
  ): PromiseLike<unknown[]>
}
