# T078：紧急独立工程来源验收

本记录只覆盖本次基础准备与初始原字节复制，后续脚本及构建适配会改变独立副本；不把初始摘要当最终候选摘要。

## 来源与隔离

- 主仓库 HEAD：`e688ab6fa54de13f57c017b32ff3a777f6939703`；准备前 `git status --short` 仅有未跟踪协作记录 `.specify/memory/user-shadow/conversations/2026-11-12-distribution-next-step.md`。本次源文件没有未提交差异，不冒认源 HEAD 为独立候选身份。
- 独立目录：`../skills-distribution-urgent/`；创建前不存在，现拥有自己的 `.git`（main）、package、锁文件、TS 与 ESLint 配置；没有提交，也没有创建远端。
- 原工作区 `packages/skills`、归档、dist 无本次写入；不复制 node_modules，未建立 workspace/catalog/Foundry 预设或父路径依赖。
- 11 月 10 日：`sha256sum -c snapshot.sha256` 通过；压缩包内部按 `files.sha256` 核验 63 项全部通过；`sha256sum -c retired-source.sha256` 21 项通过。
- 11 月 11 日：`sha256sum -c files.sha256` 7 项全部通过；只参考，不复制到独立工程。

## 明确技能源

9 项 frontmatter 的 name 均与正式目录一致；复制 9 份 SKILL.md 及 document-changed-symbols 的 references/test-prompts.md、nuxt-ui-styling 的两份 references 附件。集中配置保留原 packageName/mcp 字段且 mcp=false，仅筛选下列 skill 映射；正文引用的相对附件已核对存在。

| 分类     | 技能                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| coding   | business-node-delivery、document-changed-symbols                                                             |
| frontend | nuxt-ui-styling、vue-reactivity                                                                              |
| workflow | bug-report、artifact-project-description、artifact-spec-analysis、implementation-preparation、task-increment |

排除 eval、MCP、三暂停模式、Review/Guide/Explore 别名、六退役技能活动映射及其他未获准技能。集中 workflow 保留分析 after_tasks、实施准备 before_implement、结案 after_converge；没有 after_increment。

## 初始字节清单

普通文件人工复制后逐文件摘要核验一致。下表 source 对当前文件相对 `packages/skills/`，对归档文件相对 `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/`；filtered-collection 为明确清单过滤后的目标摘要，原摘要另列。

