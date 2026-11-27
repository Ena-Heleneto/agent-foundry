# T003 / MVU-A：官方技能发现、选择、投影与路径验证

**日期**：2026-11-04。**任务**：[T003](../../tasks.md)。**结论**：T003 按本次确认的 Linux 范围通过。**本次验收范围**：用户明确“没有，我们只验证 Linux 吧”，本项按 Linux 实测验收，Windows/macOS 不计通过；其他任务的平台要求不由本记录自动改写。

## 实验对象与工具

实验从真实 src/skills 的 coding/frontend/workflow 复制独立内容目录，公开 16 项，不取 dist 或 .agents 副本。使用官方 skills 1.7.4 的原始 npm CLI；每个安装新建临时项目和隔离用户，关闭遥测，结束清理。技术分级为中型真实安装流程，加逐 agent 路径验证；不代表完整跨平台四粒度矩阵或模式行为验收。

- 官方版本：skills 1.7.4；源码 tag v1.7.4，npm 元数据 gitHead 为 a80e4c9d12d607631249d4d7d059f835d4b2f13a。
- npm tarball SHA-1：f7ca98f41a7ac629f9fc8c5c4f05095a471eca06；下载后按官方元数据 SHA-512 校验一致。
- YAML：2.8.3，实验读取实际官方包依赖版本并断言，不以报告常量充当检查。
- Linux Node 24.22.2 初轮 8/8 通过；修复后的完整实验在最低 Node 22.20.0 下 9/9 通过。后续仅移动报告回调的声明位置以满足 lint，行为不变。
- 79 个 agent 各自项目级安装、77 个可用全局安装均实际调用官方 CLI；eve/promptscript 的 global 请求另外验证不创建安装文件。没有启动79种 agent 程序，不声称技能实际调用兼容已通过。

## 实现与复用边界

`catalog.ts`（目录与文件读取）、`projection.ts`（Eve 投影）、`selection.ts`（选择与只读预检）当前仅服务 MVU-A，按用户最新要求统一保存在 `tests/distribution/helpers/`。这些是实验辅助模块，不属于已交付安装器，也不进入 dist/script。运行实验由 `tests/distribution/mvu-a.mjs` 承载；既有 test-distribution.mjs 按文件约定自动发现，无须修改调度器。

路径骨架消费固定上游配置，本轮通过源码探针读取配置并与官方实际写入结果核对；独立 agents.json 固化仍归 T008/T011，不把下载的源码变为产品运行依赖。脚本尚不是可交付的完整安装器，不开展 T004 或五指令挂载。

## 验收事实

| 场景                                  | 预期                                               | 实际                                                                         |
| ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| 发布根、frontend 分类、单技能目录列出 | 发现对应公开技能且不安装                           | 通过，项目无安装文件，未混入 eval                                            |
| 整包、分类、单技能、多技能安装        | 完整正文/附件，未选新增为0                         | 通过；单选 task-explore 仅新增该技能                                         |
| 79 项目位置 + 77 全局位置             | 实际路径符合原生行为，逐文件零字节差异             | 156 次真实安装通过                                                           |
| Eve 投影                              | 删除不识别字段，保留正文、嵌套 YAML 和附件         | 手写期望样本与实际官方安装均通过                                             |
| 名称、分类和冲突预检                  | 无选择/混选/未知名/未公开分类拒绝；用户文件不变    | 通过，已满足集合只读核验                                                     |
| 上游特殊行为                          | 不能仅凭退出码判定完整成功                         | 有效+未知名可仅安装有效项；不支持 global 可返回0；裸重装覆盖修改，均真实记录 |
| 元数据与目录边界                      | 目录名不替代声明名，重复名/链接/被官方排除文件拒绝 | 通过                                                                         |
| 环境变量与 OpenClaw 旧路径            | 各分支实际安装到正确位置                           | 12 个分支通过，详见下表                                                      |
| 链接冲突修复                          | 失效目标链接与祖先链接拒绝，外部哨兵不变           | 先失败、修复后通过                                                           |

## 命令与工程验证

预先取得官方 npm 包及同版本源码后，设置两个绝对路径即可复跑；路径指向工具材料，不是安装目标。它们缺失、版本不符或场景失败均非零退出。工具材料只放临时目录，不加入 workspace 依赖。

```bash
FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t003-tools/node_modules/skills FOUNDRY_SKILLS_SOURCE=/tmp/foundry-skills-source/skills-1.7.4 pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu A
FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t003-tools/node_modules/skills FOUNDRY_SKILLS_SOURCE=/tmp/foundry-skills-source/skills-1.7.4 /tmp/foundry-t003-node22/node_modules/node/bin/node packages/skills/tests/distribution/test-distribution.mjs --mvu A
```

