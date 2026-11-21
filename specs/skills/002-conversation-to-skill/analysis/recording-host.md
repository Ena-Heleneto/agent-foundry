# T004 Codex 记录接入实测

日期 2026-11-20。使用本机 `codex-cli 0.170.0`、T002 的临时 Git 仓库、真实交互伪终端和回环端点的固定回包。首条保存顺序、末轮和主动中断已取证。项目 hooks 缺少打开即建档与安全恢复归属所需的信号，T004 前置验证保留待解决。[已确认方案](../implementation/T004.md) · [原任务](../tasks.md)。

## 环境与信任

临时文件系统和网络命名空间容纳独立 Codex 配置、会话、信任状态和本地模型端点。普通交互使用同版 CLI 的 `--no-daemon` 前台运行方式，固定模型内容仅用于观察实际请求和生命周期。直接挂载单个二进制时，默认后台入口曾因缺少完整安装包而退出，按 CLI 提示切到前台后继续取证。

真实 `hooks/list` 在可信仓库根和子目录都发现同一份仓库级 `.codex/hooks.json`，六项均先为 `untrusted`。将其真实当前哈希写入临时信任状态，重新读取后两处均为 `trusted`。项目未受信时根、子目录和仓库外均发现 0 项，实际交互选择受限模式后收到固定回包且执行 0 次 hook。另在终端观察到新 hook 的信任复核提示，六项信任状态以宿主接口读回为依据。

## 打开、首条与退出

- 交互界面在测试时区 11 月 19 日午夜前已可输入。保持空白至午夜后，观测区有 0 条 hook 事件，会话目录也没有新的 `rollout-*.jsonl`。11 月 20 日首条提交才出现 `SessionStart`，随后提供的 `transcript_path` 带有原开启日 11 月 19 日。该日期线索可在首条后核对，空白打开时可供记录端消费的触发信号仍待解决。
- 同步 `UserPromptSubmit` 将 `T004_FIRST_SYNTHETIC_PROMPT` 写入并关闭仓库外收据文件。回环端点在收到首个包含此消息的 `/v1/responses` 请求时读回了同一文本。以实际模型请求到达和文件原文作为先后证据。
- 正常返回固定末轮后，`Stop.last_assistant_message` 等于 `T004_FIXED_FINAL_REPLY`。正常退出出现同一会话的 `SessionEnd`，`reason` 为 `other`。另在根目录启动一条回复延迟的交互会话，端点收到请求后按 Ctrl+C，取得 `Interrupt`，退出后取得 `SessionEnd`。

## 作用域对照

恢复样例用各自独立的固定回包标记确认本次模型请求与回复。会话 ID 用隔离会话文件名和真实 hook 互相核对，探针不打开会话正文。表中的 `cwd` 是宿主事件实值，启动目录和历史会话来源来自隔离启动器的对照记录。

| 实际入口 | 观测到的项目 hook | 仓库外验证资料区 |
| --- | --- | --- |
| 同名前缀仓库外新开交互 | 有模型请求，项目 hook 为零 | 无新增或续写 |
| 仓库内 `exec` | `SessionStart.source` 为 `startup`，`cwd` 为仓库内子目录。首条、停止和关闭事件齐全 | 无新增或续写 |
| 仓库内 `exec resume` | 对同一合成线程发请求，`source` 为 `resume`，`cwd` 为仓库内子目录 | 无新增或续写 |
| 仓库内恢复仓库内会话 | `source` 为 `resume`，`cwd` 为仓库内子目录 | 无新增或续写 |
| 仓库内恢复仓库外会话，使用当前目录 | 恢复仓库外线程，项目 hooks 仍触发，`cwd` 为仓库内子目录 | 无新增或续写 |
| 仓库外恢复仓库内会话，使用历史目录 | 恢复仓库内线程，项目 hooks 仍触发，`cwd` 为仓库内子目录 | 无新增或续写 |

