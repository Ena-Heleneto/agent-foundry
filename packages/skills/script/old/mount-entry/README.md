# 安装后的内部核验模块（T005 / MVU-C）

用户最新确认唯一公开入口为 `node script/index.mjs [参数]`；本目录是内部文件核验与挂载编排模块，不提供独立的公开操作。官方 skills 安装只取得所选技能，统一入口接入其安装事实的第二步和安装后自动调用仍由后续任务完善。本目录不随单个技能自动安装，也不依赖 Foundry 源码、pnpm 或目标项目的 node_modules。

当前是 Codex 原始文件投影的最小核验骨架，支持显式技能名和项目级/全局路径。它核对 release.json 的版本、公共双平台脚本摘要，以及本次所选技能的完整文件集合、字节数和 SHA-256。历史技能只有被本次显式选择时才参与核验；不会补选、补装或覆盖技能。

## 内部调用约定

以下是供内部编排和隔离测试使用的参数模板，不是第二个对外入口，不代表已有公开下载地址。调用 cwd 为项目级技能所属项目：

```text
bash <独立工具目录>/script/mount-entry/mount-entry.sh --source-dir <同版发布根绝对路径> --version 0.1.0 --agent codex --installed-root <当前项目绝对路径>/.agents/skills --skill task-explore
pwsh -NoProfile -File <独立工具目录>/script/mount-entry/mount-entry.ps1 --source-dir <同版发布根绝对路径> --version 0.1.0 --agent codex --installed-root <当前项目绝对路径>/.agents/skills --skill task-explore
```

可以用 --source <含完整提交的 HTTPS 根 URL> 替换 --source-dir，两者必须且只能提供一个。公共脚本目录必须同时包含本版 mount-entry.sh 和 mount-entry.ps1，并在 release.json.files 中有对应摘要；本 MVU 的 release.json 由实验生成，正式发布清单尚待后续任务。

--skill 可重复指定，保持选择顺序并去重。--global 使用测试或当前用户的 .agents/skills；若要挂载 workflow，还须明确 --project <绝对项目目录>，不能默用当前目录。项目级 --project 如提供，必须等于当前目录。显式 --no-mount 只做文件核验，不要求全局项目；非 workflow 自然跳过挂载。非 Spec Kit 项目也明确跳过，不自动初始化。

## 阶段结果与当前边界

stdout 输出 JSON，含 resolvedRelease.catalogDigest、skills、verifiedSkills、installation/hooks/commands 阶段、overall 和 retry。catalogDigest 是 release.json 原始字节的 SHA-256，不写回清单自身。

- 全部所选文件通过且挂载关闭或不适用：退出 0。
- 参数、版本、路径、公共材料或挂载前置不足：退出 2。
- 所选技能文件损坏、缺失、额外内容或运行失败：退出 1；保留已完整核验技能的事实，挂载不执行。
- 安装已核验而挂载条件不足时 overall=partial；不能把挂载失败改写成安装失败。

单选 Explore 可以核验安装成功，但五指令要求全部五项被本次显式选中且文件完整；缺项在 commands.missingSkills 列出，不从历史目录补齐。本阶段尚未接通原生 hooks 和 commands：即使五项齐备，也明确返回 unsupported 和 not-run。T006 将在此骨架上调用已有 register-hooks/register-commands，不得把当前结果宣称为挂载成功。

Bash 当前实现 Linux x86_64，使用与 T004 相同的 jq 1.8.1 官方固定摘要；可通过 FOUNDRY_JQ 提供同版普通文件，否则下载到本次工具临时目录，校验后执行。工具准备不会修改项目依赖，失败时不进入安装文件核验。PowerShell 7.4+ 使用原生 JSON 和摘要能力，不需要 jq，也不转发到 Bash、Node 或自有 Python。

## 验证

实验入口位于 packages/skills/tests/distribution/mvu-c.mjs。先在工具专用目录准备官方 skills@1.7.4 npm 包，将 FOUNDRY_SKILLS_PACKAGE 设置为该包目录，再运行：

```bash
pnpm --filter @foundry/skills run test:distribution -- --mvu C
```

FOUNDRY_MVU_C_SHELL=pwsh 可用同一组场景验证 PowerShell；该工具须在 PATH 中。FOUNDRY_MVU_C_SCRIPT_DIR 可指向构建产物的 script 目录，实验仍将其再次复制到 /tmp 独立运行。实际平台、版本、命令和限制见本功能 MVU-C 验收记录；Linux 上执行 PowerShell 不代表 Windows 已验收。
