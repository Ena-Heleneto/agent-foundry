# 紧急版本交付契约

日期：2026-11-12。来源：[spec](../spec.md)、[本轮输入及Clarify B](../requirements/raw/2026-11-12-workspace-local-handoff.md)、[研究](../research.md)与[模型](../data-model.md)。本契约只更新紧急路径，不改原[pipeline](pipeline.md)准入或主线工程状态；本轮没有搬移、安装、产品验证或公开写入。

## 1. 工作区位置与恢复来源

正式实施目录为当前工作区packages/skills-distribution-urgent，源码、配置及dist与packages/skills分离。新目标尚未创建，仓库外同级旧副本仍是未提交恢复来源；已有结果对应旧字节，不能认为当前已迁入或通过。后续实施先记录两边真实状态和允许输入摘要，人工复制适用src/build/script/tests、配置、README及ISC，保留原件和未完成修改。

不复制.git、node_modules、旧锁、dist、缓存或环境文件，不覆盖未知目标。当前workspace已覆盖packages/*；工具版本由catalog管理，共享预设经exports及workspace:*消费，不要求包内独立Git/锁，不更改根锁策略。旧独立锁及全树干净的构建/测试/文档假设必须适配，不开发工程导出器。

来源继续复用11月10日归档适用模块、当前正式9项正文/附件和过滤集中配置，11月11日归档只参考校验。主线源码、dist、归档、.agents/.specify实例及真实用户目录不是恢复写入目标。9项名称与frontmatter及必要引用逐项核对：

| 分类     | 当前获准技能                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| coding   | business-node-delivery、document-changed-symbols                                                             |
| frontend | nuxt-ui-styling、vue-reactivity                                                                              |
| workflow | bug-report、artifact-project-description、artifact-spec-analysis、implementation-preparation、task-increment |

三暂停模式、旧Review/Guide/Explore及六退役技能不进入活动发布/挂载。Increment验收显式选择分析和实施准备，完整验收组合还选择结案hook；其他请求缺真实必要依赖则拒绝，不静默补装。

## 2. 输入身份、构建与精确payload

保持目标包唯一Vite配置与自身dist，sourceRevision取实际Git根中对应输入提交，Git读取带正确包相对前缀；不要求Git根等于包根。输入闭包包括实际源码/脚本/正文、package版本、构建配置、实际用到的catalog/共享预设/依赖。相关输入脏、忽略文件影响输入或构建中漂移则失败，无关工作区修改不应阻断；实际依赖图与根锁字节另有摘要，未跟踪锁不能冒认提交文件。

公开payload为skills/<分类>/<技能>完整目录、script、README、实际ISC LICENSE及release.json。同版所选集中配置位于script/config/<集合>/collection.config.json，过滤未获准映射并纳入files。schemaVersion=1及消费者兼容字段保持，只声明Codex identity；files为相对路径/字节数/SHA-256，payload必须精确等于files加release.json。拒绝缺件、额外文件/技能、链接、越界、大小写冲突、重复身份、错版和不可追溯输入，不把development或夹具结果换标签当正式材料。

脚本原字节复制且不执行，不在技能目录创建安装引擎或嵌套package。先具备真实README/LICENSE再验完整内容；模块汇合、说明变化后重新构建读盘，同源两次干净输出全文件及字节100%一致。构建通过不能代替真实安装、挂载或宿主验收。

## 3. 官方安装及显式第二步

保留官方skills安装和唯一node script/index.mjs [参数]，无install/mount/hooks/commands子命令。Node入口只分派平台，Bash负责核验和编排；不新增独立TS/JS/Python安装核心或消费端第三方Node依赖。紧急版只承诺Linux/Codex项目级，其他系统/agent/global在对应写入前拒绝，不静默改目标。

对外第一步先只读预检：每次核验同一官方npm latest发布包的版本/integrity及实际Codex路径规则，建议同次版本、显式技能名、--agent codex、--copy且不加global。只接受受支持的同仓库同完整SHA GitHub raw/tree可无歧义映射来源，raw用于读取，tree用于官方建议；歧义/错SHA/布局变化/网络或完整性失败零目标写入，不回退旧表，不打印可执行建议。预检不运行npx、不创建npm缓存/锁/收据/技能暂存。

本地尚无公开来源时，仅在自有测试骨架用真实官方CLI读取已校验的本地目录/Git候选，验证整包/分类/单/多技能及反例；不经过生产公开来源建议，也不新增公开参数或放宽固定GitHub来源规则。正式文档/预检不能把含eval的源码根作为安装来源。

第二步仍是既有source/source-dir、version、agent、skill、project参数的普通唯一入口，核验同版官方已安装的完整目录后接mount-entry。无自有收据不拒绝合法同版文件，也不造收据/归属、不覆盖技能。显式名称、版本、项目与第一步一致，运行材料来自同版并全部核验；--check、--official或--no-mount均不能替代正常挂载成功。根script需独立取得，不假设任意单技能安装会带齐公共材料。

## 4. 所选hooks、Increment与旧入口保护

先核对目标Spec Kit环境、集成、正文附件和同版集中配置。仅对本次已成功核验的选择生成私有临时hooks-only extension.yml，provides为空，每事件补command=正式名，保留合法prompt/optional/priority/condition等字段，enabled=false过滤，条件交官方执行器。分析after_tasks、准备before_implement、结案after_converge，无after_increment；不回退旧逐技能配置或固定名单，不在安装阶段实施业务。

默认Specify1.2.6逐项extension add --dev --force；覆盖版本只有验证相同契约才接受。所有适用hooks成功或明确不适用后，仅以原modes注册speckit.modes.increment；缺三暂停源不阻断，不生成或复活其入口，不增加Implement包装。每项结果区分success/failed/not-run，失败保留前面安装及hook事实，后续Increment调用为0。

旧三/四/五集合、别名及退役映射用官方支持更新/移除逐项核对。调用前只对明确旧登记、来源及影响目录只读清点，可在本次私有临时目录按官方机制重建比较；未知附件/用户修改/无法证明归属则停止对应破坏性调用，保留精确路径和恢复条件。不整目录清退、不手改registry、不自造YAML合并、永久指纹或持续所有权服务，不因内容一致跳过本次官方重装。

读回实际注册并核验真实事件派发及Codex完整正文/附件加载，生成入口和源技能不得双重执行。HookExecutor返回命令或目录有文件都不是宿主实际消费。非Spec Kit可报告不适用但不能满足本版必需挂载验收；不自动初始化项目、工具或治理。

## 5. 本地验证完成后的连续推进豁免

当前包lint/check-types/build/test、同源双构建、9项正文附件/精确文件全集、真实官方安装、正常第二步、适用hooks及Increment注册/派发/宿主加载、旧迁移与用户文件保护、失败恢复、内部发布工具的自有bare Git实验均须有实际范围证据。源码路径/共享依赖改变后重新验证；缺必需输入或证据不能以skip、测试替身或旧结果计通过。

全部必需本地验证成功后，保存本地结果、版本/输入/依赖/候选摘要、实际命令和日志引用、四处迁移来源、许可及迁后调整/未验说明，然后沿已有授权及真实前置连续推进；豁免中间阶段、逐Task方案重复确认及T089完成后的固定暂停，无需迁后再发“明确继续”，仍读取材料、保存方案和证据。四目录迁移、建仓、推送及真实发布仍须适用明确授权，未授权操作次数为0；远端尚未创建不阻断本地验证，远端未验也不被抹成最终完成。单次报告放发布根外，不成为第二套任务状态。

## 6. 四处源码、ISC与公开边界

后续一同迁移packages/skills-distribution-urgent、packages/skills、specs/skills、apps/mcp。新开源仓库采用真实ISC正文及对应声明，保留适用第三方许可。eval源码和评估样本可保留在源码仓库，正式技能发布物、官方列出和安装eval必须为0；未公开MCP、画像、凭据不得混入技能候选，公开源码也须逐项核对正文/附件/archive与私有引用，不能依赖孤立发布树掩盖默认分支已泄露内容。

四目录之外的catalog/preset/根脚本模板依赖须明确处理。迁后由目标根维护独立依赖及等价检查，不暗中追加迁移preset目录或生成导出器；旧测试来源和身份保留，未适配项如实未验，不删除求绿。specs/skills内已有画像摘要与私有依据，公开副本按来源清点处理，原私有历史保留当前仓库，不为修复断链带出画像。MCP源码同行不等于清单契约兼容或授权部署，旧manifest生产者缺口单列，不扩围本地紧急实现。

## 7. 后续迁后候选、授权发布与远端复验

迁移实际完成后，以新仓库真实干净sourceRevision、包路径及冻结依赖重新做工程检查、双构建、安装挂载和宿主消费，形成新的严格候选。用户明确绑定repository、version、sourceRevision、candidateDigest后，才可运行已由范围实验验证的内部发布工具；本轮Plan及本地完成不新增外部操作授权，有效授权不重复询问。

发布阶段不安装依赖、不构建、不执行payload脚本、不改README或清单，只推一个无force新skills-v<version> tag。新建或复用均获取实际commit并核验父数0、精确文件全集及字节；带父/非commit/异字节/不完整均冲突停止、不改tag，不删已有完整版本。并发/响应丢失先回读，保留已发生事实，不从退出码推断未发布。

随后移除写凭据，匿名核对固定publishedRevision全部文件，并从该来源真实完成Linux/Codex两步安装与宿主复验。发布、匿名校验及消费分别报告，缺必需证据不满足最终SC-019；公开字节变化必须新版本。既有full/ready准入与Actions范围保持，不伪造PlatformReceipt/runId/artifactId，不自动完成主线任务。

## 8. 失败与证据

各阶段保存success/failed/not-run及实际原因，安装、已成功hooks和已发生Git写入不因后续失败抹去。未知内容明确冲突路径及恢复条件，不承诺跨文件原子回滚；秘密不进日志、报告或公开文件。验证命令与适用阶段见[quickstart](../quickstart.md)，阶段图见[diagrams](../diagrams.md)。
