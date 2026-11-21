# Phase 3 子任务规则消费：实施与续接记录

日期：2026-10-31。对应 T035～T038。T035～T037 已完成；T038 真实行为验收未完成，不代表 Phase 3 已验收。

## 已完成工作与实际证据

- 三个模式的公共子任务字段、目录与状态规范改为读取项目根目录宪章 VII；保留其他工具兼容、Tutor 教学、Pair 局部授权、Review 双审批。AGENTS 和包说明支持普通对话请求拆分，不新增子任务 Skill。
- 原有 4 项测试先通过；新增源码及真实 MCP 交付的宪章引用可达性检查后，6 项测试出现 6 个预期子场景失败，均因缺少显式引用。修订并构建后 6 项全部通过。引用检查不作为真实拆分行为证据。
- 使用本机 pnpm 12.9.1 执行 skills lint、check-types、build、test，均退出 0。实际路径为 /home/by152/.local/share/mise/installs/pnpm/12.9.1/pnpm，各命令带 --config.verifyDepsBeforeRun=false。
- 使用已有缓存 specify-cli 1.2.5（PATH 无 specify），执行官方 extension add --dev packages/skills --force 成功。实际入口为 /home/by152/.cache/uv/archive-v0/82eppdF6KvSzpon2/bin/specify。首次因 .agents 只读失败，经权限机制重试成功；未手改受管入口。list 确认 modes 1.0.0 Enabled、Commands 3、Hooks 0。
- 通过现有 link-skills.sh 更新通用 task-_副本，首次更新 3 项、跳过 14 项。独立审查修正后再次安装并同步，更新 2 项、跳过 15 项。三个源、安装副本及通用副本逐字一致，三个 speckit-modes-_ 入口均包含源正文。
- 10 份原生核心文件 hash 不变；用户原有四份 integration/init 元数据字节不变。.registry 仅由官方 CLI 更新 modes.installed_at 及 registered_skills（置空）；三个命令仍在 registered_commands.codex，实际生成入口存在。独立审查核对 CLI 源码确认该登记方式有效，无须手工恢复数组。
- Markdown 均在修改后执行 ESLint；技能源使用 --no-ignore；git diff --check 通过。未修改 TS/JS/Vue，Python 测试使用中文 docstring。

## 独立审查及修正

只读审查发现 Tutor/Pair 的非 Spec Kit 保存失败保护被过度简化：其他项目可能没有恢复治理。已在非 Spec Kit 分支补回报告已写/未写、保留用户修改、重试并读回、恢复前冻结新步骤及完成更新。Spec Kit 仍只消费宪章。

修正后重新运行包 lint/check-types/build/test 均通过，并重新官方安装和同步。独立只读消费探测分别处理导师保存失败、结对部分写入及用户修改两种假设情境，均选择保留现场、暂停推进并核对恢复；这是指令消费探测，不是实际文件故障、真实任务拆分或用户学习证据。

## 限制与尚未执行

- T038 尚无用户选定的原 Spec/Task，未创建任务副本或虚假子任务。普通对话拆分、Tutor 学习形式、原要求覆盖、实际保存失败、无效链接与重复请求尚未完成真实行为验收；T038 保持未勾选。下一步需用户指定实际任务及适用学习环节，才能在原任务继续。
- 三个 quick_validate.py 实际均退出 1，原因是仓库既有 destructive frontmatter 字段不在该验证器白名单；未修改清单契约。官方扩展安装和本仓库真实构建/MCP 检查通过，不能称官方技能验证器通过。
- 构建仍有既有 Vite 配置导入缺扩展名提示。未运行 PowerShell 平台检查或 Mermaid 图形渲染，本轮未改平台脚本。
- 未执行数据库写入、发布、部署、提交或推送，未进入 Phase 4。

## 续接

T035～T037 不必重复实施；继续 T038 前先读本记录、任务八栏目及当前源/实际入口。子任务公共规则仅在宪章 VII。当前用户尚未回复异步提出的真实任务选择问题；不能凭示例自行创建页面工程任务。
