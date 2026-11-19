# 本地构建闭环验证

## 后续用户确认：缺安装源文件直接报错即可

2026-11-20，用户在看到下方测试结果后明确[确认](../../requirements/raw/2026-11-19-engine-output-directory.md#2026-11-20-缺安装源文件的失败要求)：该场景报错即可，不需要保留旧 dist 或额外恢复操作。实际缺源报 ENOENT、退出 1 已满足要求，撤回上一轮把旧产物清除列为待修复缺口的判断，复现事实保持。按本次确认，本地构建与沙箱消费链路已验证；Python 三项旧失败、正式发布和其他未验边界仍沿下文事实，不自动勾选整个 Task。以下保留上一轮测试发生时的报告及判断，涉及该场景的待修复措辞以本节为准。

日期：2026-11-20。用户要求测试当前构建逻辑是否闭环，本轮仅测试及留证，未修改产品实现或工程 checkbox。

正常本地链路已经验证：配置及技能源 → Vite 构建 → 本地测试归档 → 实际生成安装入口 → 同包引擎入口 → Speckit 子脚本 → 官方 CLI 注册。异常构建保护仍有一处缺口：缺少安装入口源文件时，构建会失败，但旧 dist 已被清空，不能据正常链路通过宣称全部异常已闭环。

## 输入及验证边界

实际环境：Linux x86_64、Node v26.8.1、pnpm 12.8.1、Specify CLI 1.4.1.dev0；临时使用官方 jq 1.7.1。核查的是当前未提交工作区及其真实构建字节，不是严格候选或已提交版本。

开发配置启用 11 项技能，含 coding、frontend、workflow、eval 和 profile。独立读取各集合配置及实际正文，对照全部构建文件，未使用被测 scanSkills 的返回值作为预期。全量开发 dist 只在自有本地沙箱中归档和消费，未公开；该测试归档不等于 T069 的正式范围过滤、许可检查或流水线交付。网络 curl 和 npm 由隔离适配器交付本地版本表、真实 tar 和 jq，实际生成入口仍执行摘要核验、解包、复制、隐匿及引擎调用；Specify 注册使用当前真实 CLI，未以受控 CLI 冒充官方结果。

## 本轮结果

| 验证项 | 实际结果 |
| --- | --- |
| `pnpm --filter @foundry/skills run build` | 退出 0；11 项技能、16 份技能文件、根 VERSION 及四份 Shell，总计 21 文件 |
| 来源与输出逐字节核验 | 正文及附件全集一致，无多余文件；安装入口与 install.source.sh 一致；VERSION 为 0.1.0，等于 package.json.version |
| 同输入连续构建两次 | 21 文件的路径及 SHA-256 全部一致 |
| 真实配置 `build({ build: { write: false } })` | 仅返回五项内存资产，已有磁盘 dist 全集及字节未变 |
| 四份生成脚本分别执行 `bash -n` | 均退出 0 |
| 实际产物本地打包后运行生成的 curl/install.sh，传入 `--hidden` | 退出 0；11 项原技能及附件保持字节，Git 证实本次项全部被精确隐匿；真实引擎调用真实 Speckit 子脚本，官方登记四个扩展及三个 hook，Codex Increment 正式入口存在 |
| 官方登记及正式入口读回 | extensions 为 artifact-project-description、artifact-spec-analysis、implementation-preparation、modes；事件为 before_implement、after_tasks、after_converge；Codex 命令为 speckit.modes.increment；入口引用已安装 task-increment 正文并保留字面量 $ARGUMENTS |
| 非 Spec Kit 临时项目传入 `--no-mount` | 退出 0；技能保持字节，没有 Increment 注册 |
| 包内缺少后续 Speckit 子脚本 | 退出 2；保留已装技能，零 Increment 注册，临时下载目录清理 |
| 本地版本表提供错误 MD5 | 退出 2；零技能安装、零挂载，临时下载目录清理 |
| 引擎、挂载、隐匿/安装及技能四文件 Node 回归 | 53/53 通过，0 失败、0 跳过 |
| 包 lint、check-types | 均退出 0 |
| 包 Python 测试 | 39 项中 36 通过，三项既有旧脚本缺失失败，见下文 |
| 隔离包副本删除 hidden 模板 | 构建退出 1，保留旧 dist 哨兵 |
| 隔离包副本删除 install.source.sh | 两次独立复现均退出 1，旧 dist 哨兵被清除；恢复同一源文件后构建退出 0 |

Node 回归命令为：

```bash
node --test packages/skills/tests/distribution/vite-plugin-engine.test.mjs packages/skills/tests/distribution/speckit-mount.test.mjs packages/skills/tests/distribution/hidden-contract.test.mjs packages/skills/tests/distribution/vite-plugin-skill.test.mjs
```

命令执行时测试进程 PATH 包含本轮临时真实 jq，未安装仓库新依赖。Python 的 `test_cli_failure_is_reported`、`test_every_run_reinstalls_all_sources`、`test_installs_increment_and_attachments` 仍因 `script/register-commands/register-commands.sh` 不存在失败，未改断言、规则或旧路径。

## 缺入口源文件时的旧产物保护缺口

复现只操作独占临时包副本：复制当前包的 build、utils、src、package.json 和 vite.config.ts，node_modules 链接到当前包依赖；预置 `dist/previous.txt`，删除副本内 `build/plugins/vite-plugin-curl/install.source.sh`，从副本运行真实 Vite CLI 及配置。结果为 ENOENT，错误明确指向被删源文件，退出 1；构建前目录只有 previous.txt，构建后为空。恢复入口源文件，原副本立即正常构建。真实工作区源文件从未移走。

原因已沿失败边界核对：`build/plugins/vite-plugin-curl/index.ts` 在 generateBundle 才读取安装入口正文，而 `vite.config.ts` 配置 `emptyOutDir: true`，输出清理先于该阶段。技能输入的 buildStart 校验和 hidden 模板的配置加载失败均能更早拒绝，对照场景保留旧产物。缺安装源文件的前置检查仍待补齐，本轮不以调整错误预期或修产品代码把它改记通过。

## 未覆盖及独立工作线

本轮未验证真实网络下载、R2 版本表/上传、正式白名单与许可归档、宿主实际执行业务、重复安装迁移或其他平台；本地正常链路通过不代替这些阶段。T076/T077 保持原工程状态。紧急版沿 T090 原候选证据及 T091 具体发布授权前置，本轮未重建或发布该线。
