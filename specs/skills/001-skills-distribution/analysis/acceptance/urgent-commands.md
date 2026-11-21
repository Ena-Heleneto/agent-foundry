# T085：工作区Increment注册与旧受管保护

实际日期：2026-11-12。输入为[本项方案](../../implementation/T085.md)、[紧急契约](../../contracts/urgent-release.md)及当前工作区packages/skills-distribution-urgent。主线仍用户手写；不修改主线、旧副本、真实用户项目或公开来源。

## 实际问题与修复

初次在新位置运行commands/hooks范围，4项中2通过、2失败：managed-state仅支持prepare/compare/verify且要求probe，Bash仍调用check/record。协调者先实际复现，再把commands接为私有输入/探针分离的prepare、必要时同CLI重建旧input、compare、真实官方add --force、verify。hooks复用同一接口，不存永久目标指纹或第二套registry。

历史合法YAML用JSON.parse会误拒。本项保留本次生成JSON的直接读取，其他格式委托已准备的官方Specify1.2.6 ExtensionManifest完整解析/校验，不自造YAML解析器或交付Python安装核心。实际CLI为uv可搬移shell启动器，首轮仅识别直接Python shebang导致4项未走到迁移；改从显式已安装CLI的同bin定位python并核对实际specify-cli版本，复验通过。工具不具备时写入前失败；默认委托方式限制离线且不能把缺准备冒称成功。

内部verify-removed供T084按本次probe官方登记核对退役id的registry、源和旧正式输出已移除；不在目标保存归属记录或手改registry。T084真实六旧hook清退及未知附件/无登记目录保护另见[hooks证据](urgent-hooks.md)。

## 新位置实际验证

命令：URGENT_SPECIFY_CLI=<source-home>/.cache/uv/archive-v0/om6AD6JxRTroJuBL/bin/specify pnpm --filter @foundry/skills-distribution-urgent exec node --test --test-isolation=none tests/commands.test.mjs。

最终退出0，8/8通过，0失败/skip/todo，约12.8秒。完整日志/tmp/foundry-urgent-command-real.log。上述机器工具路径仅为私有证据，不硬编码进新包。

- 旧三、四、五集合分别由真实官方CLI从合法YAML和已核验来源正文生成；每种连续两次重装，最终仅speckit-modes-increment，三暂停及旧别名不复活，完整已装源技能原字节保留。
- 真实已装旧正式入口被用户修改、旧扩展增加未知附件时，在破坏性调用前拒绝，目标整个树保持。
- 未登记同名正式入口拒绝，不冒认归属，不覆盖用户内容。
- 无关扩展经真实官方登记，其源目录与正式输出在modes迁移后逐字节保持；初次测试误把官方固定speckit前缀省略导致ENOENT，按实际官方Codex布局修正期望后通过，没有修改产品来迁就错误路径。
- 缺三个暂停源不阻断当前入口，明确的故障CLI仍返回17；此项只计调用边界，不冒充真实注册。

已对本项Node辅助器/commands测试执行共享ESLint并通过；新包整体lint与严格check-types已由协调者在源码冻结前复核通过。实际本地源码检查点为47397b714194c4f5312825af0e20ddd88dfad0e6，未推送。

## 下游边界

共享guard稳定、真实注册和迁移保护前置具备，因此允许T084/T086复用；T085的正式入口及源技能在真实宿主仅执行一次的最终观察仍交T087汇合，不因静态薄入口文字或CLI登记结果先记宿主通过。当前不勾T085全部完成，不把本记录当T089全部本地成功或SC-019公开交付通过。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
