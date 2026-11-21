# MVU-A：共享持久化骨架验收

后续迁移说明：用户已指定新增脚本改用 Python。本文件保留 Node 版历史验收事实；当前入口与重新验证结论见 [Python 迁移验收](python-migration.md)。

日期：2026-10-30。来源：本功能 T003/T004、contracts/workflow.md、data-model.md。验证等级：agent-execution / verified；不表示用户已验收 Phase 2。

## 待验证假设与结论

本地单父任务状态在失败、重试和并发冲突下保持真实进度。T004 完成时骨架通过 23 项 Node 行为断言；T005 增量交接及审查修正后状态测试 28 项、集成测试 4 项全部通过，最终证据见 [MVU-B](mvu-b.md)。支持 initialize 与 read/check/commit/recover，后续业务 action 尚未实现时明确拒绝。Tutor/Pair 实体仍为 null，完整模式业务分别留给所属故事；本阶段不以初始化成功宣称教学或结对已实现。

## 红灯与绿灯

- T003 首次有效红灯：`node --test --test-isolation=none --test-reporter=tap packages/skills/tests/workflow-state.test.mjs`，21 项均因缺少真实 helper 失败，非语法或安装错误。记录保存在本次会话 `/tmp/workflow-state-red.log`，临时日志可能清理。
- T004 完整绿灯：`node --test --test-reporter=tap packages/skills/tests/workflow-state.test.mjs`，23/23，退出 0；本次输出 `/tmp/workflow-state-t004.log`。
- 补充恢复请求改绑与可解析结构损坏反例；结构损坏首次错误返回 2，修正为拒绝读写并返回 4，针对性两项回归通过。
- Node runner 的 import 被共享 ESLint 自动改成 Vitest，定位后仅在导入行豁免 `test/no-import-node-test` 并说明契约依据，不新增依赖，不修改全局规则。

## 实际断言

- read 无状态返回 null、revision=0，不创建状态目录；首次 initialize 产生 revision=1，稳定分配 T001-S0001，不修改父任务勾选。
- 同 ID 同内容返回原回执、仅一份材料；同 ID 异内容返回 3；两个不同初始化并发只有一方提交。
- 四类真实 IO 边界：归档创建前、完整归档写入后、state.json 替换前、替换后响应丢失。使用 Node test mock 只拦截文件系统边界，底层使用真实临时文件，生产 helper 无故障注入开关。
- 提交点前失败权威 revision 保持 0；替换后响应丢失读回 revision=1。失败保留锁，新操作不能推进；存活进程的锁不允许人工声明后强抢；绑定已结束进程的锁内容与原请求后恢复，最终仅一份回执/归档。
- 空验收、未知字段/嵌套键、未知 action、错误 revision/版本、跨父依赖拒绝；同路径异内容保留旧字节；坏 JSON 与结构损坏不初始化覆盖。
- 合法 checkbox 与 Task 外进度更新可恢复；描述、依赖、验收变更拒绝静默续用；重复 Task、缺八栏目拒绝。
- 绝对路径、逃逸路径、跨 Spec、权威状态材料路径与软链接拒绝；Markdown hash 或目标路径格式固定点不符时零材料写入。
- CLI 实际子进程验证单个 JSON、read=0、非法选项/缺 request=2。

## 工程验证与限制

`pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`、对应 `check-types`、`build` 均退出 0。Vite 保留既有缺扩展名提示，未修改构建器。tsc 检查现有 TS 配置，JS 运行语义由 Node 测试负责。

沙箱内 Node spawnSync 返回 EPERM 且 status=0、stdout 为空，已通过最小子进程复现；有效完整测试经执行工具批准在沙箱外运行。helper 对子进程 error 显式报错，不将空输出当格式通过。pnpm 命令关闭执行前自动安装检查，避免验证隐式安装依赖，不改变仓库配置。

T004 完成时 43 个受保护基线文件全部保持原 hash；最终同期安装元数据变化及保留处理见 [MVU-B](mvu-b.md) 的「安装记录的同期变化」，不将阶段早期快照当最终结果。未运行真实工作区挂载/钩子注册、发布或 Git 提交；骨架已保留，T005 在其上增量增加交接。跨文件断电事务、网络盘、分布式锁及完整 Tutor/Pair 生命周期尚未验证，不作可靠性承诺。
