# T095：来源分离、官方生成与实际发现

日期：2026-11-11。对应[原 T095](../../tasks.md#t095)、[本 Task 方案](../../implementation/T095.md)、[注册契约](../../contracts/registration.md)与 TV-08。用户在得知来源分离、正常发现、附件及缺源/冲突保护范围后回复「开始吧」，本轮只验证隔离骨架，不修改生产安装器或真实用户全局技能。

## 来源安装与生成是不同步骤

正式来源为 packages/skills/src/workflow/task-increment 和 implementation-preparation，独立 coding 使用 src/coding/business-node-delivery；三者正文及附件完整集合按实际文件核对。当前 Increment 与准备均为单文件来源，附件行为另用标识测试副本，不修改生产正文或恢复暂停模式。

所选实际工具为 Specify 1.2.6、skills 1.7.4、codex-cli 0.167.1。每个正向项目经官方离线 init 的 Codex skills 选项初始化，init-options 由官方生成。skills 本地 add 实际完成安装，之后测试候选只将 task-increment 精确归位到官方技能根追加 -speckit-sources 的同级目录；准备及独立 coding 留在正常根。全局作用域只指自有测试用户，正式 Increment 仍在明确的目标项目由 Specify 临时 modes 扩展生成，description 取正式来源。

原维护源、归位来源和官方扩展内源的完整集合及字节一致。生成入口重建了 frontmatter 和标题，按官方实际变换核对名称、来源描述和完整语义正文，不要求整文件等于维护源。无新增统一路由、生成器、生产安装状态或 YAML 合并逻辑。候选仅位于 packages/skills/tests/distribution/helpers/entry-discovery.mjs，正式平台注册仍由后续原任务承接。

## 附件对照与前置保护

最小 Increment 测试副本附加 references/t095-note.md，标记为 T095_REFERENCE_20261111，正文明确不是业务认可。未桥接时，官方生成引用仍为 references/t095-note.md，按入口相对目录解析实际不可达；扩展顶层原字节桥接后，官方改为 .specify/extensions/modes/references/t095-note.md，按项目根解析可达且内容与源一致。没有手改生成正文。

缺 Increment、缺准备、未知原始来源目标、未知隐藏来源、未知正式入口、未知既有 modes 扩展目录、目标目录链链接、附件同路径不同内容、附件文件/目录前缀冲突、引用缺失和来源附件链接，共11种反例，均由候选在任何变更性官方调用前拒绝，并保存零调用及哨兵保护证据。它们证明本测试候选的保护，不证明现有旧生产脚本已实现。

目录链链接及附件文件/目录冲突均有先红后绿的实际记录：初版会错误继续到官方调用，补前置检查后停止。沙箱中 Node 启动 CLI 的 EPERM 与代码保护缺口分别留证；官方集成经工具审批在外层执行，所有目标仍限自有 /tmp 项目与测试用户。Node --test 首次只报告 worker 失败，直接 Node 入口取得了缺候选模块的明确红灯，不将其混作功能通过。

## 实际发现与实际读取分开核验

本机 CLI 生成的 JSON schema 提供 skills/list 协议。用真实 app-server、隔离测试用户 HOME 和 forceReload，分别读取项目、全局及附件项目；未调用模型、未复制凭据。返回公开准备、独立 coding 和唯一 speckit-modes-increment，未发现 raw task-increment，三暂停来源未进入活动集合。全局准备/coding 的作用域为 user，正式入口为 repo；项目场景均为 repo，没有发现错误。

发现之后，两个真实新宿主会话在 read-only 沙箱、默认模型下，按已发现路径的明确只读请求完整读取正式入口与准备正文；附件场景继续完整读取官方改写后的实际附件，输出含原标记。全局回合 36.246 秒、附件回合 51.198 秒，均退出 0、无超时、完整项目/技能文件字节未变。主 agent 逐项匹配工具输出中的完整正文与附件，未只凭模型回执判定加载。

这两层证据没有合并成“自然语言业务请求已自动触发并正确执行”的结论：发现用测试用户作用域，明确请求读取回合复用当前认证运行时，未修改业务。普通自然语言/显式入口的完整定位、停止或放行仍归 T099，实际生产脚本接线、真实挂载及用户效果不由本项抵扣。

## 工程检查和保留边界

- 本次 Node 入口为 `node packages/skills/tests/distribution/entry-discovery.test.mjs`；显式提供 FOUNDRY_ENTRY_SPECIFY_CLI、FOUNDRY_ENTRY_SKILLS_CLI 后实际官方集成全部执行。没有工具时四项官方测试明确 skip，不计通过。
- 最终 Node 完整测试为12项通过、0失败、0skip，包含11种零调用保护输入。最终普通生成结果逐字匹配之前由发现接口及宿主消费的版本，未用旧结果抵扣变化。
- 两个新 JS 文件最终针对性 ESLint 退出0。
- `pnpm --filter @foundry/skills run check-types`：退出 0。
- `pnpm --filter @foundry/skills run test`：12 项通过、退出 0。
- `pnpm --filter @foundry/skills run lint`：退出 1，仍为 build/plugins/collections.ts 第11行 entries 未使用的 unused-imports/no-unused-vars 与 sonarjs/no-dead-store 两项既有错误；本 Task 不代修，不记整包全绿。
- `pnpm --filter @foundry/skills run build`：依用户明确指令暂跳过，dist 与构建来源消费未验，不用旧产物抵扣。

只验证 Linux 及本机所选版本，不冒称 Windows/macOS、其他宿主或后续版本通过。父正式来源、注册/安装脚本、宪章、功能指针和原任务验收保持；原 T095 按有限范围回填，不自动开始 T066 或据此取得阶段批准。

## 原始材料

[结构化结果](fixtures/t095/results.json)保存实际版本、逐层证据、未通过检查和限制；[原始归档](fixtures/t095/retained.tar.gz)保存测试输入/输出、真实发现请求响应、全文事件及来源快照。初包2729777字节，994份留存文件及其摘要清单已安全解包逐一核对；最终补充审查和父资料检查后的摘要以results为准。

反例中的7个链接只记录实际位置/目标，不跟随或打包外部目标；这不把带链接的反例改写成普通来源。仓库画像与认证未入包，三类选定凭据模式未命中，不称完备扫描。父资料选取快照不是整个仓库，正式生产同步与后续受管迁移仍沿各原 Task。

## 独立审查

只读 review_t095 没有 Critical、Important 或明确 Minor，独立核对来源/生成、11类零调用、真实发现和全文事件、最终版本同版、归档与工程日志。codingRoot 是当前测试显式选定控制组，正式技能和 modes 声明未新增 coding 依赖；helper 仅供全新隔离夹具复用，不能直接当作未知环境生产迁移器。

审查排除的构建/dist、T066旧登记/孤立残留/六旧hooks、T067等生产实现、T099业务行为、其他平台/宿主及真实挂载/用户效果，均继续保持原未验边界，不追加为本Task条件，也不宣称通过。最终父保护和补充归档结果以results记录，初包的审查结果不冒称覆盖其后新增文件。
