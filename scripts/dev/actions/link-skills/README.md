# link-skills

将 `packages/skills/src/` 下的自定义 skill 按名称铺平复制到 Codex 的 `.agents/skills/`。脚本名沿用 `link-skills`，安装产物为实体副本。

## 用法

```bash
# 默认源目录 packages/skills/src，目标目录 .agents/skills
bash scripts/dev/actions/link-skills/link-skills.sh

# 自定义源目录与目标目录
bash scripts/dev/actions/link-skills/link-skills.sh <源目录> <目标目录>
```

纯本地操作，可用于离线安装自定义 skill。第三参数已废弃，传入时仅打印提示，不修改忽略文件。

## 行为

- 自动扫描源目录下的集合，收集一级或集合目录下含 `SKILL.md` 的 skill，按名称铺平复制。
- Bash对已退役的六技能和Review/Guide/Explore/Pair/Tutor/Direct精确名称及旧speckit-modes别名停止复制；不匹配相近名称，不删除已有同名目标或链接目标，实际旧挂载留给迁移任务核对。
- 目标内容相同则跳过，内容变化则替换整个 skill 目录，清除该目录中的旧文件。
- 同名软链接（含断链）替换为实体副本，不修改软链接原先指向的目录。
- 同名普通文件视为冲突，保留原文件并继续处理其他 skill，最终退出码为 `1`。
- 保留源目录未声明的目标条目，例如 speckit 等其他来源的 skill。
- 源目录不存在时退出码为 `1`，安装成功时为 `0`。

集合配置不作为技能复制，当前hooks由专用注册模块读取集合声明；本脚本只复制技能正文及其目录内附件，不产生逐技能配置。

## 测试

```bash
node scripts/dev/actions/link-skills/test-link-skills.mjs
```

在临时仓库中验证分类铺平、默认 Codex 路径、复制内容、幂等跳过、更新清理、软链接替换和冲突处理。新增回归验证退役来源、同名用户目录/文件/链接保护和当前五项来源。PowerShell接入已移出本期，原.ps1仅保留历史；原测试缺pwsh仍记skip，不计当前平台通过。不写入实际仓库的skill目录。
