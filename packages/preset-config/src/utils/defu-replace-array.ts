import { createDefu } from 'defu'

/**
 * 「数组替换版 defu」合并器。
 *
 * 普通对象递归合并、标量用户值优先等维持 defu 原生语义；唯一差异是数组键：
 * 用户值为数组且默认配置同名键也是数组时，以用户数组整体替换默认数组
 * （defu 原生语义为拼接）。需要追加数组元素的场景应使用函数形态 executor
 * 的 `append`，不经本合并器表达。
 */
export const defuReplaceArray = createDefu((object, key, value) => {
  if (Array.isArray(value) && Array.isArray((object as Record<PropertyKey, unknown>)[key as PropertyKey])) {
    ;(object as Record<PropertyKey, unknown>)[key as PropertyKey] = value
    return true
  }
})
