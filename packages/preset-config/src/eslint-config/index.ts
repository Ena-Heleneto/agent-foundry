import antfu from '@antfu/eslint-config'

type NextConfigInput = Parameters<ReturnType<typeof antfu>['append']>[0]

export default function defineEslintHandler(_next?: () => NextConfigInput): ReturnType<typeof antfu> {
  return _next
    ? antfu({ unocss: true, formatters: true, pnpm: true, isInEditor: false, antislop: true })
        .append(_next())
    : antfu({ unocss: true, formatters: true, pnpm: true, isInEditor: false, antislop: true })
}
