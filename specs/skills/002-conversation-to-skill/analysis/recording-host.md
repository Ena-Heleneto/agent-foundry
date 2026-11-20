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
