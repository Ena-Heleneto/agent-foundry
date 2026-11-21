# MVU-B：Linux 下载与逐项提交验收

**现行入口修正**：已取消全部 Node 转发层，直接运行 .sh/.ps1；下方原有 Node 入口记录保留历史事实，当前验证见文末“直接运行平台脚本”或“取消 Node 转发入口”修正。

## 范围与环境

2026-11-04，用户确认当前只验证 Linux，并授权开始 T004。实验在仓库外的 `/tmp/foundry-mvu-b-*` 创建独立运行副本、消费项目和本地 HTTPS 服务；未使用 Foundry 当前安装现场作为验收目标，未修改真实 .agents/.specify、系统 CA 或用户项目依赖。工程状态只由 tasks.md 的 T004 维护。

实际环境为 Linux x86_64 / WSL2（6.18.54.1-microsoft-standard-WSL2），Node 24.22.2、Bash 5.3.9、curl 8.18.0、Git 2.56.0、jq 1.8.1。仅实施 Codex 项目级和显式名称选择，PowerShell 入口明确未实现失败；其他 agent/global/分类/全选、公共挂载和正式发布属于后续任务。Node 22.20.0、Bash 3.2 等最低运行时本轮未具备，不计通过。

## 待验证假设与验收分级

命中 C2/C3/C4：HTTPS 故障、独立平台脚本契约与逐项提交尚未实证。可证伪假设为：完整同版内容才能提交；错误、并发与中断不会将残缺技能记作成功，不覆盖原有用户文件。

选择中型验证：一次完整下载、暂存、核验、提交、复用及失败恢复；辅以参数/路径/摘要的小型断言。每组真实运行脚本与 curl，不以源码文本断言代替行为。跨平台矩阵、公开远端和独立使用者属于后续大型验收，不能用本实验抵扣。

## 实现与保留骨架