| 类型                | 独立目标路径                                                     | SHA-256                                                            |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| current-skill       | `src/coding/business-node-delivery/SKILL.md`                     | `2e0b8d03e3a7e8c3cf33adf92232d44ecd1b1b461775efbe7bdbdd3492a27cd1` |
| current-skill       | `src/coding/document-changed-symbols/SKILL.md`                   | `049b5d4f7e8b68f759d14f5ca98d13e94984731efef276f5c21b6c6258e1dacc` |
| current-skill       | `src/coding/document-changed-symbols/references/test-prompts.md` | `817c590ca9b7324eaf37c8aa4560b301f32d8395b052c5f844c62deff79e3038` |
| filtered-collection | `src/coding/collection.config.json`                              | `e6a95dcda76c83c555239487d3d823825b801a51bef4f3ffa0793ec55d1edbe3` |
| current-skill       | `src/frontend/nuxt-ui-styling/SKILL.md`                          | `0fb02df099d6751f65e83f3d8a3945340114eefc8b6718e220af118ce3a99735` |
| current-skill       | `src/frontend/nuxt-ui-styling/references/attribute-conflicts.md` | `417c746d59a4a9f7f68976a884ab6d196266304118c102c959e10b752c5fede2` |
| current-skill       | `src/frontend/nuxt-ui-styling/references/rule-verification.md`   | `6f47315857912ea6a1c5989b022e0eb45535e2a860748df29eb9370ca2957dac` |
| current-skill       | `src/frontend/vue-reactivity/SKILL.md`                           | `fb6aacad0eec0034e8e89fa40d483137b895633a46505258ac4363bb1bf0fc15` |
| filtered-collection | `src/frontend/collection.config.json`                            | `c80dc3d331351e28d72e67ed7fea433f35f8e79d83e4007c9ac1452507b75003` |
| current-skill       | `src/workflow/bug-report/SKILL.md`                               | `ad19b3aff08b3d448e43feb46fbcf56d009eec57105935436557434603adebc6` |
| current-skill       | `src/workflow/artifact-project-description/SKILL.md`             | `68aa274a0649da3a16eca2df56403564ac6f948f9bff5368c5c58825e02053ac` |
| current-skill       | `src/workflow/artifact-spec-analysis/SKILL.md`                   | `3f8e9c2dcf8db1204518c4253df5318049eb43fb594a351a7b1a07ab35df6323` |
| current-skill       | `src/workflow/implementation-preparation/SKILL.md`               | `50510c75e684f753c972c61c3a523a1a59a9022b3ddfb78d73f60af024da46ea` |
| current-skill       | `src/workflow/task-increment/SKILL.md`                           | `466fc0d9d5ba48a883c5346c310c5aac8b804f73a6e7e15a2552ff6a1077dc0a` |
| filtered-collection | `src/workflow/collection.config.json`                            | `e62f27cd7c23702030183e378fa6a5c4da18c7f34cf28e49a969a4a9879ae5f3` |
| current-script      | `script/index.mjs`                                               | `6eacc71bcdfd46aa8a044f1636d7ec4003f4f8e3a697d4b059cfc727dd26d81f` |
| current-script      | `script/install-skills/README.md`                                | `3288863e221cf9bc4cb56d7f3a68dd1491a79e472a317da47c4050a404cee32f` |
| current-script      | `script/install-skills/install-skills.ps1`                       | `7c16ffdf8b8f6f3e13f6b303ed3bb61c40c6c54492b3b27d2f7bdec848b0da29` |
| current-script      | `script/install-skills/install-skills.sh`                        | `15e39d5325cd3abe8f99ec7ef4c9ca1805185a34243683703f6a364bef73de99` |
| current-script      | `script/install-skills/read-agents.mjs`                          | `54303341a8d8999d36c6fde482244363475f8c6ab203ec7eeb34d6ba277ea191` |
| current-script      | `script/mount-entry/README.md`                                   | `5d7563dc3f5146d13048673eb9d3586692043ac5536108a46175b05103610e32` |
| current-script      | `script/mount-entry/mount-entry.ps1`                             | `ae493d20109770f2282bfbc7ccd1f6010e0cc2fe37ff155d3c75591636fb7073` |
| current-script      | `script/mount-entry/mount-entry.sh`                              | `a1cdd723c4a34890be11459b32c3fafcf5f82980c071edb0dc570e3be5e1eb0c` |
| current-script      | `script/register-commands/README.md`                             | `bd637c329c05f4fe3c7b70c3c13cd13437b55943a5aa0b9d6eb6376341cef82c` |
| current-script      | `script/register-commands/register-commands.ps1`                 | `860282e8c9969e2721f6879812176a473688d9b6f32239cb94fc54cb1f832868` |
| current-script      | `script/register-commands/register-commands.sh`                  | `736b5b0bafd687bc71830b4326f7112673b3413997f8d98270803a9451a92fb5` |
| current-script      | `script/register-hooks/README.md`                                | `c97697777439b8394e058e6327c7a353e14f80fa40ad93c99709a5a7dcde8a8e` |
| current-script      | `script/register-hooks/register-hooks.ps1`                       | `4208e31e52e8b70a362674fd19e5314f0831387e3e8127e2949e40798003725b` |
| current-script      | `script/register-hooks/register-hooks.sh`                        | `2ce1bb4d37034d9c937d8f79e3bde6b34bf2e016d580241ee59187937c1f46c7` |
| archive-2026-11-10  | `build/plugins/content.ts`                                       | `78888fd876889149c6744d13dcf30ecaecc252db2737f9a35db025d4edc73778` |
| archive-2026-11-10  | `build/plugins/scripts.ts`                                       | `70d7ec3701b8b2562214ab1d43f66ce84192f4243778b750af7d0c1551c99132` |
| archive-2026-11-10  | `build/plugins/distribution.ts`                                  | `f1dabd44a98d24185a592769ff1efb5be34c9d77aa45e1312d501ef83d5f8b89` |
| archive-2026-11-10  | `build/distribution/export.ts`                                   | `e638a820979ebf09db0d2bd9932b2dafd4eeb614ae915561202c997878229551` |
| archive-2026-11-10  | `build/distribution/models.ts`                                   | `07dd015d48e8ba21569fc5486d46d02861aeaad95abd75a6b5ecd72af213ed76` |
| archive-2026-11-10  | `build/distribution/projection.ts`                               | `b4412e2c13987f57c59432c34df838b3795fdc572fd5e0d31aeac71fbf64afd3` |
| archive-2026-11-10  | `build/distribution/references.ts`                               | `62218af45bed52cdd03fdbb9c8ff6a0bcdda09bf7bd974a95e4db91c19bc67f0` |
| archive-2026-11-10  | `build/distribution/validate.ts`                                 | `bdb74452d461de46473d00f44e327775b287dcf78ddd2f8af53d29fb8d73e44e` |
| archive-2026-11-10  | `build/distribution/verify.ts`                                   | `2b67c0eb5bc3445d6cfa26cd92db16041990bfaaf260acb41dbd3dd0b9a410c7` |

