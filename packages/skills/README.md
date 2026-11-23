# @foundry/skills

可复用的 agent 技能内容包。技能源位于 `src/<集合>/<技能>/`，由集合配置选择启用项。coding、frontend 和 workflow 在各自的 `collection.config.ts` 中设置 `publish: true`，参加发布构建。

## 安装

在 Linux 的 Codex 项目根目录运行同版 `curl/install.sh`。当前入口使用 Bash、curl、Node、npm、tar 和 uv，并在本次临时目录准备 jq。公开安装需先为脚本配置实际 HTTPS 发布地址，并提供包含版本、归档地址及 MD5 的版本表。源码当前使用示例下载地址。

```bash
bash /path/to/curl/install.sh 0.1.0 --no-mount
```

将示例中的脚本路径替换为实际下载位置。省略版本时使用版本表第一条。技能安装到项目的 `.agents/skills/`，由同包 `engine/install.sh` 运行后置步骤。`--no-mount` 跳过挂载，`--hidden` 对本次成功安装项应用本地 Git 排除规则。需要实际注册时，目标项目须已初始化 Spec Kit 并安装 Specify。

## 构建与验证

Vite 按 `collection.config.ts` 的技能启用设置，将技能正文和附件复制到 `dist/skill/`，写出 `dist/VERSION`、`dist/curl/install.sh` 和 `dist/engine/`。发布流水线用 `build --mode release`，扫描时仅纳入设置了 `publish: true` 的集合，并在 `dist` 中生成安装映射、说明和许可。构建结束后，流水线单独用 `tar` 压缩当次 `dist`，再解包核对文件路径与字节。普通构建按各集合的技能启用设置生成本地产物。

```bash
pnpm --filter @foundry/skills run lint
pnpm --filter @foundry/skills run check-types
pnpm --filter @foundry/skills run build
pnpm --filter @foundry/skills run test
node --test packages/skills/tests/distribution/{vite-plugin-skill,vite-plugin-engine,runner-archive}.test.mjs
```

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