- `packages/skills/script/install-skills/install-skills.mjs` 只复用既有 run-platform.mjs 调度 Bash。
- `install-skills.sh` 执行输入/清单验证、jq 准备、HTTPS 或本地文件读取、同文件系统暂存与无覆盖提交。无 TS/Python 安装核心、嵌套 package.json 或目标 node_modules。
- jq 1.8.1 在独立临时工具目录准备，执行前验证官方固定摘要；FOUNDRY_JQ 仅允许预先取得的同版普通文件，仍先复制并校验。Linux amd64 固定摘要为 `020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d`，来源为 [官方摘要清单](https://github.com/jqlang/jq/releases/download/jq-1.8.1/sha256sum.txt)。
- 最小 release.json 由测试生成，只证明已列字段与完整文件集的安装契约；不宣称正式发布构建已实现。技能外侧收据与真实字节同时核验，未知目录、不同版本或用户编辑不接管。
- `tests/distribution/helpers/https-source.mjs` 使用 Node 内置 crypto 生成临时证书，只从显式内存映射提供测试文件；配置与密钥不进入交付物。CA 只传入本次 curl 子进程；curl 忽略用户默认配置并限制来源/重定向为 HTTPS。
- mvu-b.mjs 将运行文件复制到独立目录执行；可通过 FOUNDRY_MVU_B_SCRIPT_DIR 改为读取 dist/script。只接受受控本地验证参数，不将 fixture 结果标为真实 remote 来源通过。

骨架保留，后续 T005、T016～T020 在其上增量完善。本轮没有启动下游任务。

## 红灯、调查与修正

1. 首次实验在沙箱内监听 127.0.0.1 得到 EPERM，测试尚未进入安装行为。获准在沙箱外重跑后，真实缺失安装入口得到退出 127 而预期 0，建立有效红灯。
2. 最小实现后 33 项通过。补 Git 父仓库和损坏索引用例，两者均实际误装并退出 0；修正相对项目路径及 Git 非零错误处理，随后补验转绿。
3. 本机 `/tmp/.git` 存在环境保护占位；测试显式设置 Git 搜索上界为自有临时根，平台检查遵守相同 GIT_CEILING_DIRECTORIES，既保留父仓库场景，也不读写实验边界外的 Git 状态。
4. 继承 insecure 的 .curlrc 时，未信任自签源曾实际安装成功。用例先红，再将 curl 的第一个选项设为 --disable，拒绝默认配置绕过 TLS；本轮最终用例通过。
5. 独立只读审查复现两项 Important：GIT_INDEX_FILE/GIT_DIR 将检查导向别处；Git 跟踪的普通文件祖先 .agents 或 .agents/skills 从工作树删除后被重建成目录。新增用例得到 4 个子场景失败；GIT_WORK_TREE 场景原先已安全拒绝，一并保留回归。
6. 保护检查改为在子 shell 清除 Git 仓库/工作树/索引等重定向环境，只读取实际消费仓库默认索引；NUL 分隔检查祖先精确路径和当前技能子树，同时保留无关已跟踪技能。新增断言验证默认索引不变、跟踪路径零写入，最终均转绿。

独立审查最初结论为两项 Important 阻止验收；本轮由实施者按上述红绿测试修复并运行全套验证，没有将初次审查结论冒充修复后的复审，也未重复派发审查。

## 命令与实际结果

下列命令均在本轮实际执行。pnpm 的 verifyDepsBeforeRun=false 仅关闭运行前依赖自动核验，不降低 lint/类型检查规则。

| 命令或操作                                                                                                                                                                                                                                       | 实际结果                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                                                                      | 退出 0                                                             |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                                                                               | 退出 0                                                             |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                                                                     | 退出 0；Vite 8.3.5 原样复制脚本                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                                                                      | 退出 0；13 项 Python 测试通过                                      |
| `FOUNDRY_JQ=/tmp/foundry-t004-jq pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu B`                                                                                                              | 正式调度器报告 passed，52 项通过、0 失败、0 跳过                   |
| `FOUNDRY_JQ=/tmp/foundry-t004-jq FOUNDRY_MVU_B_SCRIPT_DIR=<source-workspace>/packages/skills/dist/script node --test --test-isolation=none packages/skills/tests/distribution/mvu-b.mjs`                                                         | 构建产物再次复制到独立目录后，52 项通过、0 失败、0 跳过            |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` | 11 项通过、4 项 skip、0 失败；原因见下方限制                       |
| `bash -n packages/skills/script/install-skills/install-skills.sh`                                                                                                                                                                                | 退出 0                                                             |
| 读取源和 dist 的 run-platform.mjs 与 install-skills 四份运行文件，逐字节比较                                                                                                                                                                     | 全部一致；未手改生成物                                             |
| `node packages/skills/tests/distribution/mvu-b.mjs --source remote`                                                                                                                                                                              | 退出 1，before 门禁明确拒绝；未启动 HTTPS 或将本地结果计为远端通过 |
| 对本轮 Markdown 逐文件 `pnpm exec eslint --fix <文件>`，并读回                                                                                                                                                                                   | 退出 0；git diff --check 通过                                      |

固定 jq 二进制通过官方 HTTPS 实际下载并核验后用于实验；另一次未提供 FOUNDRY_JQ 的正式调度测试自行取得官方工具，45 项当时场景通过。后续新增审查回归后最终 52 项使用已核验工具离线复验。自动准备的成功、摘要篡改和 404 分支仍使用真实 curl、本地 HTTPS 和官方二进制字节；只在测试 curl 包装器中将精确官方工具 URL 改指向受控源，不替代安装或摘要实现。

完整日志为本轮临时文件 `/tmp/foundry-t004-dispatch-final.json`、`/tmp/foundry-t004-dist-final.log`、`/tmp/foundry-t004-consumers-final.log`，可能随环境清理；本记录保留可复现命令、输入和结论，不依赖临时目录长期存在。

## 输入、预期与观测

| 输入或操作                                                                  | 预期与实际观测                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 同版本正文与二进制附件；Bash 首次、Node 第二次                              | 首次 installed，文件逐字节一致；第二次 reused，正文与收据 mtime、字节不变，无目标依赖文件 |
| 附件 404、截断、超时、篡改摘要或降级到 HTTP                                 | 均非零退出，无可见残缺技能；摘要错误为 integrity，其余为 download                         |
| 错版本、遍历路径、重复清单、未知选择、无参、错误来源或缺工具                | 目标 .agents 零写入；不执行未核验工具                                                     |
| 未知目标、用户编辑、额外文件、不同版本、无收据                              | 拒绝接管，原用户字节保持                                                                  |
| Git 跟踪但工作树已删、父仓库、损坏索引、被删除的跟踪祖先、替代索引/仓库环境 | 均拒绝写入；默认索引不变；无关已跟踪技能不阻塞新技能且原样保留                            |
| 只读目录、目录链接、本地来源文件链接                                        | 非零退出，不向其他目录提交技能                                                            |
| 首个技能成功，第二个技能下载失败                                            | overall=partial，成功项完整保留，失败项不提交                                             |
| 下载暂停时第二进程竞争、用户创建同名目标                                    | 第二进程 locked；首进程不覆盖并发用户内容                                                 |
| 下载时 TERM 中断，再重新运行相同请求                                        | 无残缺技能，拥有的暂存和锁已清理；真实重试成功                                            |
| 预先存在的失效锁                                                            | locked，原锁保留，不自动删除                                                              |
| 本地同版源、自签源不传 CA、insecure 默认 curl 配置                          | 本地源成功；其余保持真实 TLS 拒绝                                                         |

## 限制、未执行项与判断

- Windows/macOS、PowerShell、Node 22.20.0、Bash 3.2 未运行。本轮用户明确允许仅按实际 Linux 环境验收，不推定最低版本或跨平台通过。
- 上述消费者回归命令中的 PowerShell 命令接口与 link-skills 两项因缺 pwsh 跳过；Windows 行为仍未实证。
- 同一回归命令中的“官方 hooks-only 重装覆盖受管字段与旧事件”和“真实平台脚本两次安装七项 hooks 后仍只有五个协作指令”两项因本轮未设置 FOUNDRY_SPECIFY_CLI 跳过；未复验真实官方安装。本轮没有修改这些挂载实现，Bash/Node 边界与构建消费检查通过，不把旧官方证据重记为本轮执行。
- 真实公开来源、全 agent/global、完整发布模型及独立使用者没有执行；本地受控 HTTPS 只验证失败机制，不构成远端分发验收。
- SIGKILL、断电或技能提交后收据失败可能保留无归属完整目录；脚本返回失败、保留现场并拒绝盲重试。收据失败的机器原因与 stderr 有说明，完整报告扩展留后续任务；不承诺跨文件事务或防御不遵守锁的恶意目录替换。

本轮证据支持 T004 在用户确认的 Linux 范围验收，不能扩展为其他平台或整个分发功能完成；下一项为 T005，本轮未执行。

## 2026-11-04 修正：直接运行平台脚本

用户明确取消 Node 转发层。已删除 register-commands.mjs、register-hooks.mjs、install-skills.mjs 和 run-platform.mjs；安装、hooks 和五指令均直接调用环境对应的 .sh/.ps1。上方含 Node 调度的材料描述和执行记录是删除前的历史事实，不再作为当前接口。CLI 版本只使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6，不再提供 Node 自动读取项目版本的入口。

测试先将独立构建交付约定改为只含平台脚本，在删除前因额外 run-platform.mjs 得到有效失败；随后删除转发文件并更新已有测试，保留实际 Bash 输入、复制、强制重装、错误传播和清理检查。MVU-B 两次安装均直接运行独立副本的 Bash，仍验证完整文件集和幂等复用；没有用测试删除代替业务断言通过。

本次实际验证：

- pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint、run check-types、run build、run test 全部退出 0，包测试 13 项通过。
- FOUNDRY_JQ=/tmp/foundry-t004-jq FOUNDRY_MVU_B_SCRIPT_DIR=<source-workspace>/packages/skills/dist/script pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu B：正式调度入口以 dist/script 为来源，再复制到仓库外目录直接运行 Bash，52 项通过，0 失败、0 skip。
- node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs scripts/dev/actions/link-skills/test-link-skills.mjs：10 pass、4 skip、0 fail；减少的一项是已取消 Node 入口的专项测试，平台行为断言保留。两项 PowerShell 因无 pwsh 跳过，两项官方安装因本轮未设置 FOUNDRY_SPECIFY_CLI 跳过；原生 Windows 与真实官方重装本轮仍未复验。
- 源码和 dist/script 均仅包含 install-skills、register-hooks、register-commands 三个目录，每个目录只有 .sh、.ps1 和 README；无 .mjs 转发文件。测试与构建工具仍在原开发目录，不作为安装入口交付。

回归首次在沙箱内得到 spawnSync bash EPERM，未计通过；沙箱外实际重跑通过。日志为 /tmp/foundry-native-entry-mvu-b.json 和 /tmp/foundry-native-entry-regression.log，可能随环境清理。所有实际安装仍只写测试自有临时项目，没有修改真实安装现场或启动 T005。Markdown 检查与 git diff --check 通过。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