集中配置原始摘要：

- `packages/skills/src/coding/collection.config.json`：`e6a95dcda76c83c555239487d3d823825b801a51bef4f3ffa0793ec55d1edbe3`。
- `packages/skills/src/frontend/collection.config.json`：`c80dc3d331351e28d72e67ed7fea433f35f8e79d83e4007c9ac1452507b75003`。
- `packages/skills/src/workflow/collection.config.json`：`b263511f1d5bcbbdc425d3453ed9d126d15be0b97a9b2dc5c7da134caee0f77d`。

## 独立检查

实际 Node 为 24.22.2，pnpm 12.16.1。独立目录不继承 Foundry 的 mise 配置，首次裸 `pnpm install --ignore-scripts` 被 mise shim 拒绝（未指定版本）；随后使用已安装执行文件 `<source-home>/.local/share/mise/installs/pnpm/latest/pnpm`，没有改全局工具配置。

| 命令                                                 | 结果与原因                                                                                                                                                                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 绝对 pnpm install --ignore-scripts                   | success；独立解析并安装 111 包，生成自身 pnpm-lock.yaml                                                                                                                            |
| 绝对 pnpm install --ignore-scripts --frozen-lockfile | success；锁文件无须解析更新                                                                                                                                                        |
| 绝对 pnpm run lint                                   | success；初次缺 Node 全局 AbortSignal 声明已在独立 ESLint 中准确补充后复跑通过                                                                                                     |
| 绝对 pnpm run check-types                            | failed；原样旧插件存在 3 项严格类型错误：content/distribution 的 Plugin hook 索引可为 undefined，以及 distribution.ts 的 optional 属性赋值；交 T080 在独立实现适配，不降低严格检查 |
| 绝对 pnpm run build                                  | not-run；尚无适配后的 Vite 配置，初始归档模块仍按旧 src/skills 布局，不具备当前构建能力                                                                                            |
| 产品/官方安装/挂载/发布验收                          | not-run；不属于基础任务，且真实许可证尚缺                                                                                                                                          |

固定直接依赖：Vite 8.3.6、yaml 2.8.3、TypeScript 6.0.3、ESLint 10.14.0、@eslint/js 10.0.1、typescript-eslint 8.72.2、@types/node 24.10.1。依赖从 pnpm 内容寻址 store 安装，不是复制主仓库 node_modules。严格 TS 保留 strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes，skipLibCheck=false。

## 许可缺口

实际检索 Git 跟踪文件、根目录、packages/skills 及同级目录，未发现适用于 Foundry 技能源的 LICENSE/COPYING。找到的 .pio 第三方库许可证不适用；package.json 的 ISC 字段不能替代许可证文本。因此独立工程没有制造 LICENSE，没有添加虚构版权/署名。缺口已通知协调者；用户提供合法文本与必要署名后才能准备完整候选或安装验收。

## 交接

T079 可在此基础写真实失败骨架；后续 build/distribution/plugins 与 Vite 按紧急接口适配，不沿用 development 或既有候选通过资格。本项不提交、不发布、不改任务状态、mvu 或画像。

