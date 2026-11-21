# 已装内容核验与工作流挂载

本模块是唯一 Node 入口内部调用的 Bash 第二步。它不新增对外 mount 命令，不执行技能安装或业务实现；仅支持 Linux x86_64/Codex 项目级。使用者先按官方预检建议完成复制安装，再按相同来源、版本、显式技能和项目普通调用 `node script/index.mjs [参数]`。

运行时每次在线读取官方 skills latest 的真实 Codex 路径规则。读取同版 `release.json` 后，核验身份投影、所选依赖、全部运行脚本/集中配置和已装正文/附件的完整文件集合与字节摘要。缺件、错版、额外文件、链接、未知修改或未明确补选的依赖均拒绝；不覆盖目标、不写自有收据、不从历史目录补选。

同版集中配置位于 `script/config/<集合>/collection.config.json`。所选 hook 由官方 Specify 1.2.6 的临时 hooks-only 扩展注册；全部所选 hooks 成功或明确不适用后，才允许注册本次选择的 Increment。任一 hook 失败时保留安装与完整性成功事实，Increment 为 not-run，不能通过重试抹去前面已经成功的 hook。

普通 coding/frontend 技能没有适用工作流时报告不适用；非 Spec Kit 项目不会被自动初始化，也不能拿该结果抵扣必需的 Spec Kit 挂载验收。正式 Increment 使用单一薄入口消费完整 `task-increment` 一次，源正文保持原字节。实际宿主完整加载与单次执行证据另由真实 Codex 会话取得。

需要预先准备 Node ≥22.20.0、Bash、tar、curl、GNU 文件工具、jq 1.8.1，以及工作流挂载所需 uvx/指定版本官方 CLI。运行时不自动下载 jq 或安装依赖。`FOUNDRY_JQ` 可指向已有 jq；`FOUNDRY_DOWNLOAD_TIMEOUT` 控制正整数秒超时。

stdout 是独立记录 installation、integrity、hooks、commands、旧入口和 loading 事实的 JSON；诊断与官方输出写 stderr。success/failed/not-run 分阶段报告，loading 未有真实会话证据时始终 not-run。临时目录仅清理本次拥有的内容，不承诺跨文件原子回滚。
