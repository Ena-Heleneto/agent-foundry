# TV-13：T108 最小接入实际证据

2026-11-14，依据 [T108 方案](../../../../implementation/T108.md)。结果：最小假设通过，完整交付仍待 T109～T112。真实宿主为 Linux 本机 `codex-cli 0.169.0`，不是桌面宿主；调用 `codex exec` 后以真实 thread ID 连续 `resume`。全部输入为人工测试，不进入真实用户画像。

## 来源、复制和输入

唯一源码 `packages/skills/src/影子画像/shadow-profile/SKILL.md`，当时 SHA-256 为 `98412ed1a0129bc6889503497fd119ced2c9295fe097aa2996a43bea29fee351`。既有 `bash scripts/dev/actions/link-skills/link-skills.sh packages/skills/src/影子画像 <case>/.agents/skills` 报告只新建 shadow-profile；全目录 `diff -rq` 为 0。来源全文、真实事件及保存后快照见 [自动摘录](minimal-trace.md)。真实仓库的 AGENTS、副本和资料未修改。

临时 AGENTS 只约定每轮完整读取并执行 `.agents/skills/shadow-profile/SKILL.md`，指定 `docs/user-shadow/`，故障仍回答并报告缺档；注明人工情境、研发仅本人和 Git 暂行。

无技能对照只发送“闭包是什么？用一个简单例子解释。”，正常回答、无记录工具事件、无资料目录，证实默认行为不留档。先行带技能试验误用 CLI 默认只读模式：三轮都加载正文并在正常回答中报告缺档，无保存；这是测试设置差异，不计正常成功轮。未隐藏这组三轮或把自述当写入成功。

随后在全新临时项目明确设置 `-c 'sandbox_mode="workspace-write"' -c 'approval_policy="never"'`，保持相同来源和同样输入，`--ignore-user-config --skip-git-repo-check --json`：

| 轮次与原始输入 | 全文读取完成事件 | 保存及读回完成事件 | 最终答复事件 | 实际摘要 |
| --- | --- | --- | --- | --- |
| 1：闭包是什么？用一个简单例子解释。 | 5 | 9，exit 0 | 10 | R01 |
| 2：这是人工测试偏好：解释概念时我希望先举例，再给定义。 | 4 | 9，exit 0 | 10 | R02 |
| 3：好 | 5 | 7，exit 0 | 8 | R03 |

三轮实际调用及摘要覆盖均为 3/3。正文全文在对应工具输出可核对，保存命令实际创建/追加并 cat 读回，顺序均先于最终答复。首次只有真实摘要和理解不足画像入口；第二轮保存人工情境要求，第三轮 profile 字节未变。未提前写本轮最终回复，后续摘要才补上一轮真实答复。

## 检查与边界

`uv run --no-project --with pyyaml python .../skill-creator/scripts/quick_validate.py packages/skills/src/影子画像/shadow-profile` 实际返回 `Skill is valid!`。Markdown 均执行 `pnpm exec eslint --fix`；本仓库配置对这些路径返回 ignored 警告，不能记为内容 lint 通过，另做完整读回和引用检查。

T108 只证实此 CLI/此最小来源及短引用的正常三轮，不证明任意宿主强制执行或长期效果。最小来源尚未规定完整结论链；第二轮直接从摘要补入人工情境画像、没有 Enn，是 T109 完善前实际可观察的缺项，不能拿本次通过替代最终来源、纠正和故障恢复。后续必须从同一来源增量并重新复制复验。临时目录保留原始现场，清理沿原 T080，不复制他人或旧仓库个人资料。
