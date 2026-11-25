# 仓库代码风格

本文记录仓库各工作区的工程约定、源码惯例和可追溯的手写样本。发布功能的 T001 于 2026-11-25 核对主线技能样本，同日扩展为全仓代码风格扫描。 [全仓扫描](#仓库全量扫描) · [T001 实施记录](implementation/T001.md)

## 按改动位置查阅

| 改动位置                      | 优先查阅                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 主线技能、Vite 插件、共享配置 | [工程约定](#当前工程约定)、[TS 与模块边界](#typescriptjavascript-和共享配置)、[构建插件与脚本模板](#主线构建插件与脚本模板) |
| 文档站                        | [Nuxt、Vue 和样式](#nuxtvue-和样式)                                                                                         |
| MCP 服务或 Python 工具        | [Python](#python)                                                                                                           |
| 安装、开发脚本、CI            | [Bash 与 PowerShell](#bashpowershell-和文件副作用)、[工作流和容器构建](#工作流和容器构建)                                   |
| 构建和安装验证                | [测试和夹具](#测试和夹具)                                                                                                   |

## 手写风格样本

用户手写分工由原始记录和迁移清单确认。下列源码片段取自迁移提交 `1a72446`，可用 `git show 1a72446:<路径>` 回查。后面的工程约定来自当前仓库。 [手写分工原始记录](../001-skills-distribution/requirements/raw/2026-11-12-track-ownership-and-repository.md) · [迁移清单](../001-skills-distribution/implementation/repository-migration-files.md)

### 配置声明与类型推导

集合配置用一个默认导出描述包名、MCP 标记和技能开关。同一技能的开关留在对应技能对象中。像 `coding` 这样的集合可直接从配置看出哪些技能启用。

```ts
import { defineCollectionHandle } from '#utils/define-collection-handle'

export default defineCollectionHandle({
  packageName: 'coding',
  mcp: false,
  skill: {
    'business-node-delivery': {
      enabled: false,
    },
    'document-changed-symbols': {
      enabled: true,
    },
  },
})
```

样本为 `1a72446:packages/skills/src/coding/collection.config.ts` 第 1–14 行。 [现行 coding 集合](../../../packages/skills/src/coding/collection.config.ts)

配置工厂接受有明确形状约束的对象，使用 `const T` 保留调用方的字面量类型。配置需要默认值时集中在工厂合并，让各集合直接声明自己的差异。

```ts
export function defineCollectionHandle<const T extends CollectionOption>(options: T): T {
  return options
}
```

样本为 `1a72446:packages/skills/utils/define-collection-handle.ts` 第 3–5 行。现行 `defineCollectionHandle` 用 `defu` 合并 `plugin` 和 `script` 默认值。 [现行配置工厂](../../../packages/skills/utils/define-collection-handle.ts)

### 模块边界与导入

模块以 ESM 写法组织。纯类型依赖用 `import type`，运行时读取文件的依赖用普通导入。Node 内置模块使用 `node:` 前缀。包内路径使用在 `package.json` 的 `imports` 中声明的别名。

```ts
import type { Plugin } from 'vite'
import type { CollectionOption } from '#utils/define-collection-handle'
import { globSync, readdirSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
```

样本为 `1a72446:packages/skills/build/plugins/vite-plugin-skill.plugin.ts` 第 1–7 行。Vite 入口通过 `#build` 引入并组装插件。 [现行包内导入映射](../../../packages/skills/package.json) · [现行 Vite 入口](../../../packages/skills/vite.config.ts)

### 插件职责与生命周期

配置层负责组装具名插件。现行插件工厂示例用 `Plugin` 返回类型声明接口，通过 `name` 和 `apply` 声明生效场景。将需要参与产物生成的逻辑放在 `generateBundle`，磁盘复制放在 `writeBundle`。历史技能插件在 `generateBundle` 清理虚拟入口的占位产物，再于 `writeBundle` 处理技能复制。插件组织形式按用户已确认的约定和现有加载协议选择。 [现行技能插件](../../../packages/skills/build/plugins/vite-plugin-skill/index.ts) · [用户确认的写法](#用户已确认的写法)

下面是现行入口插件的单一职责示例。读取安装模板、压缩并交付一个已知路径的资产。

```ts
export default function vitePluginCurl(): Plugin {
  return {
    name: 'vite-plugin-curl',
    apply: 'build',

    async generateBundle() {
      const source = await readFile(new URL(import.meta.resolve('#install.source.sh')), 'utf8')
      this.emitFile({ type: 'asset', fileName: 'curl/install.sh', source: minifyShellScript(source) })
    },
  }
}
```

样本为 `1bcc1bd:packages/skills/build/plugins/vite-plugin-curl/index.ts` 第 5–15 行的 `vitePluginCurl`。中文 JSDoc 覆盖以现行工程约定为准。

### 文件扫描、筛选与写出

扫描时先识别目录，再转换成后续需要的名字和路径，并显式排序。`availableSkills` 表示具备正文的来源目录。`enabledSkills` 表示配置中打开的技能。最终 `selectedSkills` 将两者合并为交付清单，分别记录 `source` 和 `target`。

```ts
const sourceDir = join(process.cwd(), 'src')
const entity = readdirSync(sourceDir, { withFileTypes: true })
  .filter(entry => !entry.isSymbolicLink())
  .filter(entry => entry.isDirectory())
  .map(entry => ({ name: entry.name, path: join(sourceDir, entry.name) }))
  .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)

const availableSkills = new Set(globSync('*/*/SKILL.md', { cwd: sourceDir })
  .map(file => dirname(join(sourceDir, file))),
)
```

样本为 `1a72446:packages/skills/build/plugins/vite-plugin-skill.plugin.ts` 第 24–33 行。同文件第 62–70 行在所有配置读取完成后筛选实际交付，再以 `Promise.all` 等待彼此独立的复制完成。保留这层先后关系，调用方更容易核对哪些输入会写到哪个目标。

### 命名、格式与短分支

中间值用业务含义命名，例如 `availableSkills`、`selectedSkills`、`source`、`target`，便于追踪数据从扫描到交付的变化。配置示例使用单引号、两空格缩进和对象尾逗号，语句省略行末分号。格式由目标 workspace 的 ESLint 核对。 [现行集合配置](../../../packages/skills/src/coding/collection.config.ts) · [技能包 ESLint 配置](../../../packages/skills/eslint.config.ts)

现行扫描器用早返回表达不参与后续扫描的分支。一个分支报告缺配置，另一个分支按当前参数跳过非普通文件。调用方可从这两个独立判断看清警告和跳过条件。

```text
const configuration = lstatSync(configurationPath, { throwIfNoEntry: false })
if (!configuration) {
  onMissingConfig?.(configurationPath)
  return
}
if (skipNonRegularConfig && !configuration.isFile())
  return
```

样本为 `1bcc1bd:packages/skills/utils/scan-skills.ts` 的 `scanCollections`。 [现行扫描器](../../../packages/skills/utils/scan-skills.ts)

## 当前工程约定

- **工程与依赖边界**。遵守各包的 ESM 和严格 TS 配置。跨包经 `exports` 和已声明的 workspace 依赖访问。主线和紧急版各自维护源码、脚本和构建输出。 [仓库约定](../../../AGENTS.md)
- **改动声明的文档**。修改 JS、TS 或 Vue 前加载 `document-changed-symbols`。新增声明，或修改行为、签名、类型、初始值、业务含义时，在声明正上方写简体中文多行 JSDoc。检查范围涵盖函数、方法、局部变量、解构别名、类型、类字段和配置声明。对象属性、接口成员和枚举成员的语义收拢到外层 JSDoc。按需说明参数、返回值、字段与异常。注释说明意图或约束，例如排序对下游的影响、缺省值何时生效、什么时候会抛错。 [JSDoc 规范](../../../packages/skills/src/coding/document-changed-symbols/SKILL.md) · [扫描声明及异常示例](../../../packages/skills/utils/scan-skills.ts)
- **Vue 响应式和样式**。默认用声明式数据流，新增 watcher 须符合技能列出的例外。根据组件类型选用 UnoCSS 属性化或 Nuxt UI 的 `ui` 属性。 [响应式约定](../../../packages/skills/src/frontend/vue-reactivity/SKILL.md) · [样式约定](../../../packages/skills/src/frontend/nuxt-ui-styling/SKILL.md)
- **按工作区验证**。代码 lint 和类型检查用目标包入口，按变更范围运行已有测试。Markdown 走 `pnpm exec eslint --fix`。区分验证失败、缺前置与未执行。 [仓库约定](../../../AGENTS.md) · [根任务编排](../../../turbo.json)

现行 `defineCollectionHandle` 的注释描述了参数、合并规则和返回值，可以直接对照。

```ts
/**
 * 使用 defu 合并传入配置与默认配置，传入值优先，插件扫描与脚本交付默认关闭。
 *
 * @param options 集合内容与交付选项。
 * @returns 带默认插件及脚本开关的集合配置。
 */
export function defineCollectionHandle<const T extends CollectionOption>(options: T) {
  return defu(options, { plugin: false, script: false })
}
```

样本为 `1bcc1bd:packages/skills/utils/define-collection-handle.ts` 第 41–49 行。 [现行 JSDoc 示例](../../../packages/skills/utils/define-collection-handle.ts)

评审改动时，按顺序核对入口和接口是否沿用现有约定、数据名称能否对应各阶段的值、写出前是否完成必要检查、改动声明的注释是否齐全，再运行目标包 lint 与类型检查。 [本次复跑基线](implementation/T001.md#实际复跑结果)

## 仓库全量扫描

2026-11-25，以 `1bcc1bd` 为 HEAD 盘点 Git 索引和非忽略的工作区文件，共 1,035 条路径。其中 1,011 条受 Git 跟踪，含一条工作区已删除的路径，另有 24 条未跟踪。按目录和文件类型检查范围，逐文件读取 241 个工程源码、构建和执行配置、依赖锁或测试夹具。对 Python 文件另做语法树检查，按语言和用途读源码复核代表性写法。扫描包括当时工作区内的 5 个未跟踪 Python 源码及测试文件。

| 范围                        | 读取文件数 | 用途                                                                                        |
| --------------------------- | ---------: | ------------------------------------------------------------------------------------------- |
| 现行工程目录、仓库配置和 CI |        168 | 主线技能 73、紧急版 42、共享预设 15、文档站 12、MCP 8、开发脚本 9、工作流及示例 4、根配置 5 |
| 保留的旧脚本与退役源码      |         40 | 核对历史写法和现行实现的差异                                                                |
| Spec Kit 工作流与入口       |         17 | 识别上游派生脚本和本仓库的扩展配置                                                          |
| 合成或第三方测试夹具        |         16 | 核对测试输入和夹具来源                                                                      |

路径盘点覆盖文档、历史和项目记录。私有记录、编辑器及本机配置只统计路径，忽略的依赖、缓存、安装副本和生成物在扫描范围之外。现行工程一栏按目录计数，也包含暂留包装器和引用退役对象的测试。风格以仓库约定、用户决策和对应入口源码为依据。 [仓库约定](../../../AGENTS.md) · [第三方夹具来源](../../../licenses/README.md)

### 用户已确认的写法

- 构建插件职责独立，在各自模块扫描所需来源，由 Vite 入口组装，避免用一个大函数容纳全部插件或自建共享上下文。用户已取消强制组合式函数或工厂封装，也取消声明必须置于工厂内部的要求。主线引擎当前会调用动态子插件的默认导出工厂。这是该入口的加载协议，普通模块的组织可按职责选择。 [原始决定](../001-skills-distribution/requirements/raw/2026-11-11-independent-plugins.md#后续移除写法约束) · [职责与范围](../001-skills-distribution/requirements/discussions/2026-11-11-independent-plugins.md#取消组合式函数写法) · [现行子插件加载](../../../packages/skills/build/plugins/vite-plugin-engine/index.ts)
- 安装入口以源脚本交给构建处理。用户在原始讨论中选定先做一个 `install.sh`，抽象留到逻辑确定时，并要求安装按环境检查、下载、完整度校验推进。消费端使用临时目录，新增依赖按安装入口需求准备，避免全局安装。现行 curl 插件读取源模板并压缩为构建资产。 [安装写法原始输入](../001-skills-distribution/requirements/raw/2026-11-14-install-shell-flow.md) · [curl 插件](../../../packages/skills/build/plugins/vite-plugin-curl/index.ts)

迁移记录确认主线保留了用户手写中间态。个人写法以能回查的历史样本和以上直接决定为依据。现行代码含不同阶段和来源的实现，下面记录可用于同包改动的惯例及例外。 [迁移执行记录](../001-skills-distribution/implementation/repository-migration-execution.md) · [手写样本](#手写风格样本)

## 分语言与场景的源码惯例

### TypeScript、JavaScript 和共享配置

- 主线和共享预设常用两空格、单引号、语句末省略分号、多行对象和数组尾逗号。类型依赖独立使用 `import type`，Node 内置模块使用 `node:`，短分支用卫语句。共享 ESLint 采用 Antfu 预设，实际校验按 workspace 配置。CSS 声明仍使用分号，TS 个别表达式有用于自动分号插入防护的前置分号。 [共享 ESLint](../../../packages/preset-config/src/eslint-config/index.ts) · [资产复制插件](../../../packages/preset-config/build/plugin/copyJsonAssets.plugin.ts) · [前置分号实例](../../../packages/preset-config/src/utils/defu-replace-array.ts) · [站点 CSS](../../../apps/docs/app/assets/css/main.css)
- 共享类型配置为严格 ESNext 和 Bundler 解析，启用 `noUncheckedIndexedAccess` 与 `verbatimModuleSyntax`。主线启用 `erasableSyntaxOnly`，遵循 `#build`、`#utils` 等包内 `imports` 和现有 `.ts` 相对导入惯例。紧急版单独采用 ES2023、NodeNext 和 `exactOptionalPropertyTypes`，使用 `.js` 相对导入，构建入口也有类插件。跨包从各包声明的 `exports` 和 workspace 依赖进入。 [共享 TSConfig](../../../packages/preset-config/src/tsconfig-json/tsconfig.json) · [预设公开入口](../../../packages/preset-config/package.json) · [主线 TSConfig](../../../packages/skills/tsconfig.json) · [主线包内导入](../../../packages/skills/package.json) · [紧急版 TSConfig](../../../packages/skills-distribution-urgent/tsconfig.json) · [紧急版类插件](../../../packages/skills-distribution-urgent/build/plugins/content.ts)
- 配置入口以 `const` 泛型保留调用方的字面量类型。目录扫描先验证文件和配置，再挑选与排序；紧急版外部数据边界可见 `unknown`、类型收窄和显式返回类型。按模块现有职责采用这些写法。新增和语义变化的声明遵守中文多行 JSDoc，旧代码中已有单行注释和未注释声明。 [主线配置工厂](../../../packages/skills/utils/define-collection-handle.ts) · [目录扫描器](../../../packages/skills/utils/scan-skills.ts) · [紧急版边界验证](../../../packages/skills-distribution-urgent/build/distribution/validate.ts) · [JSDoc 规范](../../../packages/skills/src/coding/document-changed-symbols/SKILL.md)
- **命名与职责**。函数和值用 `camelCase`，类型、接口和类用 `PascalCase`。用 `directory`、`packageName`、`source`、`target` 表示各阶段数据的含义。主线插件目录用 `vite-plugin-*`，入口一般为 `index.ts`，配套 Bash 用 `*.source.sh`。文档站 Vue 组件用 PascalCase 文件名，动态路由文件按 Nuxt 的目录约定。 [技能扫描器](../../../packages/skills/utils/scan-skills.ts) · [引擎插件](../../../packages/skills/build/plugins/vite-plugin-engine/index.ts) · [文档站导航组件](../../../apps/docs/app/components/DocsSidebar.vue)
- **默认值、可选值和解析结果**。配置默认值可集中在定义入口，布尔开关按实际含义判断。集合的 `publish === true` 表示明确参加发布，缺配置则按入口回调提示。外部字段先从 `unknown` 收窄再用，错误可带字段或路径。共享包清单里的 `catalog:*` 管工作区共享版本，Turbo 的 `^build` 声明上游产物依赖。 [配置工厂](../../../packages/skills/utils/define-collection-handle.ts) · [集合扫描](../../../packages/skills/utils/scan-skills.ts) · [字段校验](../../../packages/skills-distribution-urgent/build/distribution/validate.ts) · [依赖目录](../../../pnpm-workspace.yaml) · [任务编排](../../../turbo.json)

紧急版会先把解析值收窄为可读字段的对象，再处理具体字段。摘自 `validate.ts` 的 `record`。 [源码](../../../packages/skills-distribution-urgent/build/distribution/validate.ts#L19)

```ts
/**
 * 缩窄不可信 JSON 对象，数组、null 和原始值均拒绝。
 * @param value 待校验值。
 * @param field 当前字段路径。
 * @returns 只读使用的字段对象。
 */
function record(value: unknown, field: string): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), field)
  return value as Record<string, unknown>
}
```

### 主线构建插件与脚本模板

- **职责放到实际钩子**。技能复制插件在 `buildStart` 按配置选取技能、提示缺配置并检查安装名冲突，在 `generateBundle` 处理虚拟入口和发布资产，在 `writeBundle` 复制到磁盘。`selectedSkills` 在同次构建的校验阶段确定，后续钩子消费它。`Promise.all` 等待互不依赖的文件复制。 [技能插件](../../../packages/skills/build/plugins/vite-plugin-skill/index.ts)
- **保持路径含义和输出顺序**。本地磁盘路径用 `node:path` 的 `join`，模块文件用 `import.meta.url` 或文件 URL 定位。在交付索引里使用 POSIX 相对路径和明确排序。检查重名时可以保留归一化键与来源路径，报错同时显示冲突来源，输出保持原始目录名。 [路径与查重](../../../packages/skills/build/plugins/vite-plugin-skill/index.ts#L147) · [稳定映射](../../../packages/skills/build/plugins/vite-plugin-skill/index.ts#L115) · [脚本模板路径](../../../packages/skills/build/plugins/vite-plugin-engine/install-script.ts)
- **模板只注入构建数据**。引擎逻辑放在可直接阅读的 Bash 源文件。TS 读取模板时检查插入位置只出现一次，再对每条路径做 Bash 字面量转义，结果由插件交付。模板与生成逻辑分别维护，入口资产名从 `emitFile` 回查。 [模板注入函数](../../../packages/skills/build/plugins/vite-plugin-engine/install-script.ts) · [引擎插件](../../../packages/skills/build/plugins/vite-plugin-engine/index.ts)

已校验的来源和目标交给写出钩子。摘自 `vite-plugin-skill/index.ts` 的 `writeBundle`。 [源码](../../../packages/skills/build/plugins/vite-plugin-skill/index.ts#L223)

```text
/**
 * 将已选中的技能正文及附件复制到当次构建输出。
 */
async writeBundle() {
  await Promise.all(selectedSkills.map(({ source, target }) => cp(source, target, { recursive: true })))
},
```

### Nuxt、Vue 和样式

- 文档站 5 个 Vue 文件均用 `<script setup lang="ts">`。导航使用 Nuxt 的 `useAsyncData`、`useRoute` 与声明式模板绑定，移动端目录依赖路由 `key` 重置。站点当前未调用 watcher。响应式修改遵循仓库技能，派生值用 `computed`，交互通过状态、props、事件和模板绑定表达。 [导航组件](../../../apps/docs/app/components/DocsSidebar.vue) · [移动目录布局](../../../apps/docs/app/layouts/default.vue) · [响应式约定](../../../packages/skills/src/frontend/vue-reactivity/SKILL.md)
- 现行站点用 UnoCSS Wind3、Attributify 和 Typography。属性冲突时使用 `un-` 前缀，全局 CSS 处理基础样式。仓库另有 Nuxt UI 的 `ui` 和 `tw:` 样式约定，按组件实际使用的样式入口应用。 [UnoCSS 配置](../../../apps/docs/uno.config.ts) · [Nuxt 配置](../../../apps/docs/nuxt.config.ts) · [Nuxt UI 样式约定](../../../packages/skills/src/frontend/nuxt-ui-styling/SKILL.md)
- **路由与数据共用标识**。页面把规范路径用于请求键和内容查询，查无文档时生成实际 404。页面目录接收 `links`，在页面绑定处处理缺省数组。导航的选中状态同时反映到 `aria-current`，布局用原生 `details`、`summary` 和跳到正文链接实现交互。 [内容页](../../../apps/docs/app/pages/[...slug].vue) · [目录组件](../../../apps/docs/app/components/DocsTableOfContents.vue) · [导航组件](../../../apps/docs/app/components/DocsSidebar.vue) · [默认布局](../../../apps/docs/app/layouts/default.vue)
- **样式写法与生效验证**。原生和非 Nuxt UI 组件使用 `flex="~"`、`items="center"` 这样的取值式属性。与组件 prop 或 HTML 属性同名时核对前缀，例如 `NuxtLink` 的 `un-text`。Nuxt UI 组件改样式时先查实际 slot 和 variant，再写 `ui` 中的 `tw:` 类。构建后检查相应规则是否进入产物 CSS。 [导航组件](../../../apps/docs/app/components/DocsSidebar.vue) · [Nuxt UI 样式约定](../../../packages/skills/src/frontend/nuxt-ui-styling/SKILL.md)

移动目录用路由地址作组件键，页面切换时由 Vue 重建原生 `details`。摘自默认布局。 [源码](../../../apps/docs/app/layouts/default.vue#L27)

```text
<details :key="route.path" block="~" un-hidden="lg:~" my="5" border="~ slate-200" rounded="lg" bg="white">
  <summary p="4" cursor="pointer" text="sm" font="medium">
    浏览文档
  </summary>
  <div p="4" border="t slate-100">
    <DocsSidebar />
  </div>
</details>
```

### Python

- **注解与数据模型**。扫描时 20 个现行 `.py` 文件均有简体中文模块 docstring。MCP 中普遍给函数标注参数与返回值，使用 `list[T]` 和 `T | None`。校验后的清单条目用冻结 dataclass 表示，附件集合用 tuple。主线技能测试 helper 的函数注解密度和引号风格随模块而异。 [MCP 清单](../../../apps/mcp/src/foundry_skills_mcp/registry.py) · [主线测试 helper](../../../packages/skills/tests/conversation-workflow/helpers/recording-host.py)
- MCP 的 `pyproject.toml` 和 uv 锁属于该应用。现有工程配置里未发现全仓统一的 Python 格式化或类型检查规则。 [MCP 项目配置](../../../apps/mcp/pyproject.toml) · [主线 Python 测试](../../../packages/skills/tests/test_mvu_documents.py)
- **模块、模型与 I/O**。MCP 代码通常用四空格、模块顶部 docstring、`from __future__ import annotations` 及导入分组。数据路径用 `Path`，文本读写时明确 UTF-8。函数和变量用 `snake_case` 命名，类用 `PascalCase`，模块常量可见大写模式。清单读取、条目校验和 FastMCP 注册分别位于各自函数，注册入口接收已校验条目。 [清单读写与模型](../../../apps/mcp/src/foundry_skills_mcp/registry.py) · [服务注册与入口](../../../apps/mcp/src/foundry_skills_mcp/server.py)
- **CLI 与异常边界**。MCP 先区分清单路径缺失、读写或 JSON 失败、结构不符，再在条目层定位缺失字段。包装 I/O 和解析异常时保留异常链。`argparse` 接收可注入的 `argv`，模块入口通过 `sys.exit(main())` 传递退出码。主线测试 helper 也有直接消费 `sys.argv` 的入口。 [清单错误](../../../apps/mcp/src/foundry_skills_mcp/registry.py#L100) · [MCP 命令入口](../../../apps/mcp/src/foundry_skills_mcp/server.py#L81) · [测试 helper 入口](../../../packages/skills/tests/conversation-workflow/helpers/recording-host.py)

读取失败保留原异常，读出 JSON 后检查顶层结构。摘自 MCP 的 `load_manifest`。 [源码](../../../apps/mcp/src/foundry_skills_mcp/registry.py#L110)

```python
try:
    data = json.loads(path.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    raise ManifestError(f"清单 {path} 解析失败：{exc}") from exc
if not isinstance(data, dict) or not isinstance(data.get("skills"), list):
    raise ManifestError(f"清单 {path} 结构非法：缺少 `skills` 数组")
return data
```

### Bash、PowerShell 和文件副作用

- **脚本结构和输出**。主线 3 份 Bash 安装模板用 `#!/usr/bin/env bash` 和 `set -euo pipefail`，常见两空格缩进、`snake_case` 和 `printf ... >&2`。引擎完成子脚本和执行计划预检后再按序运行。隐藏安装的结果区分已处理、跳过和失败。 [curl 模板](../../../packages/skills/build/plugins/vite-plugin-curl/install.source.sh) · [引擎模板](../../../packages/skills/build/plugins/vite-plugin-engine/install.source.sh) · [隐藏安装模板](../../../packages/skills/build/plugins/vite-plugin-engine/sub-plugins/vite-plugin-hidden-install/hidden-install.source.sh)
- 开发挂载脚本为失败阶段和退出码留记录，从临时位置准备内容后提交；开发链接脚本仍可见大写路径变量和 `echo`。紧急版及主线 `script/old` 中的 4 对 PowerShell 脚本逐字节相同，可回查 `-LiteralPath`、动词名词函数和 `try/finally`。紧急版的正式验证范围为 Linux、Codex、项目级。Spec Kit 的 Bash 入口有上游派生来源。 [开发挂载](../../../scripts/dev/mount-speckit.sh) · [开发链接](../../../scripts/dev/actions/link-skills/link-skills.sh) · [PowerShell 样本](../../../packages/skills-distribution-urgent/script/mount-entry/mount-entry.ps1) · [紧急版验证范围](../../../packages/skills-distribution-urgent/README.md) · [夹具来源](../../../licenses/README.md)
- **参数、路径和进程退出**。用 `case` 区分开关与位置参数，用 Bash 数组保存及转发每个参数，用双引号保留路径边界。对可能带空格或换行的文件路径，现行安装器用 `find -print0` 和 `read -r -d ''`。脚本在调用点捕获退出码，分别报告安装、后置步骤和已完成项。 [curl 参数与复制](../../../packages/skills/build/plugins/vite-plugin-curl/install.source.sh) · [引擎子进程](../../../packages/skills/build/plugins/vite-plugin-engine/install.source.sh)
- **临时资源和目标目录**。依赖检查先于临时目录与安装动作。创建单次运行专用目录后立即注册 `EXIT` 清理，并将依赖安装结果和缓存放在目录内。写入目标前检查现存项，多个操作依赖同一份状态时参照隐藏安装脚本的锁和结果文件。 [下载与清理](../../../packages/skills/build/plugins/vite-plugin-curl/install.source.sh#L18) · [目录锁](../../../packages/skills/build/plugins/vite-plugin-engine/sub-plugins/vite-plugin-hidden-install/hidden-install.source.sh)

依赖缺失时在创建临时目录前退出。摘自主线 curl 模板的依赖检查。 [源码](../../../packages/skills/build/plugins/vite-plugin-curl/install.source.sh#L18)

```bash
for tool in curl node npm tar uv; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf '缺少依赖：%s，请先安装。\n' "$tool" >&2
    exit 2
  fi
done
```

### 工作流和容器构建

- `.github/workflows` 中有 3 个实际工作流文件和 1 个生产示例。release 调用通用工作流，部署按目标管理并发，使用最小所需权限、触发提交的 SHA 和不持久化凭据的检出方式。构建、排序打包、摘要和上传各用独立具名步骤，普通配置从 `vars` 读取，凭据用 `secrets` 引用。目前测试入口的 `passed` 仍是占位输出。 [release 调用](../../../.github/workflows/skills-deploy-release.yml) · [通用工作流](../../../.github/workflows/skills-deploy-common.yml) · [测试占位](../../../.github/workflows/skills-test.yml) · [生产示例](../../../.github/workflows/skills-deploy-prod.yml.example)
- Dockerfile 使用指定镜像标签的 mise 构建阶段和 `scratch` 产物阶段，容器归档的目录为 `engine` 与 `skill`。通用工作流另行归档整个 `dist`。查看构建或归档惯例时，应按具体入口核对上下文、命令和产物范围。 [容器入口](../../../packages/skills/deploy/Dockerfile) · [通用工作流打包](../../../.github/workflows/skills-deploy-common.yml)
- **工作流接口与结果传递**。用稳定的英文标识供 YAML 和调用者引用，面向执行日志的步骤 `name` 用简洁中文。`workflow_call` 声明输入、输出和凭据，调用者用 `needs` 读取前置结果。机器读取的输出写到 `$GITHUB_OUTPUT`，供人查看的摘要写到 `$GITHUB_STEP_SUMMARY`。 [测试工作流](../../../.github/workflows/skills-test.yml) · [release 工作流](../../../.github/workflows/skills-deploy-release.yml) · [通用工作流](../../../.github/workflows/skills-deploy-common.yml)

### 测试和夹具

- Node 分发测试常用 `node:test` 和 `node:assert/strict`，以中文描述预期行为。临时目录用 `t.after` 或 `finally` 清理，子进程用参数数组，按用例显式设置 `cwd`、`env` 和超时。对退出码、标准输出和真实产物分别断言。会话工作流中也有直接运行的顶层探针，主线分发入口分别记录通过、失败、未执行和部分执行。 [技能构建测试](../../../packages/skills/tests/distribution/vite-plugin-skill.test.mjs) · [挂载回归](../../../packages/skills/tests/distribution/speckit-mount.test.mjs) · [会话探针](../../../packages/skills/tests/conversation-workflow/recording-host.test.mjs) · [分发测试入口](../../../packages/skills/tests/distribution/test-distribution.mjs)
- MCP 用 pytest 的 `tmp_path`、合成清单、`raises(match=...)` 和每例独立的 FastMCP 实例。主线 Python 从包脚本启动 `unittest discover`，常用 `TemporaryDirectory`、`addCleanup`、显式子进程参数和产物读回。 [MCP 清单测试](../../../apps/mcp/tests/test_registry.py) · [MCP 服务测试](../../../apps/mcp/tests/test_server.py) · [主线测试入口](../../../packages/skills/package.json) · [主线安装回归](../../../packages/skills/tests/test_register_commands.py)
- 退役脚本及夹具可作为历史对照。主线有两份旧 Node 工作流测试仍引用已移除的工作流文件，`test_shadow_runtime.py` 明确读取退役运行时。验收以当前入口和实际运行结果为准。 [旧工作流测试](../../../packages/skills/tests/distribution/pipeline-workflow.test.mjs) · [旧归档测试](../../../packages/skills/tests/distribution/runner-archive.test.mjs) · [退役运行时测试](../../../packages/skills/tests/test_shadow_runtime.py) · [原基线结果](implementation/T001.md#实际复跑结果)
- **从入口验证行为**。挂载测试用真实 Vite 钩子生成内存资产，读取脚本并通过 Bash 执行，只用临时记录器替换外部 `specify`。用例检查真实状态、输出文件和临时目录。失败场景也断言后续调用数及清理结果。 [内存构建与调用边界](../../../packages/skills/tests/distribution/speckit-mount.test.mjs#L41) · [失败与清理用例](../../../packages/skills/tests/distribution/speckit-mount.test.mjs#L126)

挂载测试让同一用例保留退出码证据，并验证失败后只调用一次外部 CLI、临时目录为空。摘自失败回归。 [源码](../../../packages/skills/tests/distribution/speckit-mount.test.mjs#L136)

```javascript
/**
 * 失败码必须由实际 Bash 的退出状态观察。
 */
const result = run(root, assets[0].source, 23)
assert.equal(result.status, 23, result.stderr)
assert.equal(readFileSync(join(root, 'project/calls.jsonl'), 'utf8').trim().split('\n').length, 1)
assert.deepEqual(readdirSync(join(root, 'temporary')), [])
```

本次全仓扫描为静态核查。T001 的隔离构建和测试另有复跑记录。 [T001 复跑结果](implementation/T001.md#实际复跑结果)
