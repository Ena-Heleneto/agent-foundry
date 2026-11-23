# T005 对话内容来源实测

2026-11-23 按 [T005 方案](../implementation/T005.md) 复用 T002 临时仓库，使用 `codex-cli 0.171.0` 和真实 `gpt-6.2-sol`。三个样例均从仓库根以 `--no-daemon --no-alt-screen` 开启交互，使用 `workspace-write` 和仓库外临时资料区。终端、附件和子代理分别使用独立 CLI 状态。样例由合成提示驱动，取证范围是当前父会话。会话定位、工具原值、事件顺序及哈希保存在 [合成观测](acceptance/t005-content/observations.json)。

## 终端工具与会话归属

| 场景 | 实测结果 |
| --- | --- |
| 短输出和命令参数 | `exec_command` 的代码调用保留了命令和选项。程序回显的参数数组与预置值一致，`参数 A` 仍是单个参数，短文本末尾的两个空格和换行均保留。 |
| 长输出 | 对 163854 字节的已知样例以 `max_output_tokens=256` 执行 `cat`。返回保留首尾，宿主报告原始 40964 个 token，省略 40708 个 token。向模型交付的返回文本含截断提示，共 1132 字节。另用现有工具核对本地源文件的字节数及 SHA-256，与 T002 样例一致。 |
| 流式输出 | 使用 `yield_time_ms=1000` 启动命令，再按同一命令会话号调用 `write_stdin`。依次取得三个回包，拼接后与 `"流一  \n流二\n流三\n"` 逐字节一致，最后退出码为 0。 |
| 仓库外工作目录 | 调用传入同名前缀仓库外样例的 `workdir`。`pwd` 和 README 的原始返回与该目录相符，调用仍落在仓库内开启的原父会话及轮次，终端的 `CODEX_THREAD_ID` 与父日志一致。 |

流式分段须按实际返回顺序和命令会话号聚合。长输出的已截断回包只能保存其中可见的部分。有同一原件的可读来源时可另行核对并保存，本例验证了本地源文件这条路径。

## 本地工具与附件

用交互入口 `-i <样例 PNG> -- <合成任务>` 附加会话图像。用户消息的附件标记提供实际路径，`input_image.image_url` 提供 PNG data URL。模型通过 `CODEX_THREAD_ID` 定位本轮合成日志，核对会话 ID 后解码并保存，原件元数据随字节保留。模型也调用了本地只读 MCP 样例 `known_artifacts`。服务端实际收到 `{"label":"选项 A","count":3,"enabled":false}`，模型端的 `structuredContent` 与之相同。文本返回保留末尾两个空格及换行。

| 样例 | 来源 | 保存字节 | 原件及保存文件的 SHA-256 |
| --- | --- | ---: | --- |
| 会话图像 | 用户消息的 `image_url` | 154 | `6c63b8654b9d53c32843d57497e64184f4ab99de5b8e24cbbb711c40ec29bc36` |
| 工具二进制 | 内嵌资源的 `blob` | 6 | `a0ed0f459b2094e0c609f62dfa4da8d4c80172534670ca2220f4f931a4f2c40d` |
| 工具图像 | 工具图像的 `data` | 151 | `60bdccbb8a0fa6adf7742bbd23147af45875abb6dab4a694fde279c17e19308f` |

模型通过宿主的 `read_mcp_resource` 实际读取了工具返回的资源链接。JSON 返回中的 `blob` 与内嵌资源一致。仅出现链接时，需实际读取并取得字节才能确认原件已保存。本轮比较覆盖上述 PNG 和二进制，其他附件形态仍需取证。

## 子代理活动及父会话可见字段

在单独父会话启用 `multi_agent_v2`。真实执行 `spawn_agent`，取得 `/root/t005_child`，收到第一条 `T005-CHILD-INITIAL`，随后以 `followup_task` 对同一代理交互，收到 `T005-CHILD-FOLLOWUP`。`spawn_agent` 返回代理路径，`list_agents` 返回当时状态，`followup_task` 的工具返回为空字符串。两条回传都可在父日志的 `agent_message` 读到完整原文。

父日志的 `task_started.turn_id` 对应该轮。`SubAgentActivity` 的 `started`、`completed`、`interacted` 和第二次 `completed` 均关联同一父轮及同一实际 `agent_thread_id`。调用中的 `task_name` 和 `target` 可从父日志回查。两次调用的 `message` 在父日志参数中落成不透明串，该来源缺少可直接回读的输入明文。父会话的可见回传与原生状态事件已分别核对，子线程正文没有用于取证。

## 重试、缺口与后续任务

初次终端驱动没有完成目标轮次，附件启动只提交了图像，随后退出打断了目标提示。通过交互入口的单一初始提示重跑，并在 `-i` 与提示间加 `--`，把图像与目标提示作为同一轮读取。临时 MCP 工具首次受 `never` 下的工具审批策略阻止，随后仅为合成工具声明只读，并将该工具的 `approval_mode` 设置为 `writes`。重跑实际收到工具结果和资源读取回包。[Codex 工具配置](https://learn.chatgpt.com/docs/config-file/config-reference)

T008/T010 可使用本轮已验证的内容来源和边界。只有截断文本、资源链接或不透明参数时，资料仍须标记对应缺口。本轮完成内容来源的技术验证。T004 的入口判定、T006 回归以及 T014 的最终安装入口与完整记录验收继续沿原任务执行。

## 资料核验

T002 的 8 项样例回归通过。对三组真实父会话重新提取并核对调用、返回顺序、会话身份和保存哈希，与归档观测一致。对变更 Markdown 执行 `pnpm exec eslint --fix`，现有规则忽略规格目录，命令的 pnpm 预安装阶段报告文档站无法加载 `@nuxt/nitro-server`。另行核对正文、本地引用及 `git diff --check`。
