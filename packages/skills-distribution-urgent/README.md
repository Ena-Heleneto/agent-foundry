# 技能紧急交付：Linux / Codex 项目级

本包在当前工作区的 packages/skills-distribution-urgent 维护独立源码和 dist，当前实测并允许的组合为 Linux x86_64、Codex、项目级复制安装；其他Linux架构尚未验证。交付采用官方 skills 安装与同版公共脚本显式挂载两步，工作流只注册 Increment 及本次所选适用 hooks。当前尚无已发布的公开来源，不能将本文变量示例视为现成下载地址。

## 内容与支持边界

正式技能共九项：coding 的 business-node-delivery、document-changed-symbols；frontend 的 nuxt-ui-styling、vue-reactivity；workflow 的 bug-report、artifact-project-description、artifact-spec-analysis、implementation-preparation、task-increment。完整正文、frontmatter和必要附件随版本交付。eval、MCP内容及Pair/Tutor/Direct活动入口不进入本版正式候选；主线源码可保留这些材料，不代表它们可安装。

需要 Linux、满足实际依赖 engines 的 Node（至少22.20.0）、Bash、Git、npm/npx、curl、tar、jq 1.8.1，以及已准备的 Specify CLI 1.2.6 工具环境。消费项目须已初始化 Spec Kit，并已有正式任务；非 Spec Kit 的不适用结果不能抵扣工作流验收。global、Windows、macOS及其他agent不属于本版支持，未测范围不能据上游声明推定通过。

## 两步使用

先从同一个获准发布 SHA 取得完整公共材料，包含 release.json、script 和 script/config。单个技能的官方安装不会自动提供根脚本。下文 RAW_ROOT 为该固定 SHA 的 GitHub raw 根，VERSION 为清单版本，PROJECT 为目标项目绝对路径；源码仓库根可能含 eval，不能作为正式整包安装建议来源。

在完整公共材料目录进行只读预检：

```bash
node script/index.mjs --check --official \
  --source "$RAW_ROOT" --version "$VERSION" --agent codex \
  --skill task-increment --skill artifact-spec-analysis \
  --skill implementation-preparation --skill artifact-project-description \
  --project "$PROJECT"
```

第一步，按预检返回的 upstream.version 与 official.args 实际执行官方 skills。它们绑定当次已核验的同一个 npm latest 包及固定 GitHub tree 来源，保留显式技能名、--agent codex、--copy，不添加 global。每次重新查询当次规则，不固定历史 skills 版本，也不直接将 raw URL 交给官方安装器。

第二步，在同版公共材料目录运行普通唯一入口：

```bash
node script/index.mjs \
  --source "$RAW_ROOT" --version "$VERSION" --agent codex \
  --skill task-increment --skill artifact-spec-analysis \
  --skill implementation-preparation --skill artifact-project-description \
  --project "$PROJECT"
```

只需普通技能时可明确只选该技能；选择 Increment 时须显式同时选择分析与实施准备，不静默补装依赖。上例另外选择结案hook，用于完整工作流组合。入口只核验并复用同版已装正文和附件；所有适用hooks成功或明确不适用后才注册Increment。未知文件、用户修改、错版、缺件或冲突会停止受影响阶段，不能通过check、official或no-mount绕过完整挂载验收。

hooks 与退役清退、commands、安装/完整性和loading分别报告真实阶段事实。真实旧三/四/五集合及六项退役hooks由官方支持能力更新或移除，不手改registry、不维护永久目标指纹。失败保留先前成功和实际写入事实，后续not-run；CLI登记或派发数据不能证明Codex已经完整加载正文/附件。

## 维护者构建与验证

依赖版本来自根 catalog，共享配置经 @foundry/preset-config 的 exports 与 workspace:* 消费，不维护包内Git或独立锁。实际源码、配置、catalog与预设来源须与真实提交一致；未跟踪根锁及预设生成dist另有实际依赖证据。无关工作区修改不应阻断，相关输入脏、忽略混入或构建中漂移必须拒绝。

```bash
pnpm --filter @foundry/skills-distribution-urgent run lint
pnpm --filter @foundry/skills-distribution-urgent run check-types
pnpm --filter @foundry/skills-distribution-urgent run build
URGENT_SPECIFY_CLI="$PREPARED_SPECIFY_126" \
URGENT_HOST_CONTEXT="$OWNED_HOST_CONTEXT" \
  pnpm --filter @foundry/skills-distribution-urgent run test
```

PREPARED_SPECIFY_126 必须指向调用者已准备的真实1.2.6可执行文件，测试不安装或替换全局CLI。官方安装测试默认消费当前包dist，缺候选明确失败；内部URGENT_CANDIDATE_ROOT可指定另一份完整材料，不能用它伪造来源。OWNED_HOST_CONTEXT为本次自有独立项目的测试上下文文件，记录真实官方安装/正常挂载证据、候选身份、正式任务及允许的探针范围，不能指向真实用户项目或以伪造记录替代实际两步。真实宿主验证复用当前已登录Codex认证上下文，不复制凭据；缺上下文、认证、环境或实际完整读取证据均明确失败或未执行，不能计全部本地完成。

构建只通过Vite复制原始资产，不执行运行脚本。payload精确为skills、script、README、LICENSE与release.json；files列出清单自身之外的全部文件，候选摘要包含清单自身。任意相关源码、说明、依赖或提交身份变化后，须重新构建、同源双构建及适用真实消费验证；不能拼接旧脚本清单或将夹具提交冒认正式来源。

## 本地暂停与后续迁移

维护者须完成全部必需本地检查、正文附件和精确文件全集、官方两步安装挂载、Codex实际完整读取、用户保护与失败恢复、自有bare Git发布工具验证，并以实际证据判断本地结果。全部本地验证结束后暂停，不自动迁仓、建仓、推送或发布；本地成功不等于公开版本交付通过。

后续由用户一并迁移 packages/skills-distribution-urgent、packages/skills、specs/skills、apps/mcp 到采用ISC的新开源仓库。四处目录不等于完备的新根工程：catalog、preset-config、scripts/dev及.specify等依赖须在新仓库维护等价配置和检查。MCP仍消费旧主线manifest，源码同行不代表该契约已兼容，也不授权线上部署。eval源码可保留，正式技能发布/列出/安装仍为0；specs正文、附件和压缩归档须逐项核对私有引用，保留原仓库私有历史，不能仅排除.specify后直接公开。

迁后核对真实源码与依赖、重新检查和冻结候选，再按绑定目标、版本、sourceRevision与candidateDigest的明确授权处理发布。匿名文件全集与真实公开来源两步消费仍需独立验收；没有公开目标时保持未执行，不编造地址或版本。

## 许可

本包使用随附的真实 ISC LICENSE，Copyright (c) 2026 Ena-Heleneto。复制或分发时保留许可证及署名；适用第三方材料继续保留其许可与来源。源码迁移前还须清点各目录既有授权，不能由本文件替第三方作新的许可承诺。