第一条初轮 8/8 通过；第二条最终 9/9 通过，174 条安装/拒绝观测完整输出（172 次成功安装、2 次不支持范围拒绝），包含末尾12分支。原始日志位于 /tmp/foundry-t003-full.log、/tmp/foundry-t003-node22-final.log；临时文件可能清理，本文保存实测要点与逐项路径。

| 验证命令                                                                                                                                                                                         | 结果                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                      | 通过（最终全包检查）                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                               | 通过，覆盖导入的运行时选择骨架                             |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                     | 通过，单次构建三目录                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                      | 13 tests 通过                                              |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs packages/skills/tests/distribution/test-build-config.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` | 15 项中14通过、1 PowerShell缺运行时跳过；不算 Windows 通过 |
| `uv run --cache-dir /tmp/skills-distribution-uv-cache --isolated --no-project --with pytest python -m pytest -o pythonpath=<source-workspace>/apps/mcp/src apps/mcp/tests/test_registry.py`      | 7 passed；隔离 pytest 9.2.0，Python 3.15.2                 |

## 失败记录与修复

- 初始真实测试4项失败，首项明确为缺少 T003 骨架；没有用空成功入口通过测试。
- Node spawnSync 在沙箱中报 EPERM，范围回归也受同一限制；获准在沙箱外运行，安装仍限定测试目录。网络 DNS 受限时经授权取得官方材料，不关闭 TLS。
- MCP 回归首次离线运行缺 pytest 缓存；随后在临时 uv 环境获取依赖，7项通过。
- 独立审查指出 existsSync 无法识别失效链接；新增用例先出现 Missing expected exception，改为 lstat 与目录链检查后通过。只读骨架拒绝链接路径，后续安装仍须在写入前再次检查，不承诺解决进程间竞态。
- 审查另指出环境分支记录输出过早。按“逐分支保留证据”的任务要求作为必须修复项处理，改为全测试结束时输出并加入 branch 标识；最终报告包含全部12分支。
- npm prefix 离线补验未找到推断出的 add-skill 命令；随后以干净临时缓存运行 `npx --yes skills@1.7.4 add <真实 task-explore 源目录> --list` 与追加 `--skill task-explore --agent codex --copy --yes` 的安装命令，均退出0；列出无写入，安装仅含 task-explore 且正文与源一致。不将该准备方式失败计为产品通过。

## 限制与续接

本轮只验证 Linux、官方 copy 模式和本地目录来源，未验证 Windows/macOS、真实公开 URL、agent 实际技能调用或 Spec Kit 挂载。后续下载/事务/来源归属属于 T004 以后，挂载属于 T006 以后。用户本轮收窄的是 T003 的验收平台，不据此宣称原完整分发三平台矩阵完成。

继续从 T004（跨平台下载与逐项提交）的现行做法读取；若要将后续任务也限定 Linux，须同步其范围后实施，不能把本次 T003 平台决定默默扩散到全功能。

## 2026-11-04 原样交付修正与复验（测试归位前的历史记录）

用户要求 script 直接复制到 dist，构建不调用脚本；并确认 skills 方式手动执行后续脚本，curl 方式自动准备依赖并串联流程。已移除 scripts 插件内部的 Vite 打包；目录读取与投影从 build/distribution 移回 script/distribution-runtime；script/package.json 显式声明 yaml 2.8.3 和 Node ≥22.20.0。测试将原始脚本复制到独立目录，显式复制固定 YAML 依赖后直接执行；本包运行模块不再编译。第三方 agent 配置源码的测试探针仍独立编译，不属于产品构建。

先添加缺失运行依赖的脚本夹具，旧构建因无法解析该 import 失败；取消打包后构建成功且 mjs/ts/json 字节不变。独立运行模块测试首次因运行目录缺 catalog 失败，迁移并修正直接引用后通过。Node 22 首次使用新版 --test-isolation 参数被拒绝，改用该版本的 --experimental-test-isolation 后得到有效红灯，不把参数错误当作缺陷复现。

| 本次验证                                                                                                                                                                                         | 实际结果                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                      | 通过                                                                                                                                  |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                               | 通过，直接覆盖 runtime TS 与可擦除类型                                                                                                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                     | 通过，script 字节复制，无运行脚本编译                                                                                                 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                      | 13 tests 通过                                                                                                                         |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs packages/skills/tests/distribution/test-build-config.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` | 16 项中 15 pass、1 PowerShell skip                                                                                                    |
| 同上范围命令追加 `scripts/dev/actions/register-hooks/test-register-hooks.mjs`                                                                                                                    | hooks Bash 35 passed、0 failed；PowerShell 缺运行时。此独立脚本提前结束进程，因此不以合并运行证明其余测试通过，其余范围另按上一行重跑 |
| 上文 MCP registry pytest 命令追加 `--offline`                                                                                                                                                    | 7 passed                                                                                                                              |
| 上文 Node 22.20.0 的 MVU-A 命令                                                                                                                                                                  | 9/9 通过，174 条观测；原始日志 /tmp/foundry-t003-copy-only.log                                                                        |

