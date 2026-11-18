# Speckit 挂载脚本生成缺项

记录日期为 2026-11-18，状态为待讨论。范围为 FR-076 的集合子插件加载与 FR-077 的首版 Increment 脚本生成。[技能分发规格](../../spec.md)

## 当前情况

workflow 已配置 `plugin: true` 和 `script: false`。从包内 `src` 实扫得到 5 个启用且具备 `SKILL.md` 的 workflow 技能，其中包含 `task-increment`。挂载子插件当前只声明名称，引擎筛选出 workflow 后返回空插件数组。[集合配置](../../../../../packages/skills/src/workflow/collection.config.ts) · [挂载子插件](../../../../../packages/skills/src/workflow/plugin/vite-plugin-speckit-mount/index.ts) · [引擎](../../../../../packages/skills/build/plugins/vite-plugin-engine/index.ts)

## 待确认问题

1. **技能扫描范围**。现有 `scanSkills()` 接收集合根目录。从 `#src` 扫描后按 `collection === 'workflow'` 筛选可获得名单，直接传入 workflow 目录实测报 `ERR_MODULE_NOT_FOUND`。待确认是否复用整包扫描结果，或增加按集合限定读取的能力。[扫描函数](../../../../../packages/skills/build/utils/scan-skills.ts)
2. **Increment 注册材料**。需要将扫描到的 `task-increment` 映射到 `speckit.modes.increment`，并确定命令文件来源、扩展声明和兼容版本。分发 Spec 默认 Specify `1.2.6`，历史单文件方案以短提示词引用目标项目已安装的技能，并保留字面量 `$ARGUMENTS`。当前仓库的 `modes` 扩展锁定 `==1.4.1.dev0`，命令文件直接使用 `skills/task-increment/SKILL.md`。上一轮建议沿用 `1.2.6` 和短命令入口，待确认。[本地扩展声明](../../../../../.specify/extensions/modes/extension.yml)
3. **无适用技能时的产物规则**。显式关闭 `task-increment` 和启用项缺少 `SKILL.md` 都会使扫描结果缺少该技能。待确认两种情况分别跳过脚本生成还是报错。

## 待办与验收

- **脚本生成**。为 `vite-plugin-speckit-mount` 补齐 `generateBundle`，按选定的技能及注册规则组装扩展声明、命令文件和 Bash，通过 Vite 发出 `script/speckit-mount.sh`。实际产物为 `dist/script/speckit-mount.sh`。使用者运行脚本时才准备临时扩展输入、调用 `specify extension add --dev` 并清理临时目录。
- **引擎加载**。在 Vite 配置期对 `plugin === true` 的集合发现 `plugin/vite-plugin-*/index.ts`、导入入口并调用默认工厂，将结果返回给 Vite。发现顺序及目录边界沿 FR-076。
- **验收**。验证有 Increment 时只产出一个挂载脚本，空结果符合确认后的规则，脚本通过 `bash -n`。用实际 Vite 配置验证子插件被调用及资产路径，构建阶段只生成脚本资产。