## 2026-11-12：同工作区T078来源接入

本节覆盖当前恢复至packages/skills-distribution-urgent的来源、复制及配置。旧仓库外方案和上方初始来源事实保留历史；本轮不把此前沙箱成功或旧独立锁当新位置通过。当前用户要求继续实施，由协调者分配T078；主线仍由用户手写，本项不写packages/skills主线、其dist或任何archive。

### 只读来源复验与保护

本轮主仓库实际HEAD为`e688ab6fa54de13f57c017b32ff3a777f6939703`。旧副本../skills-distribution-urgent仍无HEAD提交，git status显示.gitignore、LICENSE、README.md、build/、eslint.config.mjs、package.json、pnpm-lock.yaml、script/、src/、tests/、tsconfig.json及vite.config.ts均未跟踪。本次不改原件、旧Git或旧锁。

两份archive的实际只读复验：11月10日snapshot.sha256的压缩包1项、retired-source.sha256的21项通过；压缩包只在自有临时目录展开，并按files.sha256核对63项通过；11月11日files.sha256的7项通过。本轮不从归档覆盖主线，不恢复整个旧包。

允许恢复输入共51个普通文件、348949字节，原路径/字节/SHA-256见下表。创建前目标不存在，复制前后逐文件比较一致；之后README仅更新工作区依赖及待适配构建说明，新增本包package.json、tsconfig.json和eslint.config.ts。运行脚本、构建模块、测试、技能源及真实ISC先按原件恢复，后续适配由对应Task负责。源51项摘要及旧Git状态在复制后再次复验保持不变。

排除.git、node_modules、pnpm-lock.yaml、旧eslint.config.mjs、缓存、dist和环境文件，不复制.gitignore，不创建嵌套Git。新node_modules之后由协调者统一工作区安装准备，不能误写成从旧副本复制。原副本README的独立Git/独立锁描述只在新包改为当前workspace事实，旧原件保留。

### 9项内容与集中配置

coding的business-node-delivery、document-changed-symbols，frontend的nuxt-ui-styling、vue-reactivity，workflow的bug-report、artifact-project-description、artifact-spec-analysis、implementation-preparation、task-increment，共9项frontmatter.name与目录一致。9份正文及3份references附件与当前packages/skills正式来源逐字节相同；没有加入eval、MCP或暂停模式。

三份集中配置的packageName、mcp=false及所选skill定义与当前正式来源逐项相同。workflow仅保留上述5项，实际事件仍为分析after_tasks、准备before_implement、结案after_converge，无after_increment。正文中的references附件存在；task-increment的`[mvu.md](mvu.md)`位于目标项目文档链接的代码示例，不是随技能交付的附件，已按上下文区分，未虚造mvu附件求绿。

### 配置接入与实际检查

包名@foundry/skills-distribution-urgent；@foundry/preset-config走workspace:*，@types/node走catalog:types，eslint/typescript走catalog:dev，vite走catalog:build，yaml走catalog:shared。未改根catalog或锁策略。tsconfig通过公开exports继承共享预设，再显式保留旧副本全部compilerOptions，包括strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes/noImplicitOverride/noFallthroughCasesInSwitch/verbatimModuleSyntax/isolatedModules/skipLibCheck=false。未降低检查强度。

ESLint采用共享defineEslintHandler，忽略技能Markdown原字节和生成dist；原生Node测试只沿现有项目约定局部关闭test/no-import-node-test，未大面积禁用共享规则。新配置声明具备中文多行JSDoc。此项没有数据、后端接口或页面层职责。

