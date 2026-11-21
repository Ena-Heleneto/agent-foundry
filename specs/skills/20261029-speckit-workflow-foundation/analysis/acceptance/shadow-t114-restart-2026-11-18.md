# T114 重启后的实际入口验收

## 本轮请求与结论

用户表示已将修改后的 Skill 复制到 agents/skills 并重启 Codex，要求验收 T114。本轮实际核对的是工作区 `.agents/skills/shadow-profile/`，不重新复制或修改安装副本。

当前技能目录已列出 shadow-profile，本轮实际完整读取安装正文和宿主约束。安装完整性与既有范围回归通过；当前真实来源被安装记录器拒收，自动记录验收未通过。技能列出及本轮读取不能证明后续每轮均会调用，也不能抵扣无 Spec Kit 普通项目的自然发现验收。

## 实际核验

| 检查 | 实际结果 |
| --- | --- |
| 完整文件集合与 SHA-256 | 安装副本与维护源的 3 个文件全部一致，与此前[复制清单](shadow-independent-workspace-copy-2026-11-18.json)一致 |
| 当前来源定位 | 以宿主提供的 CODEX_THREAD_ID 定位唯一来源，session_meta.id 与当前线程一致，cwd 与本工作区一致；未搜索其他会话正文 |
| 当前会话声明版本 | session_meta.cli_version 为 0.170.0 |
| 终端可执行版本 | codex --version 为 codex-cli 0.169.1；不能以该版本代替当前会话来源版本 |
| 安装记录器支持范围 | Source 校验仅接受 0.169.0，宿主约束亦只声明该版本 |
| 已见可见事件形状 | event_msg/item_completed；UserMessage 与 AgentMessage 提供 thread_id、turn_id、item.id 及完成时点，已见 Agent phase 为 commentary；仅观察字段，不据此扩大支持范围 |
| 真实来源隔离预检 | 安装脚本 capture --once 退出 2，返回 unsupported_source、来源声明版本尚未验证，gap_persisted 为 true；没有 capture_ready 或 saved |
| 隔离 inspect | 退出 0；received_count、raw_count、recorded_count 均为 0，source 为 null；保留一条未解决 unsupported_source，分析及画像覆盖均为 null |
| 安装副本回归 | 既有 test_shadow_runtime 与 test_shadow_coverage 共 27 项全部通过，测试目标均指向安装脚本 |
| 正式资料根 | 核验前后 .specify/memory/user-shadow 均不存在，未恢复已清空的摘要、画像或原文 |

预检以当前工作区为 project-root，将 memory-root 放到项目 .cache 下的 TemporaryDirectory，使用安装脚本和当前真实来源；随后执行同根 inspect。隔离目录核验后自动清理，不保存私人正文或机器来源绝对路径到验收文档。预检失败后没有启动持续监听。

范围回归通过 Python unittest 加载两个既有测试模块，将两者的 SCRIPT 都设置为 `.agents/skills/shadow-profile/scripts/shadow_runtime.py` 后执行；实际输出为 `Ran 27 tests in 3.884s`、`OK`，退出 0。回归输入仍为声明范围内的合成事件，不能抵扣 0.170.0 兼容或实时记录。

## 未执行与后续入口

当前宿主上的连续三轮、普通 final 实时保存、重启后记录续接均未执行，因为真实来源预检已拒收。本轮未修改源码、版本白名单、项目治理或安装副本，也未推进 T115～T118、提交或推送。

后续须在维护源核验 0.170.0 的真实来源结构并完成对应适配和范围回归，再通过既有复制流程更新完整 Skill，重新验证当前来源、实时消息和保存收据。不能伪改 session_meta 或直接放宽版本检查来获得通过。

本记录只判断本次重启后的入口；T114 原最小候选勾选和旧 0.169.0 实验按发生时事实保留，不等同于当前宿主已经通过。用户尚未给出人工通过结论。

文档保存后执行 `pnpm exec eslint --fix`，指定本文件与 implementation/T114.md；退出 0，但两个文件均被仓库现有 ignore 规则跳过，产生 2 条 warning，不能记作实际 lint 通过。未改规则绕过。`git diff --check` 退出 0。