范围测试与 MVU-A 初次受沙箱 spawnSync EPERM 限制，按授权在沙箱外重跑，安装仍只写隔离临时目录。只读审查未发现代码阻断项；发现 plan/T030 残留“打包依赖”的现行描述，已同步为运行阶段准备依赖。历史 T002 打包结果仍保留为当时证据。

这里只验证依赖已经准备好后的独立执行。curl 自动下载依赖、手动公共入口的依赖准备与完整安装挂载仍属于 T004/T005/T019/T027，未实施、未计通过。Windows/macOS、真实公开来源与模式使用仍未验证。

## 2026-11-04 测试代码归位

实际调用核对确认三个 TS 模块只由 mvu-a.mjs 使用，现移到 tests/distribution/helpers，实验使用包已声明的开发依赖直接加载；register-commands 的测试入口移到 tests/test-register-commands.mjs，默认路径与隔离产物测试调用同步更新。tsconfig 继续覆盖这些测试辅助类型。script 保留具有 hooks 实际调用的 yaml-config.mjs、依赖声明和五指令运行脚本。此前将实验模块放入业务目录的做法已撤回；后续正式实现按实际调用需求提取复用，不预先交付测试骨架。

本次迁移后复验：包 lint、check-types、build 均通过，Python 13 项、MCP registry 7 项通过；`node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` 得到 9 pass、2 PowerShell skip、0 fail。原始目录调用与脱离源码的产物调用均覆盖。首次合并运行暴露 argv[2] 被误当目录（实际为另一测试文件），已通过临时参数探针确认并修正：测试运行器使用默认目录，仅直接运行入口时接受显式产物目录。探针顺带运行构建测试时仍受沙箱 EPERM 限制，不计通过；最终范围测试在获准的沙箱外临时目录通过。

迁移后的 Node 22.20.0 MVU-A 完整复验 9/9 通过，174 条观测，日志 /tmp/foundry-t003-test-helpers.log。当前 T003 证明实验结论，不证明正式安装实现已经交付。所有测试模块都在 tests 内，dist/script 仅含实际运行脚本、README 和依赖声明。

## 逐项安装路径证据

以下为测试代码归位后最新一次复验的临时路径，均已清理。default 表示默认环境，其他 branch 为明确变量或旧目录分支；退出0仍须结合结果判断。完整观测来源为 /tmp/foundry-t003-test-helpers.log，以下保存全部174项。