| 实际命令或检查                                                                                                                                     | 结果及边界                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 两份archive的sha256sum及压缩内逐文件摘要核对                                                                                                       | success，1/21/63/7项均通过，仅临时展开，不恢复主线。                                                                                          |
| 允许输入复制前后原字节、源复验、9项正文/附件/配置核对                                                                                              | success，51文件348949字节，原件摘要及旧Git状态保持。                                                                                          |
| package名/catalog组、共享TS继承及旧compilerOptions比较                                                                                             | success，新包身份、严格配置正确。                                                                                                             |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --input-type=module -e 检查cwd及import.meta.resolve | success，定位新包且@foundry/preset-config/eslint-config解析到共享包dist公开入口。                                                             |
| pnpm --config.verifyDepsBeforeRun=false exec eslint --fix 新包eslint.config.ts/package.json/tsconfig.json                                          | success，退出0，只格式化本项配置，没有批量改旧源码。                                                                                          |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent run lint                                                      | failed，首轮共享规则暴露98项错误，其中54项可自动修复；保留日志/tmp/urgent-t078-lint.log，由协调者统一收口，不以旧独立ESLint通过冒认新包通过。 |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent run check-types                                               | failed，初始新包尚未链接依赖，TS2688缺node类型；属于环境准备失败，非T079产品缺能力红灯，之后由协调者安装后复验。                              |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent run build                                                     | failed，初始新包尚未链接vite，退出127；不是有效产品构建结果，不能当新位置构建通过。                                                           |
| 新位置范围测试、正式完整构建/双构建、真实官方安装/挂载/宿主                                                                                        | not-run，依赖准备及T079/T080等后续前置未完成；旧副本证据不能替代。                                                                            |

源码接入及配置核对已具备，首轮包检查仍有失败，未自行勾选T078或放行T079。协调者统一安装和修复后依据新结果判断；旧构建器的独立Git根/全树干净假设仍须T080适配，来源未提交时不伪造sourceRevision，不新增候选或发布。本节摘要清单记录复制时原字节，不作为后续修改后的最终候选摘要。

### 本轮允许输入原始字节清单

