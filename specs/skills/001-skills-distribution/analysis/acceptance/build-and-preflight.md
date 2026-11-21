# 默认构建与官方只读预检

## 结论和范围

2026-11-09，用户明确“继续”后，沿 T051 骨架实现 T012 的通用默认构建及 T013 的双平台预检。默认 build 已输出正式 Release 格式、固定 agent 数据与 identity/Eve 两投影；Linux 上的标准 US1 合并回归为 **66/66，通过且无跳过**，原目录别名和预检缺失红灯均已消除。内容、构建及唯一 Node 入口消费者检查 **25/25**；包 lint、check-types、build 退出 0。

这是开发候选和通用实现的证据。默认公开清单只选择 coding/frontend 三项稳定技能，`development: true`；完整 dist/skills 继续保留全部线下技能，公开副本仍按白名单迁移。真实同版 workflow 来源、退役清理及主线 T073/T074 尚未移交，`artifact-spec-analysis` 源码仍缺，**T012 完整集合验收没有通过**。T013 的通用代码和 Linux 检查不替代该来源前置或 T015 的完整业务验收；两项原任务 checkbox 暂不提前勾选。未运行发布、用户安装或原生挂载。

## 实际实现

- `build/distribution/export.ts` 复用正式模型和解析器，声明名决定规范目录，正文与全部附件来自同一次源快照；原样脚本先核对字节，构建不导入或执行 script。版本读取包声明，源码提交来自显式构建环境或实际 Git HEAD，不填写假提交。
- `projection.ts` 提取原 MVU-A 校准算法，测试 helper 转导出；identity 保留原字节，Eve 仅按固定官方规则转换各层 SKILL.md，转换内容保存为非 SKILL.md 的 blob，避免官方重复发现。所有投影来源和摘要进入同一文件白名单。
- `references.ts` 检查本地附件、可移植的显式技能依赖和目标项目前提。行内及引用式 Markdown 导航参与检查；代码示例不当作交付附件，`.specify/` 等消费者材料只记录为前提，不复制本仓库治理或个人画像。
- `verify.ts` 在读取、删除及写入前检查路径组件，拒绝输出父目录链接；独立校验同时核对长度、摘要和完整技能文件集合。
- `install-skills.sh/.ps1` 在原安装流程前分出 `--check --official`，核对必填版本、唯一来源、唯一选择方式、单 agent、依赖、正式清单、原始来源、所选投影与目标。静态错误退出 2；不创建安装锁、收据或暂存，不启动 npx。缺依赖列出缺选，完整已满足目标建议跳过，内容/额外文件/链接/已跟踪冲突不输出安装建议。
- all/category 的官方建议显式列出清单中的所选名称，避免完整 dist 的内部或未选来源被星号扩大安装。发布来源的固定提交与生成内容的 sourceRevision 分别验证，不要求两者相等。

## 实测命令与结果

环境：Linux x86_64；Node 24.22.2、pnpm 12.16.1、npm 11.19.1、Bash 5.3.9、jq 1.8.1；实际官方包固定 skills 1.7.4，沿用 `/tmp/foundry-t051-official/node_modules/skills`。未将此环境当成最低 Node、Bash 或 macOS/Windows 的实测。

| 命令或实际操作                                                                                                                                                                                                                                                             | 结果和可观察信号                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t051-official/node_modules/skills pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --story US1`                                                                                              | 最终 66 tests、66 pass、0 fail、0 skip；包括模型、原契约及新增预检十组。真实官方四粒度安装、列出、声明名规范化及二进制附件验证保留；新增检查覆盖静态输入、缺依赖、错误清单、identity/Eve、额外来源、内容/链接/Git 跟踪冲突、79 项目和 77 全局位置及两项拒绝。 |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t051-official/node_modules/skills node --test --test-isolation=none packages/skills/tests/distribution/content-export.mjs packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/distribution/test-entry.mjs` | 25/25；同源连续构建、白名单搬离源码后的真实官方安装、引用式依赖与缺件拒绝、输出链接哨兵、MCP 独立来源及递归清单、脚本原样独立消费、Node 参数/退出/取消，以及真实旧安装分支完整安装正文和二进制附件均通过。                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                                                                                                | 退出 0，未关闭复杂度或正则安全规则。                                                                                                                                                                                                                          |
| 同前缀 `run check-types`                                                                                                                                                                                                                                                   | 退出 0。                                                                                                                                                                                                                                                      |
| 同前缀 `run build`                                                                                                                                                                                                                                                         | 退出 0，默认产物含 mcp、skills、script、agents.json、release.json、projections。                                                                                                                                                                              |
| 从空的 `/tmp/foundry-t012-t013-built-consumer` 调用实际 `dist/script/index.mjs --check --official --source-dir <本次dist绝对目录> --version 0.1.0 --agent codex --all`                                                                                                     | 退出 0，selection 精确为三个稳定技能；installation=not-run；建议只包含三个名称，未将内部 workflow/eval 选入。调用后消费目录仍无文件，报告保存在其外。                                                                                                         |

PowerShell 7.4.6 便携包已在 `/tmp/foundry-t013-pwsh` 准备，下载 SHA-256 `6f6015203c47806c5cc444c19d8ed019695e610fbd948154264bf9ca8e157561` 与原 MVU-C 官方记录一致。真实版本启动退出 0；第一组四粒度与重复选择的精确报告、整个消费者树不变检查为 1/1 通过。其余 PowerShell 范围仍在执行，最终结果另补，不预记通过。Linux 运行 PowerShell 不代表 Windows 验收。

## 先失败再修复及审查

默认接线与正式解析器检查先发现能力缺失。真实 Vite 故障插件在内容复制后把父目录替换为链接：旧实现虽最终拒绝，却已删除输出根外哨兵；检查前置后，构建拒绝且目录外字节不变。独立审查复现引用式必要附件缺失却构建成功、引用式依赖未记录；两条反例先失败，修复后通过。

一次独立 `review_t012_t013` 还发现 all/category 星号超选、Eve 漏验原始正文、错误要求发布提交等于源码提交。实现者修复后，审查方在独立临时来源中再次实际验证：建议精确选名、Eve 原文篡改退出 2、独立发布提交被接受。审查方自己的全套命令遇子进程 EPERM，未当成通过；主执行者按工具审批运行上述最终命令，得到真实通过结果。

普通沙箱的 Node 子进程 EPERM、下载 DNS 失败按工具审批重跑；PowerShell 下载首次 90 秒超时，续传后摘要一致。正则回溯和认知复杂度诊断按具体代码修正，未通过放宽规则求绿。PowerShell 初次启动尝试写真实用户数据目录而失败；后续使用隔离 HOME/XDG，运行时初始化与产品脚本零写入检查分别记录。

## 保留的未验证项

完整新 workflow 集合、README/许可证等最终交付材料、完整发布校验和 T015 仍未通过；真实固定提交 HTTPS 托管与独立使用者、其他操作系统、完整承诺矩阵及原生挂载没有由本轮验证。最低 Node/Bash 沿用原证据范围，未在本轮重跑。包 Python 全套没有重复运行，上轮 Pair 两项旧宪章锚点失败不能据此声称已修复。

当前证据不改变 T008/T028/T030/T037 等原验收要求。临时日志 `/tmp/foundry-t012-t013-*.log`、`/tmp/foundry-t012-t013-built-check.json` 可能随环境清理；本文保存已观察的命令、结果和限制，正式工程状态只由 tasks.md 维护。
