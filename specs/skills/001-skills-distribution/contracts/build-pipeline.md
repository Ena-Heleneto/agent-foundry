# 构建、流水线与技能发布的节点契约

## 2026-11-18 最新接口：自动加载集合子插件

依据[Spec](../spec.md) FR-076～078，引擎是配置期插件工厂，入口为 `build/plugins/vite-plugin-engine/index.ts`；接收可选的绝对 src 来源目录，缺省锚定包内 src，返回 `Promise<PluginOption[]>`。唯一 Vite 配置接收该结果，与现有公共插件共同注册，构建钩子统一交由 Vite 调度。

1. 先读取集合 `collection.config.ts`，仅顶层 `plugin === true` 时固定发现 `src/*/plugin/vite-plugin-*/index.ts`，只取普通目录、普通入口，不跟符号链接，不递归附件。按集合名及插件目录名稳定排序，顺序导入、调用默认导出的无参工厂。
2. `CollectionOption.plugin?: boolean`，经 `defineCollectionHandle` 默认补为 `false`；缺配置、未声明或 `false` 时不扫描插件目录，也不导入子插件。开关与 `script`、技能启用状态独立；启用集合缺 `plugin/` 或没有匹配入口时贡献空数组。来源目录本身、真实读目录、已匹配模块导入或工厂执行失败须向上传播；非函数默认导出明确报错。入口相关错误包含实际入口路径，不静默跳过坏插件。
3. 工厂返回 Vite `PluginOption`，可为异步结果、数组及 Vite 允许的空值；引擎只收集返回值，不自建展平、依赖图或钩子转发，不向子插件提供共享可变上下文。发现及工厂创建在配置加载阶段完成，generateBundle 等钩子待 Vite 实际执行。
4. 默认来源不依赖调用者 cwd；同一进程模块复用遵循 Node ESM 缓存，新的配置加载重新发现实际入口。产物仍由原生 Vite 生命周期写出，write=false 的隔离加载验证不得新增磁盘产物。

完整目标为 curl 交付 `script/install.sh`、`script/hidden-install.sh`，workflow 子插件交付一个自包含的 `script/speckit-mount.sh`，技能及根版本插件维持既有职责；构建不执行目标项目挂载。主代理本轮仅新增引擎，配置接线、子插件生成、curl 回迁及旧 script 插件移除均留后续；下方迁移记录保持发生时事实，不能据旧归属覆盖本节目标或据本节推定已实现。流水线仍在内容生成后独立核验并统一归档。

## 2026-11-18 插件交付边界

目标内容节点为技能插件生成 `skill/`、curl 插件原字节交付 `script/install.sh`、script 插件扫描并派生 `script/hidden-install.sh`、版本插件生成根VERSION；随后仍由流水线独立核验并统一归档。不得在脚本插件内恢复压缩、执行安装或引入插件共享可变上下文。完整迁移时统一调整唯一配置和虚拟入口、保留 curl 的安装入口 emit、迁出 hidden emit，核对每项资产唯一且没有旧路径脚本。

前轮用户只要求插件骨架；[后续授权](../requirements/raw/2026-11-18-unified-script-directory.md)已进一步要求迁移逻辑和模板，现已注册脚本插件并移除空curl虚拟入口。局部生成验证见[T077](../implementation/T077.md)，下方三个插件接线说明记录迁移前状态；正式归档与消费仍未由此通过，不新建Task或改变原工程状态。

## 2026-11-16 当前构建节点

本次有效节点为三个现有Vite插件生成内容及根VERSION → 流水线核验正式白名单/身份依赖/附件许可 → 独占正式暂存 → 一个统一包 → 包外候选核验与平台绑定。插件内归档保持注释，不生成skill/VERSION、curl/VERSION或强制随包manifest。完整路径及字段见[curl契约](curl-delivery.md)。

流水线等待内容生成完成后才读取dist，检查不依赖插件偶然写出顺序，也不向插件引入共享可变context。开发dist可含内部集合，不直接全量公开；正式hidden路径及轻量技能映射须与获准目录一致。危险来源/输出清理前拒绝、write=false零写入和正文/附件原字节保护仍须按实际实现验收，不能由本节设计推断通过。

归档在暂存目录外生成，比较本次解包路径/字节与正式暂存；双构建检查公开内容，不要求tar/gzip字节跨构建一致。选定归档后冻结，发布只消费同一份字节。候选文件表、依赖/检查证据与PlatformReceipt均留包外；平台上传成功后才绑定真实ID，不得回写已上传内容。