| 恢复相对路径                                                     | 字节数 | SHA-256                                                            |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `src/coding/business-node-delivery/SKILL.md`                     | 3404   | `2e0b8d03e3a7e8c3cf33adf92232d44ecd1b1b461775efbe7bdbdd3492a27cd1` |
| `src/coding/collection.config.json`                              | 129    | `e6a95dcda76c83c555239487d3d823825b801a51bef4f3ffa0793ec55d1edbe3` |
| `src/coding/document-changed-symbols/SKILL.md`                   | 4691   | `049b5d4f7e8b68f759d14f5ca98d13e94984731efef276f5c21b6c6258e1dacc` |
| `src/coding/document-changed-symbols/references/test-prompts.md` | 1591   | `817c590ca9b7324eaf37c8aa4560b301f32d8395b052c5f844c62deff79e3038` |
| `src/frontend/collection.config.json`                            | 112    | `c80dc3d331351e28d72e67ed7fea433f35f8e79d83e4007c9ac1452507b75003` |
| `src/frontend/nuxt-ui-styling/SKILL.md`                          | 5227   | `0fb02df099d6751f65e83f3d8a3945340114eefc8b6718e220af118ce3a99735` |
| `src/frontend/nuxt-ui-styling/references/attribute-conflicts.md` | 1891   | `417c746d59a4a9f7f68976a884ab6d196266304118c102c959e10b752c5fede2` |
| `src/frontend/nuxt-ui-styling/references/rule-verification.md`   | 1162   | `6f47315857912ea6a1c5989b022e0eb45535e2a860748df29eb9370ca2957dac` |
| `src/frontend/vue-reactivity/SKILL.md`                           | 1786   | `fb6aacad0eec0034e8e89fa40d483137b895633a46505258ac4363bb1bf0fc15` |
| `src/workflow/artifact-project-description/SKILL.md`             | 1675   | `68aa274a0649da3a16eca2df56403564ac6f948f9bff5368c5c58825e02053ac` |
| `src/workflow/artifact-spec-analysis/SKILL.md`                   | 3484   | `3f8e9c2dcf8db1204518c4253df5318049eb43fb594a351a7b1a07ab35df6323` |
| `src/workflow/bug-report/SKILL.md`                               | 1421   | `ad19b3aff08b3d448e43feb46fbcf56d009eec57105935436557434603adebc6` |
| `src/workflow/collection.config.json`                            | 1989   | `e62f27cd7c23702030183e378fa6a5c4da18c7f34cf28e49a969a4a9879ae5f3` |
| `src/workflow/implementation-preparation/SKILL.md`               | 4811   | `50510c75e684f753c972c61c3a523a1a59a9022b3ddfb78d73f60af024da46ea` |
| `src/workflow/task-increment/SKILL.md`                           | 23172  | `466fc0d9d5ba48a883c5346c310c5aac8b804f73a6e7e15a2552ff6a1077dc0a` |
| `build/distribution/export.ts`                                   | 15818  | `257f855a64760a597698d3bc4761ae4b8247371dfb470cb64d2626a1ece87ac1` |
| `build/distribution/models.ts`                                   | 2320   | `6da6a987f98477e902f3c18e16cf104303614637d2051d7ba0582e989707bf0b` |
| `build/distribution/references.ts`                               | 5783   | `62218af45bed52cdd03fdbb9c8ff6a0bcdda09bf7bd974a95e4db91c19bc67f0` |
| `build/distribution/validate.ts`                                 | 15788  | `d4e32c378047daa335cb354a6c3853bef155aeb1cd3efda469d93306d87a561d` |
| `build/distribution/verify.ts`                                   | 10976  | `6ce908684c5dfe0b632c60468b26294b069ed9d801445acdf96d5ab3bb3c2bc8` |
| `build/plugins/content.ts`                                       | 3319   | `dabc8a3c50bfa79f6dd485560a778e470a6fc5702837b07d2764a481eab9b3e1` |
| `build/publish.mjs`                                              | 23023  | `b8025775f07a9bf865242ede20f7b68752814194ca338c1d88d727bea5026ae4` |
| `script/index.mjs`                                               | 6411   | `59a62e35956c7b475c6e9dfacde1ff3ee9f8161644dd6f1cf97f8cb9b3d482e3` |
| `script/install-skills/README.md`                                | 2371   | `3911908a0d639a1bf8645d8b50624791a6b9f98ad7945422237c38359be39abc` |
| `script/install-skills/install-skills.ps1`                       | 23736  | `7c16ffdf8b8f6f3e13f6b303ed3bb61c40c6c54492b3b27d2f7bdec848b0da29` |
| `script/install-skills/install-skills.sh`                        | 22351  | `df8a59aa188e5b6145e6eafd020774856fd2c38570586ad29f3f05f6266864e3` |
| `script/install-skills/read-agents.mjs`                          | 9779   | `c60d0d914c7120eb370db5cb0abb783d4ce683ad20eb719b6daa083c7fb15771` |
| `script/lib/managed-state.mjs`                                   | 7811   | `f1edee93082d7762ab5a954c5d8f8030a4afc28bf7a4fc6253efddeaa1b0ee34` |
| `script/mount-entry/README.md`                                   | 2108   | `0e65e79702198e0f0a2d40412e9c3fa5076f665b2ce0b93b62bb98a2bf21b042` |
| `script/mount-entry/mount-entry.ps1`                             | 15228  | `ae493d20109770f2282bfbc7ccd1f6010e0cc2fe37ff155d3c75591636fb7073` |
| `script/mount-entry/mount-entry.sh`                              | 20775  | `660e72708c8ce1e183954c82a00beceab69849d4523d1f87102925669f88499a` |
| `script/register-commands/README.md`                             | 3472   | `bd637c329c05f4fe3c7b70c3c13cd13437b55943a5aa0b9d6eb6376341cef82c` |
| `script/register-commands/legacy-source-hashes.json`             | 3749   | `2e743edd9323f81f05f59e3596835624a49a45f104bd55985e13b9a316bf2d29` |
| `script/register-commands/prepare-command.mjs`                   | 2267   | `3aef93e3d2462032b4c307be8eb9489b7f984c5548b07e9c5ad73e04a5e8f3b3` |
| `script/register-commands/register-commands.ps1`                 | 4316   | `860282e8c9969e2721f6879812176a473688d9b6f32239cb94fc54cb1f832868` |
| `script/register-commands/register-commands.sh`                  | 2000   | `24ff028e43863361b041be1f759c96bf6d36a1a57ebacd21eb3de211b43348a0` |
| `script/register-hooks/README.md`                                | 2089   | `c97697777439b8394e058e6327c7a353e14f80fa40ad93c99709a5a7dcde8a8e` |
| `script/register-hooks/prepare-hooks.mjs`                        | 4219   | `a2ad99fe36dd28f9ea3f48d515ec88c9be3e8d10685327b5844168ca8ca46263` |
| `script/register-hooks/register-hooks.ps1`                       | 4475   | `4208e31e52e8b70a362674fd19e5314f0831387e3e8127e2949e40798003725b` |
| `script/register-hooks/register-hooks.sh`                        | 2913   | `8adc160b791f4860f4414b59be1b57164e8a904f7f67f8ac74ddc3c23c99a933` |
| `tests/build.test.mjs`                                           | 8319   | `af722bb837c2598c75167620745d82fe37b57104d0151317d8ea102e62f398a6` |
| `tests/commands.test.mjs`                                        | 1700   | `a5f23dd3a07a130b5470bf19c5202eaffc4326a9da1270dffb7fbdf8698ae935` |
| `tests/helpers/urgent-sandbox.mjs`                               | 11789  | `cca6db613513eb3ad79ae92f7b2a0f487f2bca37a25bd70e5eb4d204855f9ee8` |
| `tests/hooks.test.mjs`                                           | 3893   | `2d7d25e1d439a37b712a63596e60bb9ef4e9dd2220bd49fe4c354e6af06a545c` |
| `tests/official-install.test.mjs`                                | 11448  | `aa24f3ef7607211f3092c0d245e15857cddaeb88d107c057bfa43bf739a7724c` |
| `tests/publish.test.mjs`                                         | 10104  | `db1fa90c54fbb0078c8b188b7606cf3967e88b49546229864d4618c048160c58` |
| `tests/runtime.test.mjs`                                         | 8208   | `28940a0db33429d9e457ed71ba9a57792b3072ec93f64f4a19917b6f5e2ee7eb` |
| `tests/urgent-contract.test.mjs`                                 | 14752  | `e9681d2becdc59aeb1b2a8640eb83ba2e927b6c9ff3b29b377c3ec369fa5d6ba` |
| `vite.config.ts`                                                 | 481    | `3793f1dc51c4288b9c5483b6bb9613380bf787b3b3e39ef65e910500d6fbb531` |
| `README.md`                                                      | 3870   | `2da6819a37c69649623fb2f41d0a218f35955401c8d045edbbe85a846383099f` |
| `LICENSE`                                                        | 743    | `a2f402e931906baada87fa68625cec647d73e538fdd2d115f74d436674fb6dcb` |

