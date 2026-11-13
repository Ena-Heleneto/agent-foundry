import type antfu from '@antfu/eslint-config'

/**
 * 原配置工厂的可选追加接口和严格返回类型。
 */
export default function defineEslintHandler(next?: () => Parameters<ReturnType<typeof antfu>['append']>[0]): ReturnType<typeof antfu>