各组 `SessionStart` 的宿主字段集合均为 `cwd`、`hook_event_name`、`model`、`permission_mode`、`session_id`、`source` 和 `transcript_path`。`source` 描述新开或恢复，当前 hook 的 `cwd` 反映选定后的工作目录。相同字段无法表达本次入口是交互还是 `exec`，也无法表达跨边界恢复前的启动目录。验证收据只用于首条顺序，诊断日志与资料区独立，各对照文件差异为零，探针未补读正文。完整记录器的准入条件仍需可信宿主信号，T007 和 T009 继续等待接入方案调整。

## 复现

- `node --test packages/skills/tests/conversation-workflow/recording-host.test.mjs` 运行真实 CLI 探针，输出包含边界、实际事件和文件差异的 JSON。通过表示采集了这些观察值，前置是否成立按上文实测判定。
- `node --test packages/skills/tests/distribution/conversation-sandbox.test.mjs` 验证 T002 所用隔离样例。
- 实际驱动使用当前环境的 Linux 命名空间、Bubblewrap、Python 标准库和固定 CLI 版本。[Node 探针](../../../../packages/skills/tests/conversation-workflow/recording-host.test.mjs) · [伪终端及回包驱动](../../../../packages/skills/tests/conversation-workflow/helpers/recording-host.py)。

最终探针运行退出 0，覆盖首轮和八组对照。T002 样例回归 8/8，目标包 `lint` 和 `check-types` 返回 0。规格 Markdown 按现有 ESLint 规则被忽略，另核对了本地引用、原任务身份和 `git diff --check`。

## AI 直接方式的技术核查（2026-11-20）

