# @foundry/skills

可复用的 agent 技能内容包。`src/<集合>/<skill-name>/` 维护通用规则，skill 名全局唯一；当前集合为 coding、frontend、eval、workflow，新增一级目录自动参与构建。技能可按适用环境包含工具上下文；Spec Kit 项目读取其材料和治理，其他项目沿用现有任务体系。

## 唯一脚本入口

外部分发统一运行 `node script/index.mjs [参数]`，需要 Node ≥22.20.0，无 install/mount/hooks/commands 子命令。入口自动按操作系统选择内部 Bash 或 PowerShell 安装模块；内部安装流程按后续任务接入文件核验、所选 hooks 和五指令。各职责目录是内部模块，工作区已有集成和测试仍可直接调用。

```text
node script/index.mjs --source-dir <同版发布根绝对路径> --version 0.1.0 --agent codex --skill <技能名称> --no-mount
```

这是需要替换路径与名称的模板，当前尚无公开来源。--source <固定提交HTTPS根URL> 可替代 --source-dir；完整参数见 `node script/index.mjs --help`。当前安装骨架只实现 Linux x86_64 / Codex 项目级 / 显式 --skill，workflow 安装须显式 --no-mount；其余参数能力和自动原生挂载由分发后续任务填充，未支持请求明确失败，不会冒认成功。Node 入口不重新实现下载或安装核心，不需要第三方 Node 运行依赖。

## 构建与验证

当前采用一个 Vite 集合内容插件：扫描 `src` 一级目录，将每个集合原样复制到 `dist` 下同名目录，另创建空的 `dist/mcp`。不维护固定集合名单，新增目录无需修改插件。旧构建及六模块实现保留在[功能归档](../../specs/skills/001-skills-distribution/archive/2026-11-11-build-script-restart/README.md)，不作为新实现的代码入口。

```bash
pnpm --filter @foundry/skills run lint
pnpm --filter @foundry/skills run check-types
pnpm --filter @foundry/skills run build
pnpm --filter @foundry/skills run test
node --test --test-isolation=none packages/skills/tests/distribution/collections.test.mjs
```

| 输入              | 输出               | 当前职责                                          |
| ----------------- | ------------------ | ------------------------------------------------- |
| `src/<任意集合>/` | `dist/<同名集合>/` | 技能正文、frontmatter、完整附件和集合配置原样交付 |
| 无独立MCP来源目录 | `dist/mcp/`        | 预留空目录，内容和清单规则后续决定                |
| `script/`         | 本轮不生成         | 安装、挂载等特定脚本另行处理                      |

每集合维护 `collection.config.json`，字段为 `packageName`、`mcp`、`skill`。skill按技能目录名决定交付范围；空对象也表示选入，未列出的技能不读取或复制。无配置默认 `packageName: null`、`mcp: false`、`skill: {}`，只在dist生成配置。发布语义及MCP内容后续确定。

技能配置使用 `skill.<名称>.hook.<事件>`，各事件独立保存 `prompt`、`optional`、`priority` 和其他属性。未知字段原样保留；`command`、`description` 留未来脚本生成时读取来源，SKILL.md frontmatter保持。插件全部声明位于工厂函数内，顶层只保留import及工厂导出。示例见[配置讨论](../../specs/skills/001-skills-distribution/requirements/discussions/2026-11-11-plugin-skill-config.md)。

构建不编译或执行技能中的代码，不生成占位JS或逐技能hooks附件，不处理Release、安装投影或流水线。源码/配置/输出路径非法会在清理旧产物前失败；只允许输出到包根dist，拒绝来源及输出链接。正常重建清理旧产物，来源删除后输出不残留；`write=false`不落盘。

原 `src/mcp/mcp-build-smoke` 已并入 `src/eval/mcp-build-smoke`，正文和附件原字节保留。MCP应用、上下文估算器的清单消费、旧安装/挂载和原T065固定目录契约仍需按新结构单独适配，不把本轮内容构建当完整安装或发布完成。实际检查与限制见[T073验收](../../specs/skills/001-skills-distribution/analysis/acceptance/plugin-skill-config.md)。

## 规则与挂载的边界

技能内可包含 Spec Kit 规则，并按实际环境选择上下文来源：Spec Kit 项目按配置和标准材料定位，其他项目沿用已有任务系统、资料、记录布局和格式要求。缺少必要材料或任务归属有歧义时只补必要上下文，不在其他项目创建 .specify。模式内维护各自的协作行为；Spec Kit 子任务的公共规则统一读取项目宪章 VII，不复制到技能内。

当前工作流来源只保留 Increment 规划、共同实施准备、综合分析及结案说明。Increment 读取目标 Spec 的现有材料并维护轻量任务；原生 Implement 在每个 Task 开工前消费共同准备及已认可方案，不新增实施模式。六个旧文档/门禁技能与 Review/Guide/Explore 来源已清退；按用户最新决定，Pair/Tutor/Direct 源码及附件也删除，原任务和历史证据保留。主动技术风险核查继续由目标项目治理约束，不依赖已退役的 mvu-gate。

Bash 注册模块已按当前集合接入，只注册 Increment 和所选适用 hooks；完整公开编排、来源/发现分离及真实工作区迁移仍按各自任务推进。保留的旧平台脚本和旧安装副本不代表当前交付能力。当前源码清单与历史安装状态分别核对，不用删除源码证明已卸载。

