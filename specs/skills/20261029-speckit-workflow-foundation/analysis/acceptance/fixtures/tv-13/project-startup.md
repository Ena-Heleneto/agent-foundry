# T111：真实项目新会话接入证据

日期：2026-11-14。仅核对当前仓库已批准的源码复制和记录入口；不是用户效果验收。

真实宿主 `codex-cli 0.169.0`；新会话 ID：`01a1d83e-38c1-7061-8ca9-ef6e99ea3d9d`。唯一来源与项目副本全目录 diff 为 0，SHA-256：`3c35847b795e1cc90fe3d503168cbd31849d607fe0a90abf4d2ab963ebc1049e`。

AGENTS 原正文完整前缀保持，仅追加短引用；复制前目标不存在，其他技能条目集合及 mtime 全部保持。既有复制脚本只报告新建 shadow-profile 1 个。资料根从本项目本轮真实可见用户授权开始，不迁入旧私人画像或人工测试偏好。

新会话输入明确来自主执行 Agent：

````text
这是一条由主执行 Agent 发出的本地接入验收指令，不是用户原话或偏好。请核对当前项目既有的会话记录入口是否实际生效，然后简短汇报当前用户画像有哪些依据、哪些还不足。仅允许按项目已生效规则维护 .specify/memory/user-shadow，其余文件只读；禁止推进任何 Task、修改技能或工作流、提交或发布。真实用户本轮授权来源已保存在 R01，可读取核对，不把本验收指令当用户新偏好。
````

CLI 事件 5：exit=0，实际命令：

````bash
/bin/bash -lc 'pwd && git status --short && cat <user-home>/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/using-superpowers/SKILL.md && cat .agents/skills/shadow-profile/SKILL.md'
````

CLI 事件 14：exit=0，实际命令：

````bash
/bin/bash -lc "cat >> .specify/memory/user-shadow/conversations/2026-11-14.md <<'EOF'

## R02

- 来源：当前可见的主执行 Agent 本地接入验收指令，明确不是用户原话或新偏好；真实用户授权来源沿用 [R01](#r01) 的既有记录，本轮未直接看到 R01 所概括的原始历史消息。宿主会话和轮次 ID 未提供，本地会话定位为本文件 R02；不确认与 R01 属于同一宿主会话。
- 本轮范围：核对项目既有会话记录入口是否实际生效，并简短说明画像依据和不足；仅允许按既有规则维护本资料根，其余文件只读，不推进 Task、不修改技能或工作流、不提交或发布。
- 已发生行为：检查 git status，发现已有大量暂存、未暂存及未跟踪文件，未覆盖；完整读取 .agents/skills/shadow-profile/SKILL.md，读取 profile.md、本文件 R01 及 AGENTS.md 接入条款。入口要求每轮调用，资料根与实际文件一致；本轮实际加载技能并执行摘要保存，不仅检查配置存在。
- 画像依据及限制：现有依据是 R01 所记录的任务授权、项目范围、单人研发和暂行 Git 约定；没有独立结论文件，profile.md 明示理解不足。单次选择、Agent 指令及人工测试均不能推断为长期用户偏好；真实后续应用与长期效果尚未验证。本轮无新增本人认识，不新增结论或改写画像。
- 覆盖截止：本次写入前已发生的读取与核对行为；本轮最终答复尚未发出。保存后的读回与 Markdown 校验结果以实际工具轨迹为准，不预记成功。
EOF
pnpm exec eslint --fix .specify/memory/user-shadow/conversations/2026-11-14.md"
````

CLI 事件 16：exit=0，实际命令：

````bash
/bin/bash -lc 'tail -n 12 .specify/memory/user-shadow/conversations/2026-11-14.md'
````

事件 5 实际输出包含最终技能全部正文；事件 14 追加 R02，事件 16 实际读回，事件 17 才发最终答复。原始会话轨迹另核对嵌套 Markdown 命令，不因 CLI JSONL 缺事件判断未执行。R02 明确是 Agent 验收指令，不冒充用户消息；没有结论文件，profile 保留理解不足。个人记录正文只留项目资料根，此处不重复复制。

当前仅本机 Linux/Codex CLI/项目级验证；当前主会话也已实际完整读取副本并保存 R01，不假定 AGENTS 文件会热更新任意宿主。后续真实机会由 T112 核查，正式安装等主线完成另接，不按本次读取成功认定应用效果。