当前无主线统一归档/CI工具实现。近期先验证纯安装及可选hidden，后置挂载/完整门禁和紧急版原契约不变。下方旧阶段类型可按原职责复用，但Git发布、三目录/MCP和files加清单公式不能恢复为本轮前置。

<details>
<summary>此前契约与历史接口（未被替代的保护和最终验收继续适用）</summary>

## 入口与结果边界

外部安装仍只有 `node script/index.mjs [参数]`。工程入口沿 [pipeline](pipeline.md) 的 `build/ci/run.mjs --mode check|candidate|simulate|publish` 设计，不进入公开安装脚本。Vite 构建与 CI 复用同一来源、建模、生成和核验实现，不维护两套规则。

下表节点只是数据流位置，不分配新的工程身份、checkbox 或状态文件。返回对象的字段、摘要与资格定义集中在 [data-model](../data-model.md)。

| 节点         | 输入                                                     | 成功返回                                      | 允许的动作与失败结果                                                                                        |
| ------------ | -------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 读取来源     | 明确包根、版本、真实源码/依赖、验证用途                  | SourceSnapshot                                | 只读固定文件全集；缺目录、链接、非法路径/身份、正式候选来源不干净时失败                                     |
| 形成构建计划 | SourceSnapshot、已确认的公开范围和格式规则               | BuildPlan                                     | 只在内存形成目标路径与字节；依赖/附件/元数据非法时失败，零产物写入                                          |
| 生成产物     | BuildPlan、本次拥有的生成根                              | BuildOutput                                   | 有序写三目录、MCP 清单、Release 与格式文件；不执行脚本、不联网解析 Agent，错误不得报告完整构建成功          |
| 复核产物     | BuildPlan、磁盘实际输出                                  | BuildVerification                             | 重新枚举和求摘要；漏件、多余旧生成物、MCP/Release/投影不匹配时失败，不通过覆盖文件掩盖错误                  |
| 准备公开候选 | 两次同源 BuildVerification、全部必需检查证据、空候选目录 | CandidateContentIndex 及 payloadDir/indexPath | 复制严格公开集合，读回复核；任何缺项、非公开内容或development不能通过正式内容门禁；本地合成材料只记isolated |
| 绑定平台归档 | 已固定索引、上传成功输出、可信平台API事实                | PlatformReceipt 及最终 CandidateResult        | 在payload外写收据，核对run/attempt/ID/有效期；上传失败或收据不完整保持无正式资格，禁止回写已上传内容        |
| 发布         | 精确发布请求、索引/收据/全部字节、可信固定版本工具       | Publication                                   | 仅迁后standalone且真实授权通过可写一个新版本ref；本地simulate仅本次自有bare Git；失败保留已写事实           |
| 只读远端核验 | Publication、固定来源、原候选及隔离消费环境              | 分阶段核验结果与续接条件                      | 读回全部文件、实际验证两入口/适用挂载；不修改发布物，失败保留publish已发生，不能改报零写入                  |

## 开发顺序与临时挂载占位

开发按唯一 Vite 构建及占位→GitHub Actions→真实 Spec Kit 挂载推进，依据[本轮顺序](../requirements/discussions/2026-11-10-build-actions-mount-order.md)。T068 优先复用原生未接通段作为临时占位，保留已有文件核验；请求挂载时明确非零、hooks/commands 未执行且原生目标零写入，--no-mount 只保留纯安装事实。构建不执行或合成挂载成功脚本，脚本仍按源码原始字节复制。

T070 首先验证构建、纯安装和占位失败行为，通过后才由 T066 接 Actions；T059 完成配置/驱动实现与隔离验证后才进入 T006 的真实挂载。最终完整挂载、宿主加载和矩阵继续由原任务验收，T060 在它们之后汇合。此为开发先后，不改变上表运行时阶段顺序或正式候选要求。

占位材料只供 development/明确 isolated 的验证，缺真实挂载证据时 full/ready 必须拒绝，不以自填 success、YAML 可解析或模拟输出补齐。真实发布仍等待完整门禁、迁后平台与指定候选授权；不增加新公开入口、索引格式或状态服务。

## 读取与生成规则

SourceSnapshot 对实际技能、MCP、运行脚本、构建配置及依赖输入求身份，不能只记录 HEAD 后默认所有工作区字节都属于该提交。正式候选必须来自干净的指定提交；开发/isolated 输入可用于局部验证，但报告用途和真实输入摘要，不升级正式结果。

