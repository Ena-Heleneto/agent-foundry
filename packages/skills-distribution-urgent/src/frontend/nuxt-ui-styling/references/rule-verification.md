# 规则生效验证

仅通过语法检查不代表样式真实生效。凡新增或修改样式写法，都必须验证规则被真实生成、真实作用于元素。写了不验视为未完成。

## 1. 写前查证

不确定某个 utility、shortcut、variant 是否存在时，先查 `uno.config`、项目 presets/shortcuts 配置或 UnoCSS 官方文档，确认后再书写。同时确认 `presetAttributify()` 的前缀配置（缺省 `un-`），见 `attribute-conflicts.md`。

## 2. 写后验证生成

构建后 grep 产物 CSS，确认对应选择器规则真实生成。以缺省前缀 `un-` 为例：

```sh
grep -ro '\[un-text~=' apps/playground/.output/public/_nuxt/*.css
```

项目配置了其它前缀时，将 `un-` 替换为实际前缀（如 `\[u-text~=`）。

找不到生成规则即视为样式未生效，必须排查写法。常见原因：

- 属性与组件 prop / 原生属性冲突但未加属性化前缀；
- utility / shortcut 不存在（臆造）；
- 源码未被 UnoCSS 扫描覆盖（content 配置遗漏）。

## 3. 必要时运行时验证

dev 模式下检查元素计算样式，确认规则优先级未被覆盖。