### 协调者依赖复验

- pnpm --filter @foundry/skills-distribution-urgent install --ignore-scripts --prefer-offline：success，退出0；依赖警告不当产品验收，未触发全仓postinstall。
- 依赖就绪后严格check-types首次failed，原因是eslint.config.ts导入共享预设时缺声明（TS7016）；新包配置沿原恢复副本改用eslint.config.mjs并继续通过共享exports消费，没有新增声明或关闭严格选项。
- pnpm --filter @foundry/skills-distribution-urgent run check-types：复验success，退出0。
- 新位置初始lint：failed，98项；首轮自动修复后44项，后续继续在新包各模块职责内收口。未将格式检查失败记成业务成功，也未以此重做已核验的复制来源。
- T078来源、9项身份/附件/过滤配置、原件保护与依赖配置检查具备；T079风险骨架允许在已准备工具上实际运行，完整构建/消费仍未验。

依赖准备后的实际构建复验：pnpm --filter @foundry/skills-distribution-urgent run build退出1，产品准确报告“来源必须是独立Git根目录”。此为旧独立根假设尚未适配的真实产品失败，不再是缺vite的环境失败；未创建正式dist。后续T079保留工作区反例，T080适配输入身份。注册范围基线实际4项中2通过、2失败，失败明确落在managed-state旧调用参数，不以此否定来源复制或计挂载通过。

T078仅按自身Setup条件判定：实际来源与允许复制全集/排除项可追溯、9项正文附件完整、旧副本保护、workspace依赖与严格配置实际检查通过；已运行但未通过的产品lint/build明确列出并保留后续风险，不将T078完成扩展为产品通过。符合T078“未适配构建如实failed/not-run”的范围，允许T079消费已准备来源与工具。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
