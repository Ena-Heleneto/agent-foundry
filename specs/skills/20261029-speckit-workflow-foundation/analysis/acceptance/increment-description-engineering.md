# Increment 描述能力工程交付

日期：2026-11-09。范围：T089；依赖[候选验证和来源回归](tv-06-description.md)。

## 实际交付

源码 SHA-256：`23e6bc2fe64685b404a4abda28f1f4094bac55ae3e0b5829790884bfce07c12c`。完整 dist 文件与来源字节一致；官方生成入口允许官方重写 frontmatter，去掉 frontmatter 后正文与来源一致。生成文件 SHA-256：`17b45748c2c00ae5bca6dbb459de05b4eb102a2a53fb0af9ef5d97fd55c59c9e`。

复用已有初始化元数据建立 `/tmp/increment-tv06/official-project`，所有安装动作仅限该隔离项目。已有缓存 CLI `s_51tx9Lm47I8qPa/bin/specify version` 实测 1.2.6，随后实际运行：

```bash
PYTHONDONTWRITEBYTECODE=1 bash packages/skills/script/register-commands/register-commands.sh --project /tmp/increment-tv06/official-project --skills-dir /home/by152/workspace/ena/foundry/feature/speckit-workflow-extensions/packages/skills/dist/skills/workflow --cli /home/by152/.cache/uv/archive-v0/s_51tx9Lm47I8qPa/bin/specify
```

官方退出 0，生成四项 modes；日志 official-install.log、来源/构建/生成正文比较 delivery.json 在隔离根。没有修改本工作区安装配置或生成入口。

## 从生成入口实际应用

独立 agent 从隔离 `.agents/skills/speckit-modes-increment/SKILL.md` 加载规则，在 `/tmp/increment-tv06/entry-apply/` 构造仅有 API 的项目，实际保存两条路径：

- with-description：用户要求单条验收后批量，正文改为 T001→T003→T002→T004，已完成 service T001 保留；无前端职责不新增页面凑层。
- without-description：沿磁盘原批量→单条推荐，tasks 字节未变，不强制填写描述。

两组再次读取并判断后无新改动；各 8 个项目文件的重复摘要一致。输入、结果、正文比对分别在各组 result.txt、repeat-hashes.json 和 entry-version.txt。临时 Markdown 的 ESLint 配置发现失败，显式配置后退出 0 但文件在 base path 外被忽略，不能算 lint 通过；人工读回、链接、结构和保护核对已记录。正式源码及本 Spec 证据按仓库格式验证。

八类输入沿 T087 同版候选材料复核，来源/构建/生成正文相同；正式入口的重新规划应用为上述两组；另由同一审查 agent 逐组实际读取八类输入及产物，人工复核并判断是否需改，结果位于 /tmp/increment-tv06/entry-regression.txt。这是八组人工回归，不是八次独立上下文。首次发现 03 定位带 T005 却重排无关任务，已保留错误并进入规则及材料修正，最终结论见该报告追加记录。该边界不抵扣完整 T086 消费或真实 T076 反馈。

## 实际工程检查

| 命令                                                                                                                                | 结果                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                         | 退出 0                                                                                          |
| 同包 `run check-types`                                                                                                              | 退出 0                                                                                          |
| 同包 `run build`                                                                                                                    | 退出 0                                                                                          |
| 同包 `run test`                                                                                                                     | 23 方法，2 项 Pair 既有旧治理锚点失败，其余通过；修改前独立 ArtifactTests 同样两项失败，归 T065 |
| `python -B -m unittest test_artifacts.ArtifactTests.test_increment_delivery_matches_source_with_reachable_governance`（tests 目录） | 1 项通过                                                                                        |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs`                                        | 沙箱首跑 6/7，子进程 EPERM；同命令获环境批准后 7/7 通过                                         |

未弱化 Pair 断言或修复无关源；全包测试未全绿。PowerShell/Windows/macOS/最低 Node 未执行，本次只确认当前 Linux 及缓存官方 CLI。临时材料结果不是页面/业务验收、用户反馈或完整同一分析刷新。

本工作区正式安装副本仍需 T072 刷新；本轮只交付来源、构建及隔离入口。T064/T086/T076、T072 完整迁移及最终结案按原任务继续，均不自动勾选。

最终独立复查已重新加载补强后的官方入口并比对当前来源正文：03 修正后 tasks 完整摘要与原始 before 一致，允许范围为 T001/T002/T005，无关 MVU 详情字节保留；首次失败仍保存。其余七组按最新规则重读核对未发现失效。最终结论为“03 先失败后修正复核通过”，不是首次八组全部通过，也不是八次独立调用。最新完整报告为 /tmp/increment-tv06/entry-regression.txt。本次文档和范围检查通过不代替真实业务/用户验收。
