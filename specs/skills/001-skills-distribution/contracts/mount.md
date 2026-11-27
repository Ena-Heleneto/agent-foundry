# 公共挂载与隐匿契约

## 主线现行挂载入口

主线 curl 从已核验同版归档直接调用 `engine/install.sh`。本次成功集合含适用 workflow 技能且挂载开启时，由引擎调用 `engine/script/speckit-mount.sh`，核验实际项目和选中材料，按所选 hooks、Increment 的依赖顺序执行。`--no-mount` 只关闭挂载，`--hidden` 仍可处理本次成功项。T027 核对入口调用、参数和阶段结果，T028 按原支持矩阵实证同包调用、官方注册和宿主加载。下方 Node 入口、旧脚本目录及官方第二步是此前方案的记录。[现行调用契约](curl-delivery.md#2026-11-20-隐匿脚本调用) · [T027](../tasks.md#t027) · [T028](../tasks.md#t028)

## 2026-11-16 当前隐匿接口与挂载边界

近期只推进技能安装和可选hidden，Spec Kit/hooks/Increment继续后置；原正式同版核验、先hooks后commands、旧入口保护及实际宿主完整加载验收保持，不以新包下载完成抵扣。字段及hidden协议集中在[curl契约](curl-delivery.md)，统一包不强制随包逐文件JSON，后置挂载仍须实际正文/附件/声明同版核验。

hidden从已核验同版统一包取得，未知接口不执行；处理模板候选、本次选择和完整成功集合的交集。统一包整体失败不安装；技能完整且已实际安装后，只有hidden模块/执行失败可保留安装并报告部分失败。生成脚本路径必须过滤正式白名单，不能按历史目录存在性认定成功。

本地.git/父仓库/.git文件、tracked、共享路径及global项目外限制保持，不忽略整个agent目录、不取消跟踪；当前只先验.agents/skills前缀。旧script路径仅作适配参考，不自动恢复script/old。紧急版自身候选和两步消费不受主线布局影响。

<details>
<summary>此前契约与历史接口（未被替代的保护和最终验收继续适用）</summary>

**本次共同交付的前置边界（2026-11-10）**：打包构建全部重做，挂载运行源码保留原状态；新产物仍须通过本契约的同版文件、官方迁移和实际加载验证。所选正式workflow来源缺失只阻断对应完整候选及消费，不阻断纯MCP或稳定内容的构建实验。候选与CI统一见 [build-pipeline.md](build-pipeline.md)，不能把保留核验骨架描述为完整挂载已实现。

日期：2026-11-10。来源：[当前规格](../spec.md) FR-020～030、FR-045～047、SC-005～010/018。此为待实现接口，当前注册器/公共核验仍有旧集合，不能按本文推定已交付；实际源码事实见 [research](../research.md)。历史段落只保留原时点。

## 临时占位与最后接通真实挂载

依据[用户明确顺序](../requirements/discussions/2026-11-10-build-actions-mount-order.md)，先完成 Vite 构建，原生挂载暂作占位；再实现 GitHub Actions，最后接通本契约的真实行为。T068 优先复用已有 mount-entry 的未接通段及文件核验骨架，现有注册器源码保留但不在占位阶段调用，不删除历史完成实现。需要的最小调整须在实际 Task 方案中核对，本轮未改脚本。

占位不是成功模拟：请求原生挂载时非零、hooks/commands 未执行、原生目标零写入，保留安装/核验已发生事实并说明恢复条件；显式 --no-mount 时只对不适用阶段报告 skipped。不得调用旧四/五模式注册器求通路，不伪造官方/宿主成功，也不为占位新增终端用户子命令。

T006 在 T059 的 Actions 配置实现与隔离验证后，按原 D-MOUNT/D-PREP 做真实实验；T023～T027 接替占位，T028 保留三平台与完整加载验收。纯安装与占位结果不能完成这些任务，也不能满足正式 full/ready 或迁后发布条件。以下内容描述最终真实挂载契约，占位期间均不得宣称已具备。

## 技能选择与挂载边界

官方 skills 的整包、分类、单个、多技能语义保持。modes 当前只声明 task-increment；仅本次显式选择并核验该技能即可满足命令来源条件，不要求 task-pair/task-tutor/task-direct，不补装或重装三个暂停入口。没有 Increment 选择则 commands=skipped，选择了但正文/附件/版本不完整则 failed，保留安装成功事实。不从历史安装目录扩大本次集合，bug-report 无命令映射。

三个暂停模式的源码和历史保留，公开可发现性依主线当前正式范围核对，不能作为本期可用模式宣传；挂载映射移除不授权删除源码或改变其他技能的安装粒度。旧 Review/Guide/Explore 与六旧技能仍按原受管退役要求处理。

## 职责与调用顺序

唯一外部入口仍为 node script/index.mjs [参数]，无 install/mount/hooks/commands 子命令；Node 只选择平台及转发 cwd、参数、输出、退出码与取消。install-skills 双平台负责安装、同版公共材料与后续编排，mount-entry 双平台重新核对本次实际文件与目标环境，先 register-hooks 后 register-commands；官方安装后显式第二步复用同一链路。缺少公共材料不从 monorepo 未交付路径补取。

register-commands 保留 --project、--skills-dir、可选 --cli 内部接口，不新增逐模式开关或公开子命令。安装投影需要规范化时，仅从本次已核验的 task-increment 构造临时输入并保留必要附件，不从发行包补未安装技能。临时 modes 扩展只声明 speckit.modes.increment，经官方 extension add --dev <临时目录> --force 每次重装；官方失败传播退出码并报告现场，临时输入成功失败均按生命周期清理，不承诺保留临时目录。

FOUNDRY_SPECIFY_VERSION 或默认 1.2.6 统一本次原生版本；--cli 指定已装官方工具时仍核对实际版本及兼容条件。外部不要求 Foundry/pnpm。所选 hooks 来源、配置和附件在本批首次官方调用前完整核验，全部 hooks 成功或明确不适用后才调用 Increment；hooks 失败则 commands=not-run。

## 当前入口与实施准备

**来源修正（2026-11-11）**：当前hooks定义以FR-020/049/055的集合集中配置及同版所选公共挂载材料为准，不要求源码或安装技能同目录存在旧speckit-hooks.json。下方11月4日配置归属段只描述原时点，已由此修正替代。主线生成方案由T077核对；紧急副本按[紧急契约](urgent-release.md)只在运行时私有临时目录转换官方输入，不回写逐技能配置。旧目标中的配置仅用于来源核对和安全迁移，不回退为新版本定义。

| 所选来源                     | 官方映射                       | 消费结果                                           |
| ---------------------------- | ------------------------------ | -------------------------------------------------- |
| task-increment               | speckit.modes.increment        | Codex 为 $speckit-modes-increment；只负责 MVU 规划 |
| implementation-preparation   | before_implement，hooks-only   | 同版正文/附件可加载；不包装原生 Implement          |
| artifact-spec-analysis       | after_tasks，hooks-only        | Increment 显式复用同一能力，无 after_increment     |
| artifact-project-description | 技能声明的结案事件，hooks-only | 仍按真实消费者及结案条件执行                       |

准备skill名称与正文以当前正式来源及本次选择为准；核验正式SKILL.md、实际必需附件、集合集中配置及同版所选公共挂载材料，缺来源不得用本表占位成功。紧急副本仅在运行时私有临时目录将所选配置转换为官方extension.yml，补齐有效command；主线具体生成规则由T077确定。以各技能标识作extension ID，provides:{}，不生成额外命令。所选适用 hooks 逐项官方 --force，不自定义 YAML 合并、不按等价或指纹跳过，无关扩展交官方处理并读回核验。

Release/安装投影对正文和附件全集逐文件核验。同版官方生成入口可能重建 frontmatter，须核对正确身份、有效正文、附件路径与实际可读性，不要求生成入口与源 SKILL.md 整文件原字节相等。适用宿主中单独做完整加载检查，使用无业务执行目标；登记或命令文件存在不算加载通过。本 Spec 不在安装阶段实际发起业务实现，讨论确认、自然语言发现和逐 Task 停止/放行由主线验证，不以分发加载结果抵扣。

## 旧受管入口迁移与保护

选用官方同 ID modes 强制更新，必要的旧受管扩展移除也只走官方支持路径。官方 1.2.6 在 force 前校验后按旧 registry 的 registered_commands/registered_skills 卸载再注册新声明，因此可作为缩减集合的候选机制，真实去留仍须隔离实测。原登记损坏/缺项或归属标记缺失时，不能据新声明推定旧产物已清理；报告具体残留/未核实路径和恢复条件，不手改 registry 或生成文件。

官方卸载可删除整个受管 skill 目录。调用前仅对明确清单、旧登记和实际受影响目录做只读清点，检查额外用户附件、用户维护文件和未知内容；存在冲突或无法确认时，停止受影响破坏性调用、保留现场并报告精确路径和可审阅差异，不自动移动/删除。没有冲突时正常受管更新按有效授权继续；此保护不成为持续所有权服务、永久指纹或全目录扫描。

隔离验收分别准备旧三/四/五集合、无关扩展、核心入口和普通技能哨兵；官方更新后旧暂停与退役活动入口为0，Increment 正常，连续两次重试不复活，未知内容保持。未知附件场景要求包装流程在调用官方前失败且零写入，不能把上游实际删掉未知文件算产品正确。只改脚本数组、退出0或新入口存在均不能声明迁移通过。

## 环境与结果

Agent 规则取本次在线 skills，报告 upstream.version/integrity；目标项目的原生 status、init-options、default integration 和实际文件须一致，按 [兼容契约](compatibility.md) 取适用交集。非 Spec Kit 明确 skipped，不初始化；缺工具/集成/材料或版本冲突失败。全局挂载缺明确 project 时安装事实保留而挂载失败，不猜测用户主目录或当前目录。

hooks、commands 独立报告 success/skipped/failed/not-run；重试重新核验本次选择与文件，每次刷新适用来源，命令安装不因技能 reused 而跳过。官方写入发生后读回失败须保留已写事实与续接条件，不承诺跨文件原子回滚。无关扩展语义和用户文件保护必须有实际证据，YAML 注释与格式不保证字节不变。

## 本地隐匿

只有 curl 的 --hidden 会调用此能力。项目级只看 cwd/.git，全局只看显式 project/.git；无 .git、.git 为文件、全局无项目分别说明跳过，不搜索父项目。普通仓库经原生只读路径查询确认 exclude 属于该项目后才追加。

允许路径为本次成功技能目录、其 agent 入口、独占收据以及本次新增独占扩展文件。先检查实际归属和 Git 跟踪；共享 extensions.yml、registry、init-options 等不整文件隐藏，保留可见并报告限制。全局技能在项目外则该部分跳过。排除单个独占目录须证明其内无其他来源文件，不能扩大到整个 agent 或 extensions 目录。

规则按仓库根相对路径锚定，转义 Git 通配字符及空格，稳定去重；保留已有文本和反向规则。写入后以实际 `git check-ignore -v -- <path>`、`git ls-files --error-unmatch -- <path>` 及未跟踪列表验证作用来源和结果。存在全局规则或 .gitignore 已隐藏并不自动证明本次本地规则有效，报告已有来源。文件不可写、规则无效或文件被跟踪则 hidden 失败，安装成功事实保留；不改 .gitignore、不取消跟踪。

## 历史：2026-11-04 平台执行修正（已由唯一 Node 入口替代）

本包运行入口直接使用环境对应的 .sh/.ps1；安装、hooks 和五指令不经 Node 转发。skills 方式仍由用户手动执行同版公共平台脚本，curl 方式自动串联安装与挂载；两者复用同环境的平台实现。CLI 版本使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6。构建只原样复制，Node/TypeScript 仅用于构建、测试或官方工具所需环境；不交付自有 TS/JS/Python 安装核心、Node 分发器或嵌套 package.json。后续任务不得重新创建已取消的转发层。

## 历史：2026-11-04 hooks 自动安装约定

受管 hooks 每次按来源生成临时 hooks-only 扩展，沿用七个既有技能标识，逐项调用 `specify extension add --dev <临时输入> --force` 完整重装。取消内容相同跳过、受管 enabled/condition/未知字段保留和自定义 YAML 合并；无关扩展由官方 CLI 处理，不承诺保留 YAML 注释。hooks 不生成命令入口，协作指令仍只有 modes 的五项。

内部编排或工作区集成按环境调用 register-hooks.sh/.ps1 或 register-commands.sh/.ps1；复制、临时声明、官方安装和清理由平台脚本完成。外部分发统一通过 Node 入口选择平台，不暴露模块子命令。script 原样复制到 dist/script，不执行或打包；不交付 yaml-config.mjs、自有 Python 核心或嵌套 package.json。

当前 register-hooks 全量安装七项，开始前核对全部来源，失败停止后续安装；公共分发按所选技能调用的编排仍待 T005/T006，不在本轮新增。skills 安装后的脚本由用户手动执行，curl 自动串联仍属后续任务。本轮只验 Linux，不声称 Windows/macOS 通过。

## 历史：2026-11-04 hook 配置归属修正（已由集合集中配置替代）

每个声明 hooks 的技能在 SKILL.md 同目录维护 speckit-hooks.json，内容是以事件为键的 hooks 映射。该配置随技能及附件原样构建、安装；register-hooks 从 --skills-dir/<技能>/speckit-hooks.json 读取并直接组装临时 extension.yml。脚本目录不维护或构建 definitions 副本，缺少任一必需配置时在首次官方安装前失败。

</details>
