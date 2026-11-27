# Linux 最小安装入口（T004 / MVU-B）

唯一对外入口为 `node script/index.mjs [参数]`，无子命令；Node 自动选择并启动本目录对应的内部平台模块，保留调用 cwd、参数、输出、退出码和取消信号。下方直接运行平台脚本的模板是内部接口，供集成和隔离测试使用。需要 Node ≥22.20.0；子模块当前已验证能力及限制如下。

本目录是下载与安全提交的最小可运行骨架，当前只实施 Linux x86_64、Codex 项目级、显式技能名选择。直接运行 Bash 平台脚本；PowerShell 的实际安装分支仍明确失败，只读官方预检已实现；Linux 上运行 PowerShell 不代表 Windows 安装支持。正式全 agent、全局安装、分类和全选、公共挂载、隐匿及完整阶段报告由后续任务增量完善。

## 输入与运行

在消费项目目录通过独立复制的 Node 总入口运行，不需要 monorepo、pnpm 或 node_modules。内部平台脚本接收如下参数：

```text
bash <独立脚本目录>/install-skills.sh --source <固定完整提交的HTTPS根URL> --version 0.1.0 --agent codex --skill <技能名称>
bash <独立脚本目录>/install-skills.sh --source-dir <本地同版发布根绝对路径> --version 0.1.0 --agent codex --skill <技能名称>
```

以上为需替换路径、来源和技能名的模板，不是已公开的安装地址。必须提供 version，以及 source/source-dir 中的一种；skill 可重复指定，按请求顺序去重。只支持 Codex 项目级目标 `<cwd>/.agents/skills/<name>`。workflow 技能当前必须显式 --no-mount，避免将尚未接通的挂载报告为成功。coding/frontend 不需要额外传 no-mount。

基础工具包括 Bash、curl、sha256sum、Git 和 Linux 文件工具（含 GNU stat/find/mv）。jq 1.8.1 自动下载到本次独立临时工具目录，并以脚本内固定的官方摘要核验后执行；也可将 FOUNDRY_JQ 指向预先取得的同版官方普通文件，仍会先复制并校验。工具准备失败时目标项目零写入。不修改项目依赖，不写系统工具目录，不交付嵌套 package.json 或自有 Python 核心。官方版本及校验来源见 [jq 1.8.1](https://github.com/jqlang/jq/releases/tag/jq-1.8.1) 与 [官方摘要清单](https://github.com/jqlang/jq/releases/download/jq-1.8.1/sha256sum.txt)。

FOUNDRY_DOWNLOAD_TIMEOUT 可设置下载的正整数秒数，默认 30 秒。来源与重定向均仅允许 HTTPS，保持证书校验并忽略默认 curl 配置；测试源通过本次子进程的 CURL_CA_BUNDLE 信任临时证书，不改变系统 CA。

## 最小材料与安全提交

输入根提供 release.json，包含 schemaVersion=1、version、sourceRevision、files 和 skills。files 的每项为 path、bytes、sha256；技能包含 name、category、directory、sourceFiles 和 requiresSkills。当前 directory 为 skills/分类/名称，sourceFiles 是逐文件完整相对路径数组，requiresSkills 必须为空；本 MVU 不处理依赖选择。清单在目标写入前验证，拒绝未知选择、错误版本、重复文件、遍历路径或非法摘要。正式发布构建及完整模型仍由后续任务交付。

下载先进入技能根同文件系统下的 `.foundry-distribution/staging/`，逐文件核对长度、摘要和完整文件集合后以无覆盖重命名提交技能。收据写在 `.foundry-distribution/receipts/<name>.json`，不改变技能字节。重复请求只有来源、清单摘要、版本、收据与实际文件全集一致时才复用；未知同名目录、用户编辑、额外文件、跟踪文件、链接和版本冲突均拒绝。

根锁排斥同时执行的本包进程；失效锁不自动删除。正常退出和可处理信号清理本进程拥有的暂存与锁。SIGKILL、断电或技能已提交而收据写入失败可能留下无归属现场，重试拒绝接管并保留给用户处理；不承诺跨文件事务回滚或阻止不遵守本包锁协议的恶意进程。

stdout 输出最小 JSON 报告，包含 overall、skills、reasonCode 和 installation 阶段；诊断写 stderr。成功为 0，静态参数或前提错误为 2，运行失败为 1，信号中断使用相应退出码。多技能前项完成而后项失败报告 partial，并保留完整成功项。

## 验证

测试位于 `packages/skills/tests/distribution/mvu-b.mjs`，HTTPS 证书及故障源辅助仅位于 tests，不随本目录交付。在开发仓库通过 `pnpm --filter @foundry/skills run test:distribution -- --mvu B` 执行。需具备本地端口监听和启动子进程权限；测试将运行文件复制到仓库外，并在独立消费目录执行，不能拿当前 Foundry 的技能安装现场代替结果。

受控 HTTPS 故障实验不代表真实公开发布或独立使用者验收；Windows/macOS、PowerShell 和未实际运行的最低版本保持未验证。

## Agent 在线查询与官方预检

安装和 `node script/index.mjs --check --official [其余参数]` 每次在线解析官方 npm 的 skills latest。来源不固定版本或提交，在线来源直接由 read-agents.mjs 提供，不另维护声明文件；同次使用解析出的规则和 CLI 版本，报告 upstream 包含本次 version 与 integrity，后续调用重新获取。查询需要 Node 与 tar；Bash 预检另外需要已准备的 jq，可用 FOUNDRY_JQ 指定，预检中不自动下载。

read-agents.mjs 仅负责读取与验证在线数据，不承担安装、选择、目标写入或挂载逻辑；平台模块继续负责这些流程。当前已发布包没有公开 Agent 查询 API，因此读取实际包内的数据声明及路径函数，布局变化时明确失败。HTTP 响应及包只在内存处理，不写 npm 缓存、锁或暂存，不运行 CLI 入口。断网或完整性错误会停止，不使用旧表回退；本地 source-dir 安装也需要此在线查询。

预检支持 all/category/重复 skill 的单一选择方式及单 Agent，缺依赖明确补选，内容/链接/Git 跟踪冲突不输出安装建议。该次官方建议使用解析版本和显式所选名称，installation 仍为 not-run。自有技能包的 version、source/source-dir 及固定发布提交要求保持原契约。