| agent           | scope   | branch            | 实际路径                                                            | 结果             | 退出码 |
| --------------- | ------- | ----------------- | ------------------------------------------------------------------- | ---------------- | ------ |
| codex           | project | default           | /tmp/foundry-distribution-gWymX1/project/.agents/skills             | 正文附件零差异   | 0      |
| codex           | project | default           | /tmp/foundry-distribution-VgrBh4/project/.agents/skills             | 正文附件零差异   | 0      |
| codex           | project | default           | /tmp/foundry-distribution-0MTCG5/project/.agents/skills             | 正文附件零差异   | 0      |
| codex           | project | default           | /tmp/foundry-distribution-Ofb5NP/project/.agents/skills             | 正文附件零差异   | 0      |
| aider-desk      | project | default           | /tmp/foundry-distribution-4fApt0/project/.aider-desk/skills         | 正文附件零差异   | 0      |
| aider-desk      | global  | default           | /tmp/foundry-distribution-tMWIeP/user/.aider-desk/skills            | 正文附件零差异   | 0      |
| amp             | project | default           | /tmp/foundry-distribution-O3FIvW/project/.agents/skills             | 正文附件零差异   | 0      |
| amp             | global  | default           | /tmp/foundry-distribution-KUMzGm/user/.agents/skills                | 正文附件零差异   | 0      |
| antigravity     | project | default           | /tmp/foundry-distribution-1UnZTx/project/.agents/skills             | 正文附件零差异   | 0      |
| antigravity     | global  | default           | /tmp/foundry-distribution-WJLGmz/user/.agents/skills                | 正文附件零差异   | 0      |
| antigravity-cli | project | default           | /tmp/foundry-distribution-HqjhmM/project/.agents/skills             | 正文附件零差异   | 0      |
| antigravity-cli | global  | default           | /tmp/foundry-distribution-CjUQ5P/user/.agents/skills                | 正文附件零差异   | 0      |
| astrbot         | project | default           | /tmp/foundry-distribution-3Nw5V9/project/data/skills                | 正文附件零差异   | 0      |
| astrbot         | global  | default           | /tmp/foundry-distribution-zH1nUM/user/.astrbot/data/skills          | 正文附件零差异   | 0      |
| autohand-code   | project | default           | /tmp/foundry-distribution-TAxLtX/project/.autohand/skills           | 正文附件零差异   | 0      |
| autohand-code   | global  | default           | /tmp/foundry-distribution-uoAgLx/user/.autohand/skills              | 正文附件零差异   | 0      |
| augment         | project | default           | /tmp/foundry-distribution-Niz41O/project/.augment/skills            | 正文附件零差异   | 0      |
| augment         | global  | default           | /tmp/foundry-distribution-yADQEK/user/.augment/skills               | 正文附件零差异   | 0      |
| bob             | project | default           | /tmp/foundry-distribution-V4f55i/project/.bob/skills                | 正文附件零差异   | 0      |
| bob             | global  | default           | /tmp/foundry-distribution-c9ASOs/user/.bob/skills                   | 正文附件零差异   | 0      |
| claude-code     | project | default           | /tmp/foundry-distribution-85xaiK/project/.claude/skills             | 正文附件零差异   | 0      |
| claude-code     | global  | default           | /tmp/foundry-distribution-SxFLRF/user/.claude/skills                | 正文附件零差异   | 0      |
| openclaw        | project | default           | /tmp/foundry-distribution-beV83j/project/skills                     | 正文附件零差异   | 0      |
| openclaw        | global  | default           | /tmp/foundry-distribution-XrGHCo/user/.openclaw/skills              | 正文附件零差异   | 0      |
| cline           | project | default           | /tmp/foundry-distribution-WyGrjd/project/.agents/skills             | 正文附件零差异   | 0      |
| cline           | global  | default           | /tmp/foundry-distribution-s39sxU/user/.agents/skills                | 正文附件零差异   | 0      |
| codearts-agent  | project | default           | /tmp/foundry-distribution-lWxOne/project/.codeartsdoer/skills       | 正文附件零差异   | 0      |
| codearts-agent  | global  | default           | /tmp/foundry-distribution-1kwRDs/user/.codeartsdoer/skills          | 正文附件零差异   | 0      |
| codebuddy       | project | default           | /tmp/foundry-distribution-tgkB5W/project/.codebuddy/skills          | 正文附件零差异   | 0      |
| codebuddy       | global  | default           | /tmp/foundry-distribution-LIcCN7/user/.codebuddy/skills             | 正文附件零差异   | 0      |
| codemaker       | project | default           | /tmp/foundry-distribution-As9cjL/project/.codemaker/skills          | 正文附件零差异   | 0      |
| codemaker       | global  | default           | /tmp/foundry-distribution-yhCkWc/user/.codemaker/skills             | 正文附件零差异   | 0      |
| codestudio      | project | default           | /tmp/foundry-distribution-s3aqCS/project/.codestudio/skills         | 正文附件零差异   | 0      |
| codestudio      | global  | default           | /tmp/foundry-distribution-nFCBY9/user/.codestudio/skills            | 正文附件零差异   | 0      |
| codex           | project | default           | /tmp/foundry-distribution-GKnBuv/project/.agents/skills             | 正文附件零差异   | 0      |
| codex           | global  | default           | /tmp/foundry-distribution-4AWOIt/user/.agents/skills                | 正文附件零差异   | 0      |
| command-code    | project | default           | /tmp/foundry-distribution-QAjZvW/project/.commandcode/skills        | 正文附件零差异   | 0      |
| command-code    | global  | default           | /tmp/foundry-distribution-A2MOq0/user/.commandcode/skills           | 正文附件零差异   | 0      |
| continue        | project | default           | /tmp/foundry-distribution-bvmnju/project/.continue/skills           | 正文附件零差异   | 0      |
| continue        | global  | default           | /tmp/foundry-distribution-OBRUtA/user/.continue/skills              | 正文附件零差异   | 0      |
| cortex          | project | default           | /tmp/foundry-distribution-4hPoc3/project/.cortex/skills             | 正文附件零差异   | 0      |
| cortex          | global  | default           | /tmp/foundry-distribution-Novhxx/user/.snowflake/cortex/skills      | 正文附件零差异   | 0      |
| crush           | project | default           | /tmp/foundry-distribution-oIhYOk/project/.crush/skills              | 正文附件零差异   | 0      |
| crush           | global  | default           | /tmp/foundry-distribution-eaZpnF/user/.config/crush/skills          | 正文附件零差异   | 0      |
| cursor          | project | default           | /tmp/foundry-distribution-AyUbF8/project/.agents/skills             | 正文附件零差异   | 0      |
| cursor          | global  | default           | /tmp/foundry-distribution-u9PCLX/user/.agents/skills                | 正文附件零差异   | 0      |
| deepagents      | project | default           | /tmp/foundry-distribution-e8ki70/project/.agents/skills             | 正文附件零差异   | 0      |
| deepagents      | global  | default           | /tmp/foundry-distribution-jSl0OC/user/.agents/skills                | 正文附件零差异   | 0      |
| devin           | project | default           | /tmp/foundry-distribution-fPBxZc/project/.devin/skills              | 正文附件零差异   | 0      |
| devin           | global  | default           | /tmp/foundry-distribution-9CUcaE/user/.config/devin/skills          | 正文附件零差异   | 0      |
| dexto           | project | default           | /tmp/foundry-distribution-dAWf2l/project/.agents/skills             | 正文附件零差异   | 0      |
| dexto           | global  | default           | /tmp/foundry-distribution-t6EElF/user/.agents/skills                | 正文附件零差异   | 0      |
| droid           | project | default           | /tmp/foundry-distribution-Pq0e7B/project/.agents/skills             | 正文附件零差异   | 0      |
| droid           | global  | default           | /tmp/foundry-distribution-WAT5HI/user/.agents/skills                | 正文附件零差异   | 0      |
| eve             | project | default           | /tmp/foundry-distribution-vh9cVl/project/agent/skills               | 正文附件零差异   | 0      |
| eve             | global  | default           | 无                                                                  | 拒绝且无安装文件 | 0      |
| firebender      | project | default           | /tmp/foundry-distribution-RhSbyB/project/.agents/skills             | 正文附件零差异   | 0      |
| firebender      | global  | default           | /tmp/foundry-distribution-jKmp70/user/.agents/skills                | 正文附件零差异   | 0      |
| forgecode       | project | default           | /tmp/foundry-distribution-HSofN7/project/.forge/skills              | 正文附件零差异   | 0      |
| forgecode       | global  | default           | /tmp/foundry-distribution-Bn1jUc/user/.forge/skills                 | 正文附件零差异   | 0      |
| fx              | project | default           | /tmp/foundry-distribution-WlcKAX/project/.agents/skills             | 正文附件零差异   | 0      |
| fx              | global  | default           | /tmp/foundry-distribution-ovhLCr/user/.agents/skills                | 正文附件零差异   | 0      |
| gemini-cli      | project | default           | /tmp/foundry-distribution-DIKOkG/project/.agents/skills             | 正文附件零差异   | 0      |
| gemini-cli      | global  | default           | /tmp/foundry-distribution-IIpuNq/user/.agents/skills                | 正文附件零差异   | 0      |
| github-copilot  | project | default           | /tmp/foundry-distribution-YCJ3NB/project/.agents/skills             | 正文附件零差异   | 0      |
| github-copilot  | global  | default           | /tmp/foundry-distribution-59b0bd/user/.agents/skills                | 正文附件零差异   | 0      |
| goose           | project | default           | /tmp/foundry-distribution-PRj3dI/project/.goose/skills              | 正文附件零差异   | 0      |
| goose           | global  | default           | /tmp/foundry-distribution-cYgf74/user/.config/goose/skills          | 正文附件零差异   | 0      |
| grok            | project | default           | /tmp/foundry-distribution-iQl2iE/project/.grok/skills               | 正文附件零差异   | 0      |
| grok            | global  | default           | /tmp/foundry-distribution-JREIMD/user/.grok/skills                  | 正文附件零差异   | 0      |
| hermes-agent    | project | default           | /tmp/foundry-distribution-NU0J8N/project/.hermes/skills             | 正文附件零差异   | 0      |
| hermes-agent    | global  | default           | /tmp/foundry-distribution-XnIBub/user/.hermes/skills                | 正文附件零差异   | 0      |
| inference-sh    | project | default           | /tmp/foundry-distribution-bKaIRV/project/.inferencesh/skills        | 正文附件零差异   | 0      |
| inference-sh    | global  | default           | /tmp/foundry-distribution-c2TGBn/user/.inferencesh/skills           | 正文附件零差异   | 0      |
| jazz            | project | default           | /tmp/foundry-distribution-HQPM8N/project/.jazz/skills               | 正文附件零差异   | 0      |
| jazz            | global  | default           | /tmp/foundry-distribution-QltIKo/user/.jazz/skills                  | 正文附件零差异   | 0      |
| junie           | project | default           | /tmp/foundry-distribution-pnu2AP/project/.junie/skills              | 正文附件零差异   | 0      |
| junie           | global  | default           | /tmp/foundry-distribution-bvGu7q/user/.junie/skills                 | 正文附件零差异   | 0      |
| iflow-cli       | project | default           | /tmp/foundry-distribution-EOF5pX/project/.iflow/skills              | 正文附件零差异   | 0      |
| iflow-cli       | global  | default           | /tmp/foundry-distribution-K9yk8K/user/.iflow/skills                 | 正文附件零差异   | 0      |
| kilo            | project | default           | /tmp/foundry-distribution-Bj8c6s/project/.agents/skills             | 正文附件零差异   | 0      |
| kilo            | global  | default           | /tmp/foundry-distribution-aLiJ4B/user/.agents/skills                | 正文附件零差异   | 0      |
| kimchi          | project | default           | /tmp/foundry-distribution-imlfMc/project/.kimchi/skills             | 正文附件零差异   | 0      |
| kimchi          | global  | default           | /tmp/foundry-distribution-1vQAKM/user/.config/kimchi/harness/skills | 正文附件零差异   | 0      |
| kimi-code-cli   | project | default           | /tmp/foundry-distribution-yJJnKN/project/.agents/skills             | 正文附件零差异   | 0      |
| kimi-code-cli   | global  | default           | /tmp/foundry-distribution-AIsvLX/user/.agents/skills                | 正文附件零差异   | 0      |
| kiro-cli        | project | default           | /tmp/foundry-distribution-Ekur5n/project/.kiro/skills               | 正文附件零差异   | 0      |
| kiro-cli        | global  | default           | /tmp/foundry-distribution-9pwYHb/user/.kiro/skills                  | 正文附件零差异   | 0      |
| kode            | project | default           | /tmp/foundry-distribution-R742ds/project/.kode/skills               | 正文附件零差异   | 0      |
| kode            | global  | default           | /tmp/foundry-distribution-C54fOJ/user/.kode/skills                  | 正文附件零差异   | 0      |
| lingma          | project | default           | /tmp/foundry-distribution-kGd26L/project/.lingma/skills             | 正文附件零差异   | 0      |
| lingma          | global  | default           | /tmp/foundry-distribution-f0Y7ja/user/.lingma/skills                | 正文附件零差异   | 0      |
| loaf            | project | default           | /tmp/foundry-distribution-MxTacI/project/.agents/skills             | 正文附件零差异   | 0      |
| loaf            | global  | default           | /tmp/foundry-distribution-yimhwa/user/.agents/skills                | 正文附件零差异   | 0      |
| mcpjam          | project | default           | /tmp/foundry-distribution-nMfMFu/project/.mcpjam/skills             | 正文附件零差异   | 0      |
| mcpjam          | global  | default           | /tmp/foundry-distribution-qKzJZB/user/.mcpjam/skills                | 正文附件零差异   | 0      |
| minimax-code    | project | default           | /tmp/foundry-distribution-R84AiP/project/.minimax/skills            | 正文附件零差异   | 0      |
| minimax-code    | global  | default           | /tmp/foundry-distribution-uAcioP/user/.minimax/skills               | 正文附件零差异   | 0      |
| mistral-vibe    | project | default           | /tmp/foundry-distribution-WG2zdg/project/.vibe/skills               | 正文附件零差异   | 0      |
| mistral-vibe    | global  | default           | /tmp/foundry-distribution-9GyWFb/user/.vibe/skills                  | 正文附件零差异   | 0      |
| moxby           | project | default           | /tmp/foundry-distribution-VCWPd5/project/.moxby/skills              | 正文附件零差异   | 0      |
| moxby           | global  | default           | /tmp/foundry-distribution-rr63DC/user/.moxby/skills                 | 正文附件零差异   | 0      |
| mux             | project | default           | /tmp/foundry-distribution-Ivqudg/project/.mux/skills                | 正文附件零差异   | 0      |
| mux             | global  | default           | /tmp/foundry-distribution-W5DWFS/user/.mux/skills                   | 正文附件零差异   | 0      |
| opencode        | project | default           | /tmp/foundry-distribution-omfacx/project/.agents/skills             | 正文附件零差异   | 0      |
| opencode        | global  | default           | /tmp/foundry-distribution-2yEckW/user/.agents/skills                | 正文附件零差异   | 0      |
| openhands       | project | default           | /tmp/foundry-distribution-V6CCmY/project/.openhands/skills          | 正文附件零差异   | 0      |
| openhands       | global  | default           | /tmp/foundry-distribution-WZ60Jw/user/.openhands/skills             | 正文附件零差异   | 0      |
| ona             | project | default           | /tmp/foundry-distribution-1A1vMt/project/.ona/skills                | 正文附件零差异   | 0      |
| ona             | global  | default           | /tmp/foundry-distribution-nkbIcS/user/.ona/skills                   | 正文附件零差异   | 0      |
| pi              | project | default           | /tmp/foundry-distribution-E0dRYm/project/.agents/skills             | 正文附件零差异   | 0      |
| pi              | global  | default           | /tmp/foundry-distribution-0N57Ro/user/.agents/skills                | 正文附件零差异   | 0      |
| posit-assistant | project | default           | /tmp/foundry-distribution-M4vvgl/project/.posit/assistant/skills    | 正文附件零差异   | 0      |
| posit-assistant | global  | default           | /tmp/foundry-distribution-2YGtG3/user/.posit/assistant/skills       | 正文附件零差异   | 0      |
| qoder           | project | default           | /tmp/foundry-distribution-OBB7Tt/project/.qoder/skills              | 正文附件零差异   | 0      |
| qoder           | global  | default           | /tmp/foundry-distribution-fJCmyb/user/.qoder/skills                 | 正文附件零差异   | 0      |
| qoder-cn        | project | default           | /tmp/foundry-distribution-PO1O18/project/.qoder/skills              | 正文附件零差异   | 0      |
| qoder-cn        | global  | default           | /tmp/foundry-distribution-JAmrad/user/.qoder-cn/skills              | 正文附件零差异   | 0      |
| qwen-code       | project | default           | /tmp/foundry-distribution-EeBlLa/project/.qwen/skills               | 正文附件零差异   | 0      |
| qwen-code       | global  | default           | /tmp/foundry-distribution-RBxrKr/user/.qwen/skills                  | 正文附件零差异   | 0      |
| replit          | project | default           | /tmp/foundry-distribution-JJnZav/project/.agents/skills             | 正文附件零差异   | 0      |
| replit          | global  | default           | /tmp/foundry-distribution-Qz4XdY/user/.agents/skills                | 正文附件零差异   | 0      |
| reasonix        | project | default           | /tmp/foundry-distribution-GPmO3I/project/.reasonix/skills           | 正文附件零差异   | 0      |
| reasonix        | global  | default           | /tmp/foundry-distribution-1abBV8/user/.reasonix/skills              | 正文附件零差异   | 0      |
| rovodev         | project | default           | /tmp/foundry-distribution-5lFrw7/project/.rovodev/skills            | 正文附件零差异   | 0      |
| rovodev         | global  | default           | /tmp/foundry-distribution-Qo8jfk/user/.rovodev/skills               | 正文附件零差异   | 0      |
| roo             | project | default           | /tmp/foundry-distribution-butkM6/project/.roo/skills                | 正文附件零差异   | 0      |
| roo             | global  | default           | /tmp/foundry-distribution-zxVe93/user/.roo/skills                   | 正文附件零差异   | 0      |
| sarvam-code     | project | default           | /tmp/foundry-distribution-OuXAxa/project/.agents/skills             | 正文附件零差异   | 0      |
| sarvam-code     | global  | default           | /tmp/foundry-distribution-mhq3b4/user/.agents/skills                | 正文附件零差异   | 0      |
| tabnine-cli     | project | default           | /tmp/foundry-distribution-nsAOov/project/.tabnine/agent/skills      | 正文附件零差异   | 0      |
| tabnine-cli     | global  | default           | /tmp/foundry-distribution-c9IN9i/user/.tabnine/agent/skills         | 正文附件零差异   | 0      |
| terramind       | project | default           | /tmp/foundry-distribution-ImjToi/project/.terramind/skills          | 正文附件零差异   | 0      |
| terramind       | global  | default           | /tmp/foundry-distribution-ZE9O9Z/user/.terramind/skills             | 正文附件零差异   | 0      |
| tinycloud       | project | default           | /tmp/foundry-distribution-HhjJzW/project/.tinycloud/skills          | 正文附件零差异   | 0      |
| tinycloud       | global  | default           | /tmp/foundry-distribution-tPRsV6/user/.tinycloud/skills             | 正文附件零差异   | 0      |
| trae            | project | default           | /tmp/foundry-distribution-RDigem/project/.trae/skills               | 正文附件零差异   | 0      |
| trae            | global  | default           | /tmp/foundry-distribution-LaGDX2/user/.trae/skills                  | 正文附件零差异   | 0      |
| trae-cn         | project | default           | /tmp/foundry-distribution-cNEUli/project/.trae/skills               | 正文附件零差异   | 0      |
| trae-cn         | global  | default           | /tmp/foundry-distribution-JrQMya/user/.trae-cn/skills               | 正文附件零差异   | 0      |
| warp            | project | default           | /tmp/foundry-distribution-r890w3/project/.agents/skills             | 正文附件零差异   | 0      |
| warp            | global  | default           | /tmp/foundry-distribution-QKGVNF/user/.agents/skills                | 正文附件零差异   | 0      |
| windsurf        | project | default           | /tmp/foundry-distribution-cLQVZz/project/.windsurf/skills           | 正文附件零差异   | 0      |
| windsurf        | global  | default           | /tmp/foundry-distribution-WIeJdh/user/.codeium/windsurf/skills      | 正文附件零差异   | 0      |
| zed             | project | default           | /tmp/foundry-distribution-9dUoEm/project/.agents/skills             | 正文附件零差异   | 0      |
| zed             | global  | default           | /tmp/foundry-distribution-0Rc97l/user/.agents/skills                | 正文附件零差异   | 0      |
| zcode           | project | default           | /tmp/foundry-distribution-Hq3Tjy/project/.zcode/skills              | 正文附件零差异   | 0      |
| zcode           | global  | default           | /tmp/foundry-distribution-7pZYSq/user/.zcode/skills                 | 正文附件零差异   | 0      |
| zencoder        | project | default           | /tmp/foundry-distribution-e6cvg6/project/.zencoder/skills           | 正文附件零差异   | 0      |
| zencoder        | global  | default           | /tmp/foundry-distribution-omkhUA/user/.zencoder/skills              | 正文附件零差异   | 0      |
| zenflow         | project | default           | /tmp/foundry-distribution-dBt9sh/project/.zencoder/skills           | 正文附件零差异   | 0      |
| zenflow         | global  | default           | /tmp/foundry-distribution-MOUig7/user/.zencoder/skills              | 正文附件零差异   | 0      |
| neovate         | project | default           | /tmp/foundry-distribution-7DpWBH/project/.neovate/skills            | 正文附件零差异   | 0      |
| neovate         | global  | default           | /tmp/foundry-distribution-CJblhH/user/.neovate/skills               | 正文附件零差异   | 0      |
| pochi           | project | default           | /tmp/foundry-distribution-Ps8GUD/project/.pochi/skills              | 正文附件零差异   | 0      |
| pochi           | global  | default           | /tmp/foundry-distribution-0amLzb/user/.pochi/skills                 | 正文附件零差异   | 0      |
| promptscript    | project | default           | /tmp/foundry-distribution-AYVGy2/project/.agents/skills             | 正文附件零差异   | 0      |
| promptscript    | global  | default           | 无                                                                  | 拒绝且无安装文件 | 0      |
| adal            | project | default           | /tmp/foundry-distribution-ARAuPD/project/.adal/skills               | 正文附件零差异   | 0      |
| adal            | global  | default           | /tmp/foundry-distribution-LlAndR/user/.adal/skills                  | 正文附件零差异   | 0      |
| universal       | project | default           | /tmp/foundry-distribution-Uo6OGw/project/.agents/skills             | 正文附件零差异   | 0      |
| universal       | global  | default           | /tmp/foundry-distribution-14p2mr/user/.agents/skills                | 正文附件零差异   | 0      |
| claude-code     | global  | CLAUDE_CONFIG_DIR | /tmp/foundry-distribution-WmipJF/user/override/skills               | 正文附件零差异   | 0      |
| mistral-vibe    | global  | VIBE_HOME         | /tmp/foundry-distribution-wU3QgT/user/override/skills               | 正文附件零差异   | 0      |
| hermes-agent    | global  | HERMES_HOME       | /tmp/foundry-distribution-xjfmsU/user/override/skills               | 正文附件零差异   | 0      |
| autohand-code   | global  | AUTOHAND_HOME     | /tmp/foundry-distribution-JMKifE/user/override/skills               | 正文附件零差异   | 0      |
| grok            | global  | GROK_HOME         | /tmp/foundry-distribution-DPuqET/user/override/skills               | 正文附件零差异   | 0      |
| sarvam-code     | global  | SARVAM_HOME       | /tmp/foundry-distribution-lqAPvq/user/.agents/skills                | 正文附件零差异   | 0      |
| codex           | global  | CODEX_HOME        | /tmp/foundry-distribution-e6jrzq/user/.agents/skills                | 正文附件零差异   | 0      |
| opencode        | global  | XDG_CONFIG_HOME   | /tmp/foundry-distribution-tTJYLD/user/.agents/skills                | 正文附件零差异   | 0      |
| amp             | global  | XDG_CONFIG_HOME   | /tmp/foundry-distribution-4zw7KX/user/.agents/skills                | 正文附件零差异   | 0      |
| openclaw        | global  | .openclaw         | /tmp/foundry-distribution-48bpMi/user/.openclaw/skills              | 正文附件零差异   | 0      |
| openclaw        | global  | .clawdbot         | /tmp/foundry-distribution-NePbjq/user/.clawdbot/skills              | 正文附件零差异   | 0      |
| openclaw        | global  | .moltbot          | /tmp/foundry-distribution-HDaxGr/user/.moltbot/skills               | 正文附件零差异   | 0      |

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
