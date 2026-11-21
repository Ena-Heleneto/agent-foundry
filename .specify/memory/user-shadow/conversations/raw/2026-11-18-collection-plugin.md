# 本轮任务原文：集合 plugin 开关

本地会话定位：2026-11-18-collection-plugin；宿主会话及消息 ID 不可得。首条任务被用户中断后再次提交，两条分别保留，不按文字相似去重。仅保存当前可见任务发言及已发出过程说明；先前其他会话、用户提供的工程约定与环境元数据未复制，存在覆盖缺口。当前未发出的最终答复不在范围内。

## M01

日期：2026-11-18；角色：用户；顺序：1；来源：本轮可见任务对话。

```text
@packages/skills/utils/define-collection-handle.ts 添加一个 plugin参数，属性是boolean，默认为false，为true是vite插件引擎扫描集合中plugin目录下的插件
```

## M02

日期：2026-11-18；角色：用户；顺序：2；来源：本轮可见任务对话。

```text
@packages/skills/utils/define-collection-handle.ts 添加一个 plugin参数，属性是boolean，默认为false，为true是vite插件引擎扫描集合中plugin目录下的插件 specs/skills/001-skills-distribution
```

## M03

日期：2026-11-18；角色：助手；顺序：3；来源：本轮可见任务对话。

```text
我会按 `using-superpowers` 和 `brainstorming` 技能先核对现有实现与规格。这次需求很明确：新增默认 `false` 的 `plugin` 开关，并让引擎只扫描显式开启集合的 `plugin` 目录；我会保留当前未提交改动，只修改相关部分。
```

## M04

日期：2026-11-18；角色：助手；顺序：4；来源：本轮可见任务对话。

```text
现有规格写的是“存在就自动加载”，目录名也是 `plugins/`，与这次要求不同。我会改为 `plugin?: boolean`、默认 `false`，开启后扫描单数 `plugin/` 目录。正式引擎入口目前为空，我会补上这部分扫描并接入 Vite，其他脚本插件的迁移保持现状。代码注释和验证会遵循 `document-changed-symbols`、`test-driven-development` 与 `verification-before-completion`。
```

## M05

日期：2026-11-18；角色：助手；顺序：5；来源：本轮可见任务对话。

```text
基线类型检查通过。现有 Python 测试有 3 项失败，均因缺少 `script/register-commands/register-commands.sh`，与本次改动无关。新增引擎测试也已确认因正式入口尚未实现而失败；接下来实现扫描，再验证开关行为和真实 Vite 构建。
```

## M06

日期：2026-11-18；角色：助手；顺序：6；来源：本轮可见任务对话。

```text
新增的 5 项测试已通过，覆盖默认关闭、显式开启、目录边界、稳定排序、真实 Vite 构建和坏插件报错；类型检查、定向 ESLint 和包构建也已通过。规格已同步开关及单数目录约定。Markdown 的 `eslint --fix` 已执行，但文件被仓库现有规则忽略，因此不计为 lint 通过。
```

## M07

日期：2026-11-18；角色：助手；顺序：7；来源：本轮可见任务对话。

```text
我会同时按项目已启用的 `shadow-profile` 技能保存本轮任务对话，仅记录可核对的内容，不新增个人偏好结论。
```
