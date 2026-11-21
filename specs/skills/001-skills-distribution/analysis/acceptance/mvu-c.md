# MVU-C：独立第二步与实际文件核验

## 2026-11-04 后续修正：唯一 Node 入口与混合异常报告

用户随后确认唯一公开入口为 `node script/index.mjs [参数]`；mount-entry.sh/.ps1 是内部核验与挂载编排模块。下方保留初次 T005 实测事实，不再作为多个公开入口的约定。

新增用例复现了 PowerShell 在“完整项→不可读项→后续完整项”时丢失坏项和后续项、installation 保留 not-run 的报告问题。现已逐技能捕获异常，坏项记录 failed、继续核验后续项，最终 installation=failed、完整项保留、挂载 not-run。最新 Bash 正式调度器 23 pass，Linux PowerShell 构建副本 22 pass、1 项 Bash 专属场景 skip；命令、红绿记录及最新工程检查见 [唯一 Node 入口与报告修正](node-entry.md)。历史 22/21 项计数不冒充新增用例覆盖。

## 范围与环境

2026-11-04，用户授权继续下一个任务后实施 T005。沿用用户指定的 feature/speckit-workflow-extensions checkout，开始时 git status 干净；不创建第二套工程任务状态。官方安装、公共材料和故障实验全部位于 /tmp/foundry-distribution-* 自有临时目录，不修改当前工作区的 .agents/.specify、用户项目或系统信任设置。

实际环境为 Linux x86_64、Node 24.22.2、Bash 5.3.9、官方 skills 1.7.4、jq 1.8.1。新增 Bash 和 PowerShell 7.4+ 入口，核验 Codex 项目级和全局的原始文件投影；完整 agent/投影矩阵留后续任务。本项不调用原生 hooks/commands，T006 将在保留骨架上接通既有平台脚本。

PowerShell 7.4.6 使用 /tmp 便携包，其 SHA-256 为 6f6015203c47806c5cc444c19d8ed019695e610fbd948154264bf9ca8e157561，与同一官方发布的 hashes.sha256 一致。初次启动因系统缺少兼容 ICU 而 SIGABRT，未把它计作产品失败或通过；后续仅对测试进程设置 DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1，使用沙箱隔离的 HOME/XDG 目录运行。Linux 上的 PowerShell 实测不代表 Windows 验收。

## 前置与待验证假设

T003/T004 的正式 checkbox 和证据已就绪。本次命中 C2/C3/C4：官方安装与显式第二步之间的同版公共材料、实际文件和挂载前置尚未建立可观察契约。假设为：不依赖 monorepo、安装退出码或历史扫描，也能确定本次完整成功集合；global 缺项目不能抹掉已完成安装事实。

采用中型验证：官方安装真实技能，独立取得公共材料后手动运行平台入口，覆盖完整核验、故障和续接；同时执行版本、选择、路径和摘要的小型断言。当前没有以本地夹具或脚本文件存在代替真实公开来源、原生派发、三平台矩阵或模式行为验收。

## 实现和保留骨架

- script/mount-entry/mount-entry.sh 和 .ps1 直接运行平台实现，无 Node 转发器、自有 Python 核心或嵌套 package.json；README 说明独立获取、参数与阶段边界。
- 实验复制真实 task-*、artifact-business-flow、vue-reactivity 的完整目录；先用官方 skills 单独安装 task-explore，核对确实只新增这一项，再准备其余场景及真实全局安装。调用者只传独立发布根与已安装根，不提供源码仓库。
- 最小 release.json 由测试生成，声明版本、sourceRevision、files 和技能文件集合。catalogDigest 直接计算清单原始字节，不写回自身。正式发布模型和构建仍由后续任务演化。
- 公共双平台入口必须同时符合本版清单摘要。每项技能核验实际文件全集、字节数和 SHA-256，拒绝链接、额外文件、错误位置及不可完整读取的内容；完整项进入 verifiedSkills，损坏项不进入后续映射。
- 只核验本次显式选择，允许去重，不扫描历史目录补选。global 缺明确项目保留 installation=success，hooks=failed、commands=not-run，并给出补传 --project 的重试条件；关闭挂载时不要求项目。
- 单选 Explore 核验成功，五指令仍列出其余四项选择缺失；不补装、不部分注册。五项齐备时明确 unsupported/not-run，不报告原生挂载成功。非 workflow 或非 Spec Kit 项目明确 skipped。
- Bash 复用 T004 的固定 jq 1.8.1 官方摘要和临时工具准备方式；测试既验证预先提供同版工具，也实际验证不提供 FOUNDRY_JQ 时自动下载、核验和执行。工具摘要错误时未执行伪造工具，项目依赖保持不变。PowerShell 使用原生 JSON 与摘要能力。

已有调度器会自动发现 mvu-c.mjs，无需修改 test-distribution.mjs。构建回归原有三目录快照在新增 mount-entry 后如实失败，随后更新为四个实际职责目录，并增加公共双平台脚本和 README 的逐字节交付断言；没有修改构建插件或手写 dist。

## 红绿记录与独立审查

