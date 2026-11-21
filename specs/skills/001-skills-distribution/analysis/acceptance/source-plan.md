# T067：来源快照与基础构建计划验收

> 当前状态：用户于2026-11-11后续要求全部移至[归档](../../archive/2026-11-11-build-script-restart/README.md)并重新写构建脚本。本文件仅保留当时讨论和执行事实；原方案已停用，33项测试通过不代表当前或重写后能力，不能按本文件直接继续实施。

日期：2026-11-11。范围来自用户已认可的 [T067 方案](../../implementation/T067.md)：读取实际输入、校验、只在内存形成原始三目录和 MCP 清单。没有接入 Vite、写出新产物、生成 Release/安装投影或实现磁盘复核。

## 实际交付

新增 `packages/skills/build/distribution/` 下六个模块：models、validate、source-files、dependencies、source、export。入口为 `readSourceSnapshot({ packageRoot, validationScope })` 和 `createBaseBuildPlan(snapshot, { outputRoot })`。后者返回 kind=base，缺 Release/投影的中间结果不能用于完整候选。

SourceSnapshot 保存实际源码/配置/技能/MCP/script、README 和已有许可证的原始字节及摘要，记录完整 Git SHA、状态、与提交不符的实际输入、依赖图/安装锁和 Node/pnpm 版本。Git 使用固定源码 SHA 的完整仓库路径，逐项比较 Git blob；被忽略的输入也不能冒认已提交。development/isolated 如实保留修改，full 拒绝不干净或不对应提交的来源。

依赖解析只读取实际 package.json 和现有安装路径，不加载依赖代码、不安装或联网。根声明包含开发依赖，间接实例继续遍历 dependencies、optionalDependencies、peerDependencies，记录实例关系及缺失可选边；缺必需依赖失败。证据是实际版本、声明摘要和现有锁文件，不等于逐文件重新验证所有第三方包安装字节，也不证明迁后独立安装。

计划只消费已固定快照，对原始文件复制内存字节；校验元数据、身份、路径冲突、附件缺失/越界、输出根和链接。MCP 正文与清单 references 必须为 UTF-8，普通二进制附件仍保留原字节。Markdown 代码样例不视为真实附件链接；已有明确项目根 `.specify/` 引用属于消费者前提，不从 Foundry 补造材料，其 Release 声明由 T069 处理。

## 阶段测试：真实红灯到绿灯

```bash
node --test --test-isolation=none packages/skills/tests/distribution/source-plan.test.mjs
```

首次在沙箱被 Git 子进程 EPERM 阻止，未计为产品红灯；按权限规则在沙箱外重跑，22项全部因明确缺少真实 T067 模块失败，无语法或环境导入错误。随后实现并增量增加有实际依据的边界测试，每组新增行为先取得失败再修正。

最终沙箱外实际退出 **0**：**33 项通过、0 失败、0 跳过**。覆盖：

- 原始字节/摘要、三目录、二进制、完整 MCP 清单、稳定身份、快照后磁盘变化只影响下一次读取、计划零写入。
- 必需目录、目录类型、来源父级/附件链接、重名、路径大小写、名称/版本/YAML/正文、缺附件及编码越界引用、MCP 手写清单和清单路径占用。
- 脚本不执行和缓存/脚本测试排除；必要的 test-prompts.md 技能附件完整保留；代码样例和消费者项目前提不误作附件。
- MCP references 非文本拒绝、普通二进制资产保留；完整间接依赖及根/间接可选边、间接声明变化影响总体摘要。
- full 的真实干净来源、未跟踪和 ignored 输入拒绝；monorepo 子目录的源码提交对应；输出祖先、来源目录、链接及断开链接拒绝。
- README 原始字节属于来源身份，修改影响摘要；基础计划不提前生成发布根文件。

临时日志在 `/tmp/foundry-t067-*.log`，可能被清理；本记录保存复现命令、实际分类与结果，不依赖临时日志长期存在。

## 独立审查及修正

按 requesting-code-review 派出一次独立只读审查，限定本 Task 新增代码/测试及契约，未修改文件、未派其他代理。无 Critical，三项 Important 均补真实失败测试并修正：

1. monorepo 子目录执行 ls-tree 默认路径基准与仓库根比较不一致：改为固定 SHA 加 --full-tree，真实嵌套包 full 用例转绿。
2. MCP 全部文件强制 UTF-8 会误拒绝 assets/logo.png：文本约束收窄到正文及清单 references，普通二进制原字节计划用例转绿。
3. manifest.json 来源目录与自动生成同名文件冲突：通用路径检查拒绝完整路径重复及文件/父目录冲突，真实输入目录反例转绿。

没有再次派审。此前自查还通过真实包消费定位并修正测试附件误排除、代码示例误判、来源父目录链接及断开输出链接漏检；没有放宽 lint、类型配置或修改保留运行脚本。

## 包检查、完整链与消费者

包命令前缀统一为 `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills`。

| 实际命令                                                                                                                                   | 结果与边界                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `run lint`                                                                                                                                 | 最终退出0，无检查规则放宽                                                                           |
| `run check-types`                                                                                                                          | 最终退出0，无新增兼容声明或类型检查配置改动                                                         |
| `run test`                                                                                                                                 | 退出0，Python11项通过；该命令不包含新增Node阶段用例                                                 |
| `run build`                                                                                                                                | 退出1，仍为原“旧构建已存档、新构建尚未实现”拒绝入口；没有新产物                                     |
| `node --test --test-isolation=none packages/skills/tests/distribution/build-pipeline.test.mjs`                                             | 沙箱外退出1，25项全红：Vite未接线、阶段错误未通过该入口返回，2项仍缺T070 verify模块；没有删除原断言 |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-entry.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` | 沙箱外退出1，9通过、1失败、1跳过；详细见下文                                                        |

消费者失败名称为“从独立 Node 入口调用真实 Linux 安装器，完整安装技能和二进制附件”。实际在线预检返回“官方 Agent 配置布局已变化，无法读取最新规则”，安装阶段 failed、上游原因 upstream，退出2且目标未写入。不能沿用上轮10通过的旧记录冒称本轮安装通过；本次未修改运行脚本、Node入口、该测试或其夹具，不为 T067 扩改在线解析器或固定 latest 版本。恢复该在线能力后，T070 的适用安装验收仍需实际复验。

PowerShell 消费者因当前缺运行时跳过，不算平台通过。Windows、macOS、最低工具版本、新产物 MCP 消费、完整安装/挂载、Actions、迁后独立工程及发布均未验收。

## 当前包只读探针

另将真实 export.ts 仅编译到自有 `/tmp`，对当前包运行 development 来源与基础计划；最后一次实际记录66个输入文件、990个已解析依赖实例，计划52个文件、1个 MCP 技能，退出0，未写 dist。源码参照为 `742088a60880a24f3e445f16e6172b413274ddb2`，clean=false，未把工作区修改冒认为该提交内容。该统计含当时工作区实际文件，不能固定为产品数量或后续版本身份。

## 验收结论与续接

T067 的只读来源、基础计划及对应输入反例已验收；不以此宣称整个 BUILD/COMPAT 风险或新构建通过。当前整体 Vite 与 T065 完整链仍保留真实红灯，且在线安装消费者另有上述未解决失败。

下一项为 T068：讨论其自身方案后接唯一 Vite 编排、原始三目录/MCP 写出及明确失败的原生占位。T069 补完整计划/Release/投影，T070 接独立复核和完整适用消费者。未修改另一条功能线的文件、未新建 T068 方案、未提交、推送、迁移或发布。
