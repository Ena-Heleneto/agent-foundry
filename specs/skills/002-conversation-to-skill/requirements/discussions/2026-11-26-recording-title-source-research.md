# 记录目录对话标题来源初查

**日期**：2026-11-26  
**性质**：实现前只读调研；不是命名方案确认，也不授权实现或迁移。

## 已核对

- 当前维护中的 `packages/skills/src/profile/conversation-recording/recording/events.py` 从宿主事件收集轮次、输入和工具活动；`record.py` 以会话 ID、轮次 ID、开启日期及资料根组织记录，没有读取或持久化对话标题。
- 当前三个 Hook 的实际输入和隔离验收材料围绕 `session_id`、`turn_id`、`cwd` 等字段核验；未发现可直接用作标题的 Hook 输入字段。
- Codex 上游当前 `main` 的 [ThreadMetadata](https://github.com/openai/codex/blob/main/codex-rs/state/src/model/thread_metadata.rs) 同时包含 `title`（尽力提供的标题）和可选 `name`（显式设置的用户可见名称）；[thread summary 处理器](https://github.com/openai/codex/blob/main/codex-rs/app-server/src/request_processors/thread_summary.rs)处理线程摘要。该信息表明 Codex 内部线程元数据层有自动标题和显式名称两种候选，但不是本仓库当前 Hook 契约的一部分。

## 结论与边界

当前代码可直接确认的稳定身份仍是会话 ID；上游线程元数据区分尽力生成的 `title` 和可选显式 `name`，现有证据不能证明 Codex CLI 0.172.0 的项目 Hook 可取得任一字段，也不能证明自动标题在会话生命周期内稳定不变。不能把首条用户消息、生成的摘要或内部数据库字段直接认定为当前可用的 Hook 标题来源。

继续前需针对本项目实际安装的 Codex CLI 版本检查线程元数据是否可读取、读取时点、标题是否可变，以及缺失、重复和不适合作为路径字符时的处理。之后由用户确认目录身份、冲突消解、恢复定位和迁移规则；确认前保持当前会话 ID 布局，不改代码或已有记录。

## 2026-11-26 隔离 CLI 实测

使用 Linux Codex CLI `0.172.0`、临时 Git 仓库、独立的 `HOME`、`CODEX_HOME` 和 `CODEX_SQLITE_HOME`，在网络隔离环境中复用 [T035 的本地回环应答夹具](../../../../../packages/skills/tests/conversation-workflow/helpers/recording-hook-probe.py)。从维护源安装现有记录 Skill 到临时仓库，原生确认项目和 Hook 信任后重新普通启动。仅在临时项目的 Hook 配置中附加只读观测命令：以每个回调的 `session_id` 精确匹配 `state_5.sqlite` 的 `threads` 记录和 `session_index.jsonl` 的条目，不改记录器及真实工作区配置。

| 操作与观测时点 | `threads.title` | `threads.name` | 会话索引最后一条匹配记录的 `thread_name` |
| --- | --- | --- | --- |
| 首条「请只回复 T035_NO_TOOLS」的 `UserPromptSubmit` | 空字符串 | 空值 | 无匹配条目 |
| 首轮 `Stop` | `请只回复 T035_NO_TOOLS` | `请只回复 T035_NO_TOOLS` | `请只回复 T035_NO_TOOLS` |
| `/rename FoundryTitleOne` 后，同一会话下一轮的 `UserPromptSubmit` 和 `Stop` | 仍是首条文字 | `FoundryTitleOne` | `FoundryTitleOne` |
| `/rename FoundryTitleTwo` 后正常退出，停止隔离后台，按原会话 ID 恢复；恢复轮的 `UserPromptSubmit` 和 `Stop` | 仍是首条文字 | `FoundryTitleTwo` | `FoundryTitleTwo` |

六次回调的会话 ID 一致，输入本身没有观测到标题或名称字段。两次 `/rename` 都在原生界面显示相应的新名称，没有额外产生普通轮次的记录回调。索引保留同一会话的历史名称条目，不能取第一条当作最新名称。原记录器最终仍在同一个会话 ID 主记录中保存了三个轮次；本次没有实施或验收目录改名、链接迁移，也没有覆盖 `PostToolUse` 或其他宿主版本。

**结论**：在本次受测版本和有权限读取隔离状态的项目 Hook 环境中，首条消息回调不能依赖标题；下一次自动记录可以按同一会话 ID 读到用户改过的名称，重启后恢复也取得同样结果。`threads.name` 是优先评估的候选，`threads.title` 在改名后仍为旧值，不能用来判断改名。数据库和索引都是本次实测的内部存储，未验证跨版本稳定性，也未确认正式读取方式、读取失败的处理、路径命名或手动目录改名规则。

## 2026-11-26 首轮结束后派发命名子代理的隔离对照

本次验证 [子代理首次命名需求](../raw/2026-11-26-recording-initial-title-by-subagent.md) 的技术前置，不涉及 Codex 界面主动改名。使用 Linux Codex CLI `0.172.0`、两个临时 Git 仓库及独立宿主状态，沿用上面的网络隔离和本地回环夹具。从维护源安装现有记录 Skill，通过原生信任后普通重开。两组都只发一条关于密码重置界面的合成请求；首段回答由回环端点固定返回 `PROBE_FIRST_REPLY`，不调用业务工具。仅在临时项目加一个 `Stop` 探针，对照是否返回继续决定。继续组由受控回包选择宿主真实的 `spawn_agent` 和 `wait_agent`；不以该回包证明真实模型会自行选择工具。

| 对照 | 宿主行为 | 用户可见与记录结果 |
| --- | --- | --- |
| 普通 `Stop` 只观测，不请求继续 | 同一会话只有一个线程，没有派发或回传 | 终端只显示首段回复；现有记录器写入一个轮次、无工具详情 |
| 首次 `Stop` 请求继续；后续 `Stop` 不重复请求 | 宿主在同一父会话、同一轮次接着执行 `spawn_agent`，取得独立子线程 ID，`wait_agent` 回传 `PROBE_CHILD_TITLE`；第二次父轮 `Stop` 标记 `stop_hook_active=true` | 首段回复已经显示，终端又显示 `Blocked by hook`、派发、等待和第二段回复。仍只有一个父轮记录；主记录只保留首段回复，详情可回查派发与回传 |

**结论**：在首段回复零工具调用的前提下，`Stop` 可让宿主重新进入同一父轮，并在受控条件下派发和取得真实子线程回传。但这不是正常结束后独立、无干扰的命名：它延续原轮次，产生用户可见输出，且现有记录器没有保存第二段回复。不能把该路线作为首期自动命名的验收通过。建议保留普通 `Stop` 的落盘职责，先评估能否在父轮结束后独立派发；若无合适入口，再讨论延后命名。未运行真实模型自主派发、独立后台派发、主题判定、失败重试、目录改名或链接更新；未修改当前工作区安装、Hook、规格或任务。

## 2026-11-27 首条落盘后派发命名子代理

用户确认首条原话保存后即可尝试命名。命名子代理根据已保存的早期发言返回标题或空值。先验证派发与正常回复可以独立完成，再接入目录改名。 [用户确认](../raw/2026-11-27-recording-title-trigger.md)

使用 Linux Codex CLI 0.172.0 和真实 `gpt-6.2-sol`，推理力度为 medium。临时 Git 仓库从维护源运行 `install.py` 并逐一核对 20 个安装文件。临时 CLI 只读使用现有原生登录，项目和 Hook 通过原生信任流程启用。探针在临时 `UserPromptSubmit` 里调用正式保存脚本，确认原话「雨后为什么容易看到彩虹？请用一句话回答。」已经写入主记录，再通过 `additionalContext` 给父模型追加派发指令。宿主实际在开发者消息中载入该指令。 [观测投影](../../analysis/acceptance/recording-title-first-prompt.json)

- 父模型调用一次原生 `collaboration.spawn_agent`，子线程是 `/root/recording_title`。父会话发出一条正常回复，终端实发和主记录原文一致，当时命名子代理尚未返回。
- 子代理在主回复之后 18.010 秒发出 `{"title":"雨后为什么容易看到彩虹"}`。原生 `SubagentStop` 回传与子轮实发内容一致。父线程、派发调用 ID、子线程与轮次均已核对。探针的等待工具调用发生在放行之后，时序结论来自实际观察到的先后。
- 本次派发正文在宿主输入中以非明文形式记录。初版探针按输入内容匹配标记时断言失败，读回改按宿主任务名、子线程 ID 和原生父子关系核验。正式接入需沿同样的可核实身份关联命名回调。

本次只覆盖一个主题明确的合成首轮。空标题、重试、目录重命名和链接更新留待各自验收。临时项目仍使用会话 ID 主记录路径。 [时序、回传及安装文件校验](../../analysis/acceptance/recording-title-first-prompt.json)