用户在本轮说明 T004 的验证范围后回复「验证」。依[现行验证方案](../implementation/T004.md#现行方式的验证范围2026-11-20)，复用 T002 临时仓库、既有 `Terminal` 伪终端驱动和本地固定回包端点，在 Linux 文件系统及网络命名空间中运行 `codex-cli 0.170.0`。独立状态目录覆盖隔离子进程的用户目录，未复制用户机器配置或认证。本轮没有 hook，也没有修改产品脚本、正式 Skill 或安装入口。

第一组实际完成仓库根、子目录、仓库外、`exec`、`exec resume`、仓库内正常恢复、两种跨边界恢复及用户停止，共九种场景；[原始观测](acceptance/t004-direct/scope-observation.json)保存了模型输入中的环境片段、可用工具名和实际工具结果。仅在临时仓库安装最小核查候选 `t004-recording-probe`，候选正文 SHA-256 为 `189150677eae3fba8e7d5bd87655a603ce7b149ebbab60ba64c78cb82d5ee7c7`。候选在根和子目录的模型输入中出现，仓库外新会话中未出现；八个未停止场景均由工具读到相同快照。它不是 T013 的最终记录入口。

| 核查项 | 本轮可核验信号 | 结论边界 |
| --- | --- | --- |
| 会话身份 | 工具环境中的 `CODEX_THREAD_ID` 与实际合成线程文件名一致；恢复后沿用同一 ID | 工具可取得真实身份，不能仅由首个模型输入没有 ID 推定不可行 |
| 交互与非交互 | 工具可核对父 CLI 进程参数：`exec` 与 `exec resume` 有 `exec` 参数，交互入口没有 | 本机本版普通终端路径可区分；不能把工具集合差异当通用身份字段 |
| 恢复前目录 | 仓库外恢复仓库内会话并选择历史目录时，工具当前目录为历史子目录，但父 CLI 进程工作目录仍是仓库外启动目录 | 已取得本次入口的独立信号，不能以工具当前目录代替；原会话的来源在本次历史环境上下文中也可区分 |
| 跨午夜开启日 | 第二组会话在 11 月 20 日开启，11 月 21 日发首条；模型 `current_date` 为 21 日，匹配 ID 的会话文件名仍为 `rollout-2026-11-20T23-59-55-…jsonl` | 当前日期不能冒充开启日；本次可用文件名核对，工具未读取历史正文来推断归属 |
| 首条保存顺序 | 空白时记录文档为零；真实 `exec_command` 保存并读回合成用户消息后，才写入业务动作标记 | 受控工具路径成立，尚不证明真实 AI 会自主选择该顺序，也未交付完整索引及详情 |
| 普通末轮保存 | 第二组通过工具先保存并读回候选末轮，再返回末轮；正常退出后，独立检查合成线程中实际助手末轮，与保存文件逐字一致 | 证明可行的预存后发送路径；没有证明助手能在发出末轮后继续调用工具，也不能代替真实模型验收 |
| 用户停止 | 延迟回包时在真实终端按 Ctrl+C，未显示该样例的正常末轮，随后正常退出 | 仅证明停止实际发生，未验完整缺口处理和恢复去重 |

第二组[保存观测](acceptance/t004-direct/save-observation.json)保留 `firstUserReadBack`、`businessMarkerAfterReadback`、`actualFinalInSyntheticTranscript` 和 `savedPreparedFinalMatchesActual`，均为 `true`。末轮比对读取的是本次隔离环境中已知合成会话的实际输出，不是把验证端预设文字直接当作已发出的原文。记录规则的工具采集不会因此获得读取其他会话正文的权限。

上述动作由固定回包驱动合法工具调用，验证的是宿主可提供的信号和可执行时序。它未接入真实模型，不能证明 AI 自主发现、读取并遵循 Skill；对照组没有生成记录也不能冒认为 AI 已正确执行准入判断。真实模型下的自动触发、归属核验及普通末轮自主保存仍未运行，最终来源消费仍由 T014 承接。T004 保持未勾选，T007/T009 只能复用这些已验证的技术信号，不能据此直接认定记录前置全部通过。

### 取证与复现边界

实际运行命令为 `node /tmp/foundry-t004-direct-SnEf0j/run.mjs /tmp/foundry-t004-direct-SnEf0j`，完成的观测运行退出码均为 0。临时驱动和调用器的原样文本快照分别保存在 [driver.py.txt](acceptance/t004-direct/driver.py.txt) 与 [runner.mjs.txt](acceptance/t004-direct/runner.mjs.txt)，仅作取证资料，不接入产品运行或构建。复现最终保存样例时，将两份快照复制为独立临时目录中的 `direct-probe.py` 和 `run.mjs`，从本仓库根执行 `node <临时目录>/run.mjs <临时目录>`；它复用仓库现有沙箱与伪终端 helper，每次自行清理合成仓库及隔离状态。九种场景的实际结果保留在第一组观测中，不声称最终快照会重跑已移出的全部场景。

首次调用沿用旧探针的 `/usr/sbin/bwrap` 路径，返回 ENOENT；本环境实际位置为 `/usr/bin/bwrap`，临时调用器按实值调整后继续。末轮预存的[初次日期样例](acceptance/t004-direct/date-trial.json)和[协议诊断](acceptance/t004-direct/protocol-trial.json)未保存末轮，其中工具返回过 `unsupported call: exec_command`；验证端原按 HTTP 请求次数推进步骤，不能代表工具动作已完成。改为按实际工具保存和读回结果推进后，最终末轮保存及实际输出比对通过。这些失败属于验证端，分别保留，不改产品规则求绿，也不计作现行记录能力已失败或已通过。

本轮保存后对原始 JSON 的身份、目录、日期及保存结果进行断言核对，九种入口场景、八份工具身份观测和最终末轮一致性均符合记录；检查六份有关 Markdown 的 113 条本地引用及锚点，无错误。任务身份、顺序和勾选保持原样，`git diff --check` 通过。六份 Markdown 均已执行 `pnpm exec eslint --fix`，被现有忽略规则跳过，不计为正文 lint 通过。临时驱动及观测原样快照核对一致后清理临时目录，保留可复核资料和现有 helper 骨架；没有运行产品完整记录、恢复去重、提交重试或派发验收。
