# 整理技能包 package.json 的导入别名

记录日期为 2026-11-18，状态为待处理。

范围为主线技能包的 `imports` 字段。[技能分发规格](../../spec.md) · [技能包 package.json](../../../../../packages/skills/package.json)

## 当前情况

`#src` 用于定位集合源码目录，`#build/*` 和 `#utils/*` 用于导入构建和工具模块，`#package.json` 和 `#install.source.sh` 用于读取文件。`#src/*` 当前仅查到声明，待核实是否需要保留。

## 待办与验收

- 盘点别名的目标和调用点，统一命名与映射方式，按实际用途清理无用映射。重命名或删除时同步处理调用方。
- 验证整理后集合目录、构建和工具模块、包版本和安装脚本来源仍能正确解析。通过 `pnpm --filter @foundry/skills run check-types` 和 `pnpm --filter @foundry/skills run build` 核对类型和构建入口。