BuildPlan 在写出前校验相对路径、重复/大小写冲突、符号链接与附件引用。实际输出只允许清理本次拥有的生成目录；路径或归属不明停止，不将 emptyOutDir 当删除任意目录的授权。MCP 的空目录、重复名、无效 frontmatter 和源内手写清单按 distribution 契约处理。

表中 BuildPlan/BuildOutput 均指完整对象。T067 的 BaseBuildPlan 与 T068 隔离测试的 BaseBuildOutput 仅覆盖原始三目录/MCP，不具备 Release/安装投影字段，不进入候选链。T069 补齐完整内存计划并通过所有写出前校验，再沿同一编排写出完整 BuildOutput；研发顺序不改变运行时“先完整计划，后写出”的顺序。

构建保持单配置、同一 dist 根和原始三目录职责。脚本、普通附件保持原始字节；identity 不改原文，Eve 仅执行既定正文格式适配。原始 dist 可包含非公开线下内容，公开候选不能因此追加选择。

## 候选与平台绑定

本地候选目录包含 `payload/`、内容索引及检查/依赖证据；只有 payload 可以形成技能公开提交。payload 的实际文件全集必须恰等于 Release.files 加 release.json；清单与内容索引自身的摘要不写回自身。README 从既有包说明取得，许可证必须来自实际获准文件，缺少时失败，不以 package.json 的 license 字段代替文件。

同一完整依赖快照和源码分别干净构建两次，只有公开路径、长度和全部字节一致才固定内容索引。平台 artifact 的压缩摘要和自己的 candidateDigest 分别验证，任何身份/字节/检查证据替换都拒绝。

上传 payload、索引和证据后，才获得真实 payloadArtifactId。收据绑定这个 ID、内容索引摘要、run/attempt 和真实到期事实；若单独上传收据，receiptArtifactId 由上传结果供请求或运行摘要定位。两个 ID 均不通过“最新同名”推断，也不制造自包含的上传 ID 循环。

最终 ready 资格要求正式同版内容、全部必需检查及可信默认分支成功运行、有效归档和正确收据同时成立。平台的真实检查状态在发布前重新核对；索引里写 success 不是证据。isolated 的模拟平台记录必须标明测试用途，不能用于实际publish。

候选入口须显式传入 `--validation-scope isolated|full`；范围与准入条件由 [pipeline](pipeline.md) 统一定义。isolated 可使用列明的稳定子集/合成技能并记录尚未执行的完整门禁，但仍校验真实 README/许可证、集合内全部附件依赖、同源双构建及严格 payload；实际执行的检查失败不能返回成功。full 必须先通过全部上传前内容门禁，不等于上传前已有 ready。Foundry 的结果始终只供隔离演练，只有迁后 standalone 结合可信平台事实才可能 ready。

## 失败、输出与后续任务

T065 为可靠的阶段间故障实验约定内部调用名：`readSourceSnapshot({ packageRoot, validationScope })` 返回 SourceSnapshot，`createBuildPlan(snapshot, { outputRoot })` 返回完整 BuildPlan，`writeBuildOutput(plan)` 返回 BuildOutput，`verifyBuildOutput(plan, output)` 返回 BuildVerification 或抛 StageError。前三者由 build/distribution/export.ts 提供，复核由 verify.ts 提供；函数可异步，调用方等待结果。它们是供唯一 Vite 编排和测试共同消费的内部阶段，不增加外部子命令或生产测试 hook，不改变既定数据约束；BaseBuildPlan 的先行验证仍按上文执行。尚未实现时保持明确缺能力，不能提供空成功函数。

T067曾实现readSourceSnapshot/createBaseBuildPlan，随后用户要求将其全部模块和配套测试移至[归档](../archive/2026-11-11-build-script-restart/README.md)并重新写构建脚本。当前有效源码无上述入口，本文阶段接口作为旧方案参考保留，需随重写重新核对，不要求新实现机械恢复旧函数或模块拆分；[原验收](../analysis/acceptance/source-plan.md)仅保留历史。

内部成功返回表中数据；失败抛出 StageError，由工程外层报告该阶段 failed、依赖阶段 not-run，最终退出非零。skipped 只表示明确不适用，不等于缺工具/平台也通过。实际已写的临时目录或远端ref要如实报告，不宣称跨阶段原子回滚。

构建、候选和发布均能单独验证，共同使用这套阶段契约。新测试先记录缺能力失败，再在相同骨架补实现；保留安装/挂载消费者。具体函数和文件拆分由各Task实施准备确定，本次Tasks只落实职责与依赖，不能把本表或新清单当已认可代码方案。

</details>
