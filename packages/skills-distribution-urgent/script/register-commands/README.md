# 四个协作指令的官方安装

本目录是内部平台模块。外部分发唯一对外入口为 `node script/index.mjs [参数]`；所选安装流程调用本模块的编排由后续任务接通。下方直接平台调用用于已有工作区集成和测试，不是新的公开子命令。

每次执行都重新安装全部四个指令：

- `$speckit-modes-tutor`
- `$speckit-modes-pair`
- `$speckit-modes-direct`
- `$speckit-modes-increment`

脚本复制四份技能及附件，准备临时 modes 声明，执行一次 `specify extension add --dev <临时目录> --force`。安装状态、登记、生成入口和覆盖均由官方 CLI 处理；不检查是否已安装或内容是否相同，不维护另一套安装逻辑。CLI 失败返回非零，临时输入自动清理。

## 使用

直接按环境运行 Bash 或 PowerShell 7.4+ 脚本，需要已初始化的 Spec Kit 项目，以及 uvx 或显式指定的 Specify CLI。`--skills-dir` 必须包含 task-tutor、task-pair、task-direct、task-increment 四个目录及各自 SKILL.md。

```bash
bash packages/skills/script/register-commands/register-commands.sh --project /path/to/project --skills-dir /path/to/installed/skills
```

```powershell
pwsh -NoProfile -File packages/skills/script/register-commands/register-commands.ps1 --project C:/project --skills-dir C:/installed/skills
```

可通过 `--cli /path/to/specify` 使用已有官方可执行文件；否则通过 uvx 调用指定版本。平台脚本通过 `FOUNDRY_SPECIFY_VERSION` 选择版本，未设置时使用默认 1.2.6。不另做版本探测或兼容分支。

工作区完整入口在所有技能源与 hooks 刷新成功后调用本脚本一次。四份技能正文仍各自维护，不新增命令模板或包根扩展声明。

## 构建与验证

构建原样复制 Bash/PowerShell 脚本及 README 到 dist/script/register-commands，没有 Node 转发文件。自有脚本不再调用 Python，不依赖源码、node_modules 或 YAML 辅助脚本；官方 Specify 自身的 Python 运行要求仍由官方 CLI/uvx 满足。

```bash
bash dist/script/register-commands/register-commands.sh --project /path/to/project --skills-dir /path/to/installed/skills
node packages/skills/tests/test-register-commands.mjs
python -B -m unittest discover -s packages/skills/tests -p test_register_commands.py
```

脚本测试覆盖四项完整输入、附件、重复重装、来源更新、缺来源和错误传播。历史五模式官方实测归 T048；本轮四模式迁移与 Direct 入口证据归工作流基座 T072 的 analysis/acceptance/managed-migration.md。PowerShell 缺运行时记为未验证。foundry-explore/foundry-guide 的官方 remove 清理是此前已完成事实，不代表本轮重复执行，也不保留在日常脚本中。

## 当前工作区的提前入口交付

Direct 使用验收可在核验四份当前来源和附件、隔离验证官方迁移后，直接调用本内部模块更新 modes。此操作不执行 hooks 阶段，保留既有 hooks；不等于完整初始化、新分析交付或六旧 hooks 已退役。完整初始化仍先刷新来源和所选适用 hooks，再调用本模块。

官方强制重装会处理旧 modes 目录。一次性迁移前必须清点登记涉及的精确目录；发现额外用户附件、用户维护文件或无法确认的内容时，停止受影响调用并说明去留，不承诺官方自动保留。不得直接编辑生成入口或 registry。
