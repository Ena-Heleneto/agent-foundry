# 技术流程图：统一包核验与独立结果

## 主线 R2 部署与产物交接

```mermaid
flowchart TD
    E["feature/init push 或 workflow_call"] --> R["skills-deploy-release"]
    R --> T["skills-test 固定返回 passed=true"]
    T -->|"通过，target=release"| C["skills-deploy-common 按环境分组"]
    P["skills-deploy-prod.yml.example"] -.->|"生产待接入，target=prod"| C
    C --> I
    subgraph J["同一个 runner job"]
        I["绑定目标环境，检出 github.sha"] --> A["安装依赖"]
        A --> D["构建技能包的工作区依赖"]
        D --> B["构建技能包"]
        B --> Z["将 dist 打成压缩包"]
        Z --> H["记录归档 SHA-256"]
        H --> U["上传压缩包和安装脚本到对应 R2"]
    end
    U -->|"两份文件上传成功"| S["记录本次运行的 R2 目录"]
    U -->|"失败"| F["记录失败及本次尝试"]
```

公共工作流为同一目标开启 `cancel-in-progress`。测试部署的 `push` 入口限定 `feature/init`，分支删除事件跳过部署。真实推送与测试桶回读待验收。[部署分析](analysis/spec-analysis/README.md#维护者流水线r2发布与独立迁移) · [流水线契约](contracts/pipeline.md#2026-11-23-按环境上传构建产物)

## 主线同包引擎调度

```mermaid
flowchart TD
    A[核验同版归档并记录技能复制结果] --> B{有适用挂载或显式隐匿吗}
    B -->|是| C[调用同包 engine/install.sh 一次]
    B -->|无| D[保留安装结果]
    C --> E[按本次成功集合执行适用脚本]
    E --> F[记录后置结果及退出码]
```

`--no-mount` 和部分复制失败都关闭挂载。显式隐匿仍可处理已成功项，复制失败保留原复制退出码。入口源码位于 `packages/skills/build/plugins/vite-plugin-curl/install.source.sh` 和 `packages/skills/build/plugins/vite-plugin-engine/install.source.sh`。[当前调用契约](contracts/mount.md#主线现行挂载入口)

## 2026-11-19 安装后经引擎调用子脚本

```mermaid
flowchart LR
  A[安装源复制技能成功] --> B{是否跳过挂载}
  B -->|否| C[engine/install.sh]
  C --> D[预检查本次子脚本]
  D --> E[按路径顺序 Bash 调用]
  E --> F[首次失败停止并返回原码]
  B -->|是| G[保留纯安装结果]
```

代码位置：`build/plugins/vite-plugin-curl/install.source.sh` 调用入口，引擎 `build/plugins/vite-plugin-engine/index.ts` 收集本次输出，`install-script.ts` 生成入口正文。全部位置以 `packages/skills/` 为根；路径解析以同包入口位置为准，业务脚本仍在目标项目目录运行。实际证据见 [T077](implementation/T077.md)。

## 2026-11-18 配置加载时发现集合子插件

```mermaid
flowchart LR
    A[Vite加载配置] --> H{集合 plugin 为 true}
    H -->|是| B[扫描单数 plugin 目录固定入口]
    H -->|否| I[跳过集合子插件]
    B --> C[按集合名和插件名排序]
    C --> D[依次导入并调用默认工厂]
    D --> E[返回插件数组]
    E --> F[Vite解析异步和嵌套结果]
    F --> G[Vite执行实际构建钩子]
```

大白话：引擎只把集合里的插件找出来并创建，什么时候运行构建逻辑由 Vite 负责。目标代码位置：`packages/skills/build/plugins/vite-plugin-engine/index.ts` 及 `packages/skills/vite.config.ts` 接线；扫描模式为 `src/*/plugin/vite-plugin-*/index.ts`，坏入口使配置加载失败，无入口正常返回空数组。本轮新增默认关闭的配置开关并补齐引擎接线，验证以实际执行为准，不据此认定挂载脚本生成或 curl 回迁已完成。

## 2026-11-16 最新入口与固定统一包

当前设计替代旧双包、manifest及helper下载前提。图示不是已通过证据，代码和字段见[curl契约](contracts/curl-delivery.md)。

```mermaid
flowchart LR
    A[最新已发布install入口] --> B[一次固定release记录]
    B --> C[所选版本唯一统一包]
    C --> D[长度与SHA核验]
    D --> E[成员安全预检后私有解包]
    E --> F[根VERSION与技能映射核对]
    F --> G[本次选择与依赖核验]
    G --> H[目标同文件系统逐技能提交]
    H --> I[完整installed与reused集合]
```

大白话：入口可更新，历史技能和运行脚本始终来自所选历史统一包；包失败时不能安装或执行hidden，不再下载第二包。位置：现有install.source.sh及计划的发布记录/工程驱动；源码仍是基础MD5复制，新链待实施。

## 2026-11-16 隐匿失败不抹去安装成功

```mermaid
flowchart TD
    A{统一包与所选技能通过核验吗} -->|否| B[停止技能提交与辅助执行]
    A -->|是| C[安装并记录完整成功集合]
    C --> D{本次开启hidden吗}
    D -->|否| E[hidden跳过且零排除写入]
    D -->|是| F{同包hidden模块及协议有效吗}
    F -->|否| G[不执行未知模块]
    G --> H[保留安装 hidden失败 总体部分失败]
    F -->|是| I[模板候选与选择及成功集合取交集]
    I --> J[核对本地Git和未跟踪精确路径]
    J --> K[保留去重追加并验证实际效果]
    K --> L{实际隐匿成功吗}
    L -->|否| H
    L -->|是或明确不适用| M[分别报告真实结果及限制]
```

大白话：容错只针对包已可信之后的隐匿步骤；发布前缺必需hidden仍应拒绝正式候选。位置：install.source.sh和hidden-install.template.ts，模板已有Git/排除基础，成功集合/接口标记/完整报告待原任务实施。共享配置、tracked内容及项目外路径不误报隐藏。

## 2026-11-18 内容生成与流水线统一归档

```mermaid
flowchart LR
    A[TS集合与正文附件] --> B[技能插件独立扫描复制]
    A --> C[脚本插件扫描并派生hidden]
    S[安装源install.source.sh] --> K[curl插件原字节交付install.sh]
    K --> E
    V[package.json.version] --> D[版本插件输出根VERSION]
    B --> E[可检查开发dist]
    C --> E
    D --> E
    E --> F[流水线检查获准三分类及模板路径]
    F --> G[核对身份依赖附件说明和许可证]
    G --> H[正式暂存及非执行技能映射]
    H --> I[目录外生成一个统一tar.gz]
    I --> J[解包全集字节对照并冻结该次归档]
```

大白话：插件只生成内容，正式归档由后续流水线完成；开发dist不直接全量发布。位置：vite-plugin-skill、vite-plugin-script、vite-plugin-version与负责安装入口原字节交付的vite-plugin-curl，复用scan-skills.ts及计划的build/ci。图示为迁移目标，Tasks后协调者按局部授权迁移hidden模板到script插件目录，并核对唯一输出；当前未由本图证明构建成功。逐文件证据留包外，不新增随包JSON；双构建比较内容，不要求两个压缩包哈希相同。

## 后置阶段的 R2 固定发布与版本表

```mermaid
flowchart TD
    A[冻结候选及完整门禁] --> B{迁后真实目标及具体授权满足吗}
    B -->|否| C[保留本地结果 不发布]
    B -->|是| D[条件创建固定包与固定入口]
    D --> E[读回源站及匿名公开字节]
    E --> F{全部固定对象核验成功吗}
    F -->|否| G[保留已发生事实和旧版本 不登记成功]
    F -->|是| H[读取 R2 当前版本表]
    H --> I[条件更新兼容入口并核验]
    I --> J[维护 R2 的唯一版本表]
    J --> K[分别核对发现结果 冲突停止并读回]
```

上传、远端核验、入口更新和版本表更新各自留证。固定对象核验通过后才更新 R2 版本表。更新方式及断连、竞争、缓存的验证留后续流水线。当前构建阶段只核对本地产物。

<details>
<summary>历史技术图（旧入口与旧推进顺序，当前依赖以logic-flow为准）</summary>

2026-11-10 按当前 spec、plan 与数据模型同步 Increment、实施准备、旧入口迁移及 Agent 在线来源；唯一公开入口仍为 node script/index.mjs。下图区分已具备的只读数据查询与后续安装、挂载流程，图示不代表完整平台或业务验收。来源：[plan.md](plan.md)、[data-model.md](data-model.md)。

## 本次优先交付链：构建及占位 → Actions → 真实挂载

```mermaid
flowchart TD
    A[旧构建已存档清退] --> B[唯一 Vite 配置读取来源并计划输出]
    B --> C[生成三目录 MCP Release及投影]
    C --> D[磁盘复核 纯安装及挂载占位失败验证]
    D --> E[实现 GitHub Actions 检查 候选 收据和发布流程]
    E --> F[隔离验证后实现真实 Spec Kit 挂载]
    F --> G[完整本地检查与交付验收]
    G --> H{迁后真实平台及指定候选获授权吗}
    H -->|否| I[保留本地或隔离结果 不发布]
    H -->|是| J[发布原已验字节并核对固定来源]
```

术语：占位只表示原生能力未实现，挂载请求非零且没有受管写入；关闭挂载时独立判断纯安装。Actions实现可以先行，正式full/ready仍等待真实挂载、完整门禁和真实平台；开发先后不改变运行时构建与候选的字节约束。

位置：packages/skills/vite.config.ts、build/plugins、build/distribution、script/mount-entry与计划的build/ci及skills workflow。依据[本轮顺序](requirements/discussions/2026-11-10-build-actions-mount-order.md)，详细任务见[逻辑图](diagrams/logic-flow.md)。本轮仅更新规划，没有实施或运行该新流程。

## 上传前内容与上传后平台身份

```mermaid
sequenceDiagram
    participant B as 构建与检查
    participant A as 平台归档
    participant G as 只读发布守卫
    B->>B: 固定payload 内容索引及检查证据
    B->>A: 上传固定内容
    A-->>B: 成功后返回真实payload归档ID和摘要
    B->>B: 生成独立平台收据
    B->>A: 单独保存收据
    A-->>B: 返回收据归档ID
    B-->>G: 精确两个ID及指定候选请求
    G->>A: 核对所属仓库 运行attempt 摘要及有效期
    A-->>G: 实际平台事实
    G->>G: 独立复算全部内容并核对检查成功
```

术语：payload是未来公开文件；内容索引说明这些字节；平台收据证明它们被哪次上传保存。ID在成功上传后才产生，不能预写进包含自己的归档；收据本身的ID由请求定位。具体字段见 [数据模型](data-model.md)，只有可信实际平台记录才能用于正式发布，合成材料仅用于隔离实验。

计划位置：build/ci/candidate.mjs、skills-check.yml与skills-release.yml；它们当前未实现，不代表已经上传或完成宿主验证。

## 安装与官方预检的 Agent 来源

```mermaid
flowchart TD
    A[每次调用查询官方 npm skills latest] --> B[校验同一发布包的版本与完整性]
    B --> C{规则读取成功吗}
    C -->|否| F[失败并保持目标零写入 不回退旧表]
    C -->|是| D[按本次规则解析所选 agent 与 scope]
    D --> E[核对选择 实际路径及已有内容冲突]
    E --> G{检查通过吗}
    G -->|否| F
    G -->|是| H{是否官方只读预检}
    H -->|是| I[报告实际版本及同版命令 不执行安装]
    H -->|否| J[进入平台已支持的安装流程]
```

术语：latest 是本次查询的渠道；version/integrity 是实际取得包的版本与完整性证据，同次规则和建议 CLI 一致，下次重查。自有技能 release 版本及来源提交仍固定。读取器只提供数据，不执行 CLI 入口、准备 npm 缓存或写目标；规则布局变化须明确失败。普通安装的后续能力仍受各任务实际支持范围限制。

实现位置：`packages/skills/script/install-skills/read-agents.mjs` 及安装平台脚本。构建原样复制脚本，不查询在线数据，不维护包根 distribution 或 agents.json。已有验证见[在线来源记录](analysis/acceptance/online-agent-source.md)，未宣称未来上游或完整跨平台通过。

## 单技能提交状态

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Reused: 归属及全部字节相同
    Pending --> Failed: 未知或修改冲突
    Pending --> Staged: 空目标下载暂存
    Staged --> Verified: 文件全集与摘要通过
    Staged --> Failed: 下载或核验失败
    Verified --> Installed: 提交前复查后完成目录提交
    Verified --> Failed: 目标变化或写入失败
    Reused --> [*]
    Installed --> [*]
    Failed --> [*]
```

术语：Pending＝待处理；Staged＝文件只在临时目录；Verified＝文件已验完整；Installed＝已经交付；Reused＝现有同版内容通过重验；Failed＝失败，不参与挂载。逐技能成功不等于整批成功。

计划位置：`packages/skills/script/install-skills/install-skills.sh` 及 .ps1 的安装与归属核验。

## 内部挂载顺序

```mermaid
flowchart TD
    A[明确版本与本次选择] --> B[核验实际技能和公共材料]
    B --> C{项目与环境适用吗}
    C -->|非Spec Kit| S[挂载跳过并保留安装结果]
    C -->|缺条件或冲突| F[挂载失败]
    C -->|可用| D[处理全部选中钩子映射]
    D --> E{钩子均成功或不适用}
    E -->|否| N[指令未执行]
    E -->|是| G{本次选择包含Increment吗}
    G -->|否| K[指令不适用]
    G -->|是| M{所选Increment自身文件齐备吗}
    M -->|否| X[报告缺项 保留安装 不补装]
    M -->|是| R[官方重装Increment并读回旧入口去留]
    R --> H[核验原生产物并分别汇报]
```

术语：公共材料＝独立取得的同版脚本与发布清单；映射＝技能需要注册哪些动作；原生产物＝Specify CLI实际创建的文件与配置。环境检查不是自动安装前置工具。仅本次所选 Increment 自身齐备后每次官方重装，不要求三暂停模式，技能安装可复用不代表命令跳过。

计划位置：`packages/skills/script/mount-entry/`、`register-hooks/`；已存在且复用：`packages/skills/script/register-commands/`。外部整体验收尚未通过。

## 精确排除的判定

```mermaid
flowchart TD
    A[请求hidden] --> B{明确项目自身git是目录吗}
    B -->|否| S[说明原因并跳过]
    B -->|是| C[筛选本次成功且项目内的独占路径]
    C --> D{路径被跟踪或属于共享配置吗}
    D -->|已跟踪| F[报告冲突失败]
    D -->|共享配置| L[保留可见并报告限制]
    D -->|独占未跟踪| E[追加精确规则且保留原文]
    E --> G[核验Git实际命中来源和效果]
    G --> H{规则生效吗}
    H -->|是| I[隐匿成功]
    H -->|否| J[隐匿失败但保留安装内容]
```

术语：hidden＝让Git普通未跟踪列表不显示本地文件；独占路径＝只含本次安装器拥有的内容；共享配置＝多个功能共同使用的文件，不能整体隐藏；命中来源＝实际让Git忽略该路径的规则位置。

计划位置：`packages/skills/script/install-skills/install-skills.sh` 及 .ps1 的 Git 排除能力。规范状态与公开返回格式见数据模型。

## 直接源码迁移、候选与来源身份（2026-11-10 更新）

```mermaid
flowchart LR
    A[明确的 Foundry 源码提交] --> B[记录直接迁移所需文件及调整]
    B --> C[当前版本隔离验证候选和流水线边界]
    C --> D[同源同依赖快照两次构建]
    D --> E[ReleaseCandidate 仅白名单文件]
    B --> F[用户直接迁入独立公开仓库]
    F --> G[新仓库维护配置依赖并按新源码检查构建候选]
    G --> U[上传固定内容后生成平台收据]
    U --> H[PublishRequest 绑定候选及两个归档ID]
    H --> I[Publication 独立候选树提交与版本 tag]
    I --> J[官方 tree 目录 URL]
    I --> K[脚本 raw 文件根 URL]
    J --> L[绑定同 repository 和 publishedRevision]
    K --> L
```

源码由用户直接迁移，新仓库维护依赖配置；本功能不导出工程包或生成配置投影。ReleaseCandidate 是白名单安装内容，与源码范围分别限定。迁移后的源码 SHA 变化，须在新仓库重建和重新授权。官方 tree URL 负责目录发现，raw URL 用于逐文件下载，两者对应同一发布提交；发布 SHA 与源码 SHA 分别保存。候选索引及 CI 报告在安装发布根之外。

计划位置：`packages/skills/build/ci/{run,candidate,publish}.mjs` 与两份 skills workflow，尚未实施；数据和调用见 [数据模型](data-model.md) 及 [流水线契约](contracts/pipeline.md)。本图是设计关系，不表示已经完成迁移或构建实验。

## 发布写入与核验分开记录

```mermaid
stateDiagram-v2
    [*] --> Checked: 默认分支检查通过
    Checked --> ContentFixed: 固定源码与公开文件身份
    ContentFixed --> Archived: 上传取得真实归档ID
    Archived --> Candidate: 独立收据及成功运行核对通过
    Candidate --> Rejected: 身份错误 过期 篡改或未授权
    Candidate --> Authorized: 独立仓库手动请求且守卫通过
    Authorized --> Published: 新 tag 创建成功
    Authorized --> Reused: 已有 tag 全部字节相同
    Authorized --> Rejected: 已有同版内容不同
    Authorized --> Unknown: 推送响应丢失
    Unknown --> Published: 读回证明本次已创建
    Unknown --> Reused: 读回已有相同内容
    Unknown --> Retryable: 读回证明未创建
    Unknown --> Partial: 无法核实远端事实
    Retryable --> Authorized: 相同候选重新授权核对
    Published --> Verified: 远端全文件及安装验证通过
    Reused --> Verified: 远端全文件及安装验证通过
    Published --> Partial: 远端核验失败
    Reused --> Partial: 远端核验失败
    Partial --> Verified: 仅重验既有固定来源通过
    Rejected --> [*]
    Verified --> [*]
```

Authorized 表示明确候选的发布授权通过；Published 表示写入已发生；Verified 表示该运行请求的远端校验通过，完整支持矩阵及独立使用者验收仍按原任务分别判断；Partial 保留已知 ref 和尚未验证的部分，不能重写成“从未发布”。响应丢失先读远端，未知状态不能盲目重推。并发请求仅尝试无 force 创建一个新 tag，以远端实际结果裁决；同版不同内容始终拒绝。

计划位置：`packages/skills/build/ci/publish.mjs`、release workflow 和 PipelineRun 报告；本期只在临时 bare Git 验证状态分支，真实 Actions/HTTPS/安装在迁后补证。Foundry 模式不会进入真实 Authorized/Published 阶段。

## 旧入口迁移中的用户内容保护

```mermaid
flowchart TD
    A[核对旧登记和明确受管路径] --> B{有未知附件 用户维护文件或归属不明吗}
    B -->|有| C[停止受影响官方调用 保留现场 报告冲突]
    B -->|无| D[官方同ID更新为仅Increment]
    D --> E[读取旧入口 登记及无关文件的实际变化]
    E --> F{符合当前集合并保护原内容吗}
    F -->|否| G[报告已写与未验 返回方案或修复记录]
    F -->|是| H[连续重试两次 核对旧入口不复活]
```

术语：受管＝有明确来源和官方登记的对象；未知附件＝无法证明属于可替换交付的额外内容；同 ID 更新＝官方先移除旧登记再注册新集合。仅检查明确受影响目录，不增加永久指纹或自动搬移用户文件。

计划位置：packages/skills/script/mount-entry、register-commands 与 register-hooks 双平台模块。D-MOUNT 尚未实际运行；本图不说明真实用户目录已迁移。

## 紧急版阶段关系与发布事实（2026-11-12）

依据[最新spec](spec.md)、[方案](plan.md)、[模型](data-model.md)和[紧急契约](contracts/urgent-release.md)，替代原紧急图的仓库外目录与连续发布关系；上方原主线图和顺序完整保留。本轮仅设计，未搬移或运行产品验证。

### 工作区内汇合并在本地验证后连续推进

```mermaid
flowchart TD
    A[核验原副本及正式来源 保留未提交字节] --> B[准备工作区内紧急包]
    B --> C[接入catalog 预设及正确Git包前缀]
    C --> D[固定接口及真实失败骨架]
    D --> E[构建 挂载 验证按独立目录并行]
    E --> F[重建最新脚本及清单 读盘核对]
    F --> G{所有必需本地检查与真实消费通过吗}
    G -->|否| H[保留已发生事实 只修依赖范围]
    H --> E
    G -->|是| I[保存输入摘要 许可和四处迁移说明]
    I --> J[连续推进已授权工作 核对真实迁仓输入]
```

大白话：工作区紧急包是packages/skills-distribution-urgent，和主线源码/输出分离。Git包前缀用于在仓库根正确定位包的实际源码，不再要求包根就是Git根。完整本地消费包括真实官方安装、所选hooks先行、Increment及Codex完整加载，不能仅靠单元测试或文件存在。按本轮豁免取消固定暂停，在已有授权和真实前置内连续推进；公开操作仍须适用明确授权。

计划位置：packages/skills-distribution-urgent/{src,build,script,tests,dist}及发布根外本地验收材料；当前目录尚未创建，旧副本保留为来源。Tasks和逐项方案的旧路径待后续同步，本图不改工程状态。

### 用户迁移后才能进入公开阶段

```mermaid
flowchart TD
    A[本地验证完成 不设固定暂停] -.具备真实迁仓输入及适用授权.-> B[四处源码进入ISC开源仓库]
    B --> C[核对新根依赖 许可及可公开材料]
    C --> D[新Git身份重验 双构建及真实两步消费]
    D --> E{具体目标 版本 源码 摘要获授权吗}
    E -->|否| F[保留材料 不发布]
    E -->|是| G[只推精确payload的一个新tag]
    G --> H[回读实际无父commit与全部文件]
    H --> I{身份和字节一致吗}
    I -->|否| J[保留已写或冲突事实 停止下游]
    I -->|是| K[移除写凭据 匿名核对并实际消费]
    K --> L{公开来源两步及宿主加载通过吗}
    L -->|否| M[已发布与未验分别报告]
    L -->|是| N[最终SC-019满足 主线状态不自动改变]
```

大白话：四处源码指紧急目录、packages/skills、specs/skills、apps/mcp；公开源码可以保留eval，但技能发布和安装仍排除它。tag指向承载精确公开文件的无父提交，sourceRevision则追溯对应的新仓库源码，两者不能混写。网络断连先回读，不从退出码推断没有发布；源码迁移、发布与匿名消费分别需要真实证据。

计划位置：迁后新仓库根配置、紧急包内部发布工具、skills-v<version>和自有Linux/Codex消费项目；许可/依赖/私有依据与MCP旧manifest缺口进入迁移说明。原PlatformReceipt与full/ready资格不参与，不伪造Actions收据。本图只作文本结构核验，未声明渲染通过。

</details>