`link-skills` 按名称铺平复制到目标技能目录，分类目录不挂载；默认 .agents/skills 为实体副本，不是软链接。构建不刷新挂载；删除或改名也不会自动清理旧别名，必须先核对归属再通过受管迁移处理，未知内容保留。当前Bash注册模块只声明Increment，hooks按本次集合选择逐项官方强制重装；六旧hooks只在登记存在且保护预检通过后由官方remove退役。真实安装状态仍待后续迁移核对，不把清退源码视为已卸载。

## 线下技能清单

| src 下集合路径                        | 用途                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coding/document-changed-symbols       | 每次编码 agent 执行 TypeScript、JavaScript、Vue 或相关前端代码编辑时都必须使用。要求为本次新增或修改的每个函数、方法、变量、常量、ref、computed、类字段、类型别名、接口、枚举、导出符号和配置声明，在声明上方补充多行 JSDoc 注释。当用户要求补充 JSDoc 或改动符号注释时也必须使用。                                                                                                                                                                                                                                                                                                 |
| coding/business-node-delivery         | 通用业务节点实施规则：在已有目标和任务内推进适用步骤，复用已有成果并实际验证后衔接页面；可独立安装，由自身 description 匹配业务规划、接口开发、页面接入及继续实现；不要求模式链接或正式 Task，纯文案/格式/视觉及概念解释不触发。                                                                                                                                                                                                                                                                                                                                                    |
| eval/eval-short-rule                  | 实测样本技能（短文规则型）。用于评估 Agent 在微型规则约束下的触发与遵循效果，约束业务常量命名与注释规范。                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| eval/eval-with-reference              | 实测样本技能（带附属参考文件型）。用于评估 Agent 在需要索引附属契约文档时的技能调用、跨文件检索与规约实施效果。                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| eval/eval-workflow-guide              | 实测样本技能（长文流程型）。用于评估 Agent 在复杂多步骤业务流下的触发、长上下文理解与分阶段执行遵循度。                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| frontend/nuxt-ui-styling              | 编写或修改本仓库使用 Nuxt UI、Tailwind CSS、UnoCSS 的 Vue/Nuxt 前端代码样式时必须使用。规定 Nuxt UI 组件样式经 `ui` 属性使用 `tw:` 前缀的 Tailwind CSS，其余组件与原生标签一律使用 UnoCSS 属性化取值式写法，且不得臆造 slot、variant、shortcut 或 utility class。编写或修改 NuxtLink 等组件的属性化样式、属性名与组件 prop 或原生 HTML 属性同名（如 `text`）时必须使用：冲突属性加属性化前缀（以项目 `presetAttributify({ prefix })` 配置为准，缺省 `un-`，如 `un-text`）。新增或修改样式后需要确认规则是否真实生效时必须使用：写前查证 utility 存在、写后 grep 产物 CSS 核验生成。 |
| frontend/vue-reactivity               | 编写或修改本仓库 Vue/Nuxt 响应式代码时必须使用。默认禁止新增 watch、watchEffect、watchPostEffect、watchSyncEffect 等 watcher，优先使用 computed、ref/reactive、模板绑定、props/emits 与 composables 的声明式数据流；例外使用 watcher 时必须说明理由并保持职责窄而局部。                                                                                                                                                                                                                                                                                                             |
| workflow/artifact-project-description | 项目或功能已经完成验收，需要据实际交付整理目标、范围、成果与遗留事项时使用。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| workflow/artifact-spec-analysis       | 基于现行需求、方案、闭环与任务，创建或刷新逐功能分析；不代替验收。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| workflow/implementation-preparation   | 正式Task开工前核对讨论认可、独立方案、必要前置和恢复范围。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| workflow/task-increment               | 基于当前Spec增量规划业务闭环和轻量任务，复用已有原文、方案及分析。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 技能结构和消费

每个技能包含 SKILL.md，frontmatter 显式声明 name、description、destructive；可选 references 保存该技能需要的参考资料；工具兼容规则可在技能内维护。新增技能无需手工列构建入口；目录名须与 name 相同，同名冲突必须解决。`destructive: true` 默认不被 MCP 收束，按已有机制显式放行时标注风险。

当前不发布；发布内容仅 dist，发布/部署与远端变更仍需用户明确授权。原生工具技能由工具自身维护，不在本包里改写。

## MCP 测试技能与自动清单

`src/eval/mcp-build-smoke/SKILL.md` 和 `references/verification.md` 保留为eval集合中的测试样例。当前插件只复制到dist/eval；dist/mcp保持为空，不生成manifest.json，也不承诺线上MCP消费。集合配置里的mcp字段供后续明确规则使用。

## 2026-11-04 hook 配置归属修正

hooks唯一来源已集中到对应集合的collection.config.json，使用skill.<技能>.hook.<事件>保留独立参数及扩展属性，command/description不重复维护。通用构建只原样复制集合配置，不派生逐技能speckit-hooks.json。上句记录配置归属；T067的Bash register-hooks已消费显式集合配置，完整编排和真实挂载仍待后续任务，不以模块通过宣称实际安装已兼容。

## 综合分析技能的当前来源

artifact-spec-analysis正式维护于[src/workflow/artifact-spec-analysis/SKILL.md](src/workflow/artifact-spec-analysis/SKILL.md)，after_tasks唯一声明在[workflow集合配置](src/workflow/collection.config.ts)。workflow 集合已转为 TS 维护，四项技能显式设置 `enabled: true`，原 hooks 参数保留；临时手动挂载脚本将 TS 配置导出为临时 JSON，供现有注册器消费。任务生成后的分析与Increment规划保存后的显式刷新复用同一正文，按功能解释当前需求、方案、闭环及任务，并保留缺项和未验边界。此维护源及集合声明不代表完整分发或真实项目挂载已验；当前分发与平台接入仍按原任务核验。