1. 初轮因沙箱拒绝 spawnSync 得到 EPERM，尚未进入产品行为；授权在沙箱外运行后，官方安装成功，实验因公共入口缺失得到退出 127，建立有效红灯。
2. 实现后 Bash 首批 15 项、扩充后 20 项通过；Linux PowerShell 相同 20 项通过。ESLint 一处箭头参数括号问题已自动修复。
3. requesting-code-review 要求的一次只读独立审查发现 Important：完整技能下增加 unreadable/extra.txt 并将子目录权限设为 000，Bash find 报 Permission denied 后仍返回成功。新增用例复现原脚本退出 0、installation=success 的错误。
4. 原因是 verify_skill 在 if 条件下调用，不能依赖 errexit。改为显式检查两次 find 的退出状态，并检查排序/集合生成失败；枚举不完整立即使该技能失败。修复后源脚本和构建副本各 22 项通过，PowerShell 同一故障用例也通过；没有再派发复审或冒充独立复审结论。

## 实际命令与结果

下列命令均实际执行；pnpm 的 verifyDepsBeforeRun=false 仅关闭执行前自动核验，不降低 lint/类型检查规则。工具路径为本次临时准备位置，环境清理后须重新准备固定版本。

| 命令或操作                                                                                                                                                                                                                                                                                                                        | 实际结果                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t005-official/node_modules/skills FOUNDRY_JQ=/tmp/foundry-t004-jq node --test --test-isolation=none packages/skills/tests/distribution/mvu-c.mjs`                                                                                                                                            | 最终源脚本 22 pass、0 fail、0 skip                                                 |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t005-official/node_modules/skills FOUNDRY_JQ=/tmp/foundry-t004-jq FOUNDRY_MVU_C_SCRIPT_DIR=<source-workspace>/packages/skills/dist/script pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu C`                                                 | 正式调度器 C=passed；构建副本再次复制到独立目录后 22 pass、0 fail、0 skip          |
| `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 PATH=/tmp/foundry-t005-pwsh:$PATH FOUNDRY_MVU_C_SHELL=pwsh FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t005-official/node_modules/skills FOUNDRY_MVU_C_SCRIPT_DIR=<source-workspace>/packages/skills/dist/script node --test --test-isolation=none packages/skills/tests/distribution/mvu-c.mjs` | Linux PowerShell 构建副本 21 pass、0 fail；1 项 Bash 专用 jq 故障场景不适用而 skip |
| `env -u FOUNDRY_JQ FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t005-official/node_modules/skills node --test --test-isolation=none --test-name-pattern='手动第二步核验完整附件' packages/skills/tests/distribution/mvu-c.mjs`                                                                                                             | 1 pass；入口实际自动下载并校验官方 jq，不在项目安装依赖                            |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                                                                                                                                                       | 最终退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                                                                                                                                                                | 最终退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                                                                                                                                                      | 最终退出 0；Vite 原样复制四个职责目录                                              |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                                                                                                                                                       | 13 tests 通过                                                                      |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs scripts/dev/actions/link-skills/test-link-skills.mjs`                                   | 最终 17 pass、0 fail、4 skip；逐项限制见下文                                       |
| `uv run --cache-dir /tmp/skills-distribution-uv-cache --isolated --no-project --with pytest python -m pytest -o pythonpath=<source-workspace>/apps/mcp/src apps/mcp/tests/test_registry.py`                                                                                                                                       | 7 passed；缺 pytest/离线缓存后，经授权在临时 uv 环境准备依赖                       |
| `bash -n packages/skills/script/mount-entry/mount-entry.sh`                                                                                                                                                                                                                                                                       | 退出 0                                                                             |

每个普通核验用例比较消费项目操作前后的完整文件摘要，确认没有改写已安装技能、项目依赖或原生配置；不可读目录用例在恢复权限后核对原额外文件仍在。清单/脚本篡改、缺附件、额外文件、未知名、错误根、重复参数和挂载缺项均有真实进程断言。

临时日志包括 /tmp/foundry-t005-red.log、permission-red.log（完整名带 foundry-t005 前缀）、green-final.log、dist-dispatch-final.log、pwsh-final.log、auto-jq.log 和 consumers-final.log；这些文件可能清理，本文保存独立可复现的命令、输入、观测与结论。

## 限制与续接

- Windows/macOS、Bash 3.2、Node 22.20.0 未运行；当前证据不支持完整三平台或最低运行时声明。Bash 入口在其他平台明确失败；PowerShell 已在 Linux 实测，Windows 路径和权限语义留后续平台验证。
- 消费回归的四项 skip：普通回归 PATH 未配置 pwsh，因此既有 register-commands 和 link-skills 两项 PowerShell 场景跳过；未提供 FOUNDRY_SPECIFY_CLI，因此既有官方 hooks-only 覆盖和 hooks+五指令真实重装两项跳过。新增公共 .ps1 使用独立命令另验，不将上述 skip 改记为通过。
- 真实公开来源、其他 agent/投影、完整发布模型尚未执行；本地同版清单和真实官方本地安装不抵扣 T032/T038。HTTP 清单获取分支及 PowerShell 远端下载不在本次通过范围，后续远端/故障验收须补证。
- 原生挂载及实际技能派发未接通，不以文件核验成功替代挂载成功；下一项 T006 必须验证所选 hooks、五指令官方重装、顺序和实际派发。Explore/Guide 真实行为仍由工作流功能在具备真实任务的外部项目验收。

本项假设在上述最小实验范围获得证据；保留公共入口和实验骨架，后续在其上增量填充。正式工程状态由 tasks.md 的 T005 唯一维护。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
