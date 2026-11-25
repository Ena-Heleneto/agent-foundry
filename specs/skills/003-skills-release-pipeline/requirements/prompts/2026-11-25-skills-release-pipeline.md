# 主线技能构建与 R2 发布的 Spec Kit 提示词

请为 `packages/skills` 的按环境构建、R2 发布、最小测试门禁及现有构建代码的评审与优化编写需求规格。先交付 `release` 测试环境，完成约定验收后再接入生产。以 `temp/b/1.md`、`temp/b/2.md` 和本提示词中的讨论结论为输入，结合当前分支证据核对范围。路径均以仓库根目录为基准。

## 已确认的需求

### 构建代码评审与优化

- 完整阅读 `packages/skills/build/plugins`、`packages/skills/script` 及其构建、安装和测试调用链。评审并优化 `packages/skills/build/plugins`，逐项记录发现的问题、影响的调用方和用于验收的证据。
- 核查 `packages/skills/script` 中旧代码的实际引用，覆盖构建入口、安装脚本、工作流和测试中的直接引用与动态路径。确认无引用后删除对应旧代码。仍有引用的代码记录调用方与用途。
- 从本项目用户手写的代码中提炼编码风格，将规则和可复核的源码示例保存到该功能的 Spec 目录。本功能后续新增和修改的代码按所记录的风格编写。原始要求见 `temp/b/2.md:17`。

### 集合按环境启用

在 `defineCollectionHandle` 的配置对象里增加集合级布尔字段 `enabled`。集合可直接填布尔值，也可从当次构建的 `env.mode` 计算。先检查集合是否启用，再用 `skill` 下各项的 `enabled` 选择技能。技能复制、插件发现、隐匿候选和挂载脚本都消费同一次构建的集合选择结果。

环境包括 `development`、测试发布 `release` 和生产。以下用户示例在开发和测试发布时启用 `profile`，生产判断使用 `prod`。集合在对应环境的选择以其 `enabled` 结果为准。其余集合逐项依据实际配置核对。

```ts
export default defineCollectionHandle({
  enabled: env.mode !== 'prod',
  packageName: 'profile',
  mcp: false,
  skill: {
    'conversation-recording': { enabled: true },
  },
})
```

### R2 布局和发布版本

测试和生产各用一个 R2 桶，沿用共用的 R2 访问凭据配置。两个桶都采用以下布局。旧的按源码 SHA 上传的目录由维护者手动处理。依据见 `specs/skills/002-conversation-to-skill/requirements/raw/2026-11-24-r2-release-layout.md:5`。

```text
install.sh
release.json
release/
  <时间戳>/
    skills.tar.gz
```

构建生成的 `VERSION` 新增时间戳字段。每次发布使用同一个时间戳作为包内发布标识、归档目录名和索引条目的 `version`。`package.json.version` 表示源码包版本。发布版本表由 R2 持久化，本地构建独立于线上版本表。

### 准备版本表与上传

1. 构建和打包完成后，更新版本表的 job 通过 R2 S3 接口读取桶根 `release.json`，在工作区生成更新后的版本表。只有确定该对象不存在时才按首发初始化。新条目含本次 `VERSION` 时间戳和固定归档下载信息，放到有序数组第一条。历史记录保留。补发旧提交同样按本次发布置顶。
2. 构建后的独立发布 job 拿齐归档、安装脚本和更新后的版本表再集中上传。先上传并校验归档，再写入桶根 `install.sh`，最后写入 `release.json`。版本表只登记归档和安装入口均已成功交付的版本。同一目标的发布串行进行，串行范围覆盖版本表的读取和写回，已经开始的发布继续完成。
3. 临时版本管理逻辑放在独立的临时目录。当前只通过版本表首条表达默认版本，故障后的回退逻辑和正式版本工具的接管流程留到后续。

### 安装入口

桶根 `install.sh` 在运行时从对应环境的下载根获取 `release.json`。默认读取首条记录的 URL，下载归档、校验后安装。用实际 HTTPS 下载地址生成面向公网的版本表。现有索引是数组，安装器读取 `version`、`url` 和 `md5`，并支持精确匹配显式指定版本。规划时核对这些消费行为以及包内 `curl/install.sh` 和 `engine/install.sh` 的接口。

### 首版测试与分阶段验收

先在现行 `skills-test` 放行点接入下面三组真实最小用例，按同一提交的实际测试结果放行。验证目标以实际产物和安装结果为准。

| 场景             | 验收结果                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 集合级 `enabled` | 示例集合进入 `development` 和 `release` 的产物，`prod` 跳过整组技能和派生的交付内容。                                                           |
| 安装器读取首条   | 在隔离项目提供两份可区分的归档和有序版本表。默认运行安装器时，实际下载和安装均对应首条。                                                        |
| 连续两次发布     | 在首次缺少索引和随后已有索引两种状态下执行发布。版本表首条分别指向各次成功归档，第二次保留第一次的条目，归档目录与包内 `VERSION` 的时间戳一致。 |

测试环境通过上述门禁及约定的部署验收后，再扩展生产入口。测试桶按实际对象键回读归档、入口和版本表，核对同次运行的归档 SHA-256、入口字节和索引首条。公网 HTTPS 下载根按已确认安排后续补齐，地址具备后再用实际入口验证下载安装。将测试、S3 回读和公网安装分别按实际结果记录。

开发阶段尽量把相互独立的调研、核对和审查交给子代理并行处理，子代理有结论即主动汇报，主代理继续推进手头开发。

## 已核实的仓库事实

- 根 `build` 和 `build:packages` 都可触发 `@foundry/skills` 的 `vite build`。`scripts/dev/mount-speckit.sh` 还通过 Vite 内存构建提取挂载产物。仓库保留调用 `build:packages` 的 Dockerfile，现行发布工作流在 runner 直接构建。根 `build:candidate` 属于紧急版，`skills:link` 直接从紧急版源码挂载。核对 `package.json:16`、`packages/skills/package.json:18`、`scripts/dev/mount-speckit.sh:67` 和 `packages/skills/deploy/Dockerfile:9`。
- 现行 Vite 构建只有精确的 `release` 模式才用 `publish: true` 筛选，并生成 `curl/skills.tsv`、README 和许可证。以 `d75e52b` 提交源码隔离构建，默认、`development` 和 `production` 均输出 11 项技能，含 `eval` 和 `profile`。`release` 输出 coding、frontend、workflow 的 7 项。当前工作区的 `profile` 配置有一处尚未提交的 `enabled: true`，现行扫描读取 `publish` 和技能级 `enabled`。核对 `packages/skills/vite.config.ts:11`、`packages/skills/utils/define-collection-handle.ts:20`、`packages/skills/utils/scan-skills.ts:99`、`packages/skills/src/profile/collection.config.ts:6` 和 `packages/skills/build/plugins/vite-plugin-skill/index.ts:147`。
- 环境选择还影响引擎的集合子插件、隐匿脚本和 Spec Kit 挂载。核对 `packages/skills/build/plugins/vite-plugin-engine/index.ts:16`、`packages/skills/build/plugins/vite-plugin-engine/sub-plugins/vite-plugin-hidden-install/index.ts:45` 和 `packages/skills/src/workflow/plugin/vite-plugin-speckit-mount/index.ts:19`。
- 现行 `VERSION` 只有一行包版本。公共工作流将整文件拼进归档名，按 `SHA/运行 ID-重跑次数` 键上传归档和入口。当前安装源使用示例下载根，读取索引后校验 MD5，按包内 `skill/` 和 `engine/install.sh` 安装。主线 README 提供本地启动示例，公网地址仍需核实。核对 `packages/skills/build/plugins/vite-plugin-version/index.ts:13`、`packages/skills/build/plugins/vite-plugin-curl/install.source.sh:16`、`packages/skills/README.md:5` 及 `.github/workflows/skills-deploy-common.yml:80`。
- 测试发布入口接收 `feature/init` 推送和可复用调用。`skills-test` 固定输出 `passed=true`，公共部署以 `target` 区分 R2 环境但统一用 `--mode release`，同目标新运行可取消在途运行。生产文件目前是草稿。核对 `.github/workflows/skills-deploy-release.yml:3`、`.github/workflows/skills-test.yml:12`、`.github/workflows/skills-deploy-common.yml:16` 和 `.github/workflows/skills-deploy-prod.yml.example`。计划中的生产手动入口见 `specs/skills/001-skills-distribution/spec.md:5`。
- `001-skills-distribution` 记录的旧 `curl/` 桶路径和 SemVer 发布键与新版布局有差异。以已确认的新版根布局为目标，保留旧记录供追溯。紧急版采用独立的固定 Git 来源。MCP 和 `estimate-context` 仍消费旧 `dist/manifest.json`，与 R2 版本表属于不同接口。核对 `specs/skills/001-skills-distribution/contracts/curl-delivery.md:3`、`specs/skills/001-skills-distribution/implementation/repository-migration-files.md:185` 和 `apps/docs/content/mcp/index.md:6`。

### 已检查的测试入口

- `node --test packages/skills/tests/distribution/{vite-plugin-skill,vite-plugin-engine,speckit-mount,hidden-contract}.test.mjs` 通过 64 项。`hidden-contract.test.mjs:316` 已用隔离项目、真实 tar 及 MD5 验证安装器，下载用夹具数据，可复用来测试默认选包。
- 在 `packages/skills` 执行 `python -B -m unittest discover -s tests -p 'test_*.py'` 通过 39 项，命令对应当前包的 `test` 入口。它提供挂载等已有回归证据，首版发布门禁以本提示词确认的三组为准。
- `pipeline-workflow.test.mjs:12` 和 `runner-archive.test.mjs:21` 直接运行时因已移除的 `skill-release.yml`、`publish.yml` 缺失而失败。`test-distribution.mjs:96` 默认包含尚无实现的旧场景入口。复用有效断言时应对准现有 `skills-*` 工作流及时间戳版本协议。新流水线、真实测试桶发布和公开安装待后续执行验收。

## 规划参考

- Vite 的默认构建 mode 是 `production`，传入 `--mode` 后可使用自定义值。复核普通构建、内存构建及 CI 如何把当前环境提供给集合，让示例的 `prod` 在生产入口实际生效。[Vite 模式文档](https://vite.dev/guide/env-and-mode#modes)
- GitHub Actions 可用 workflow artifacts 在 jobs 之间交接同一份归档和入口。并发组的 `queue: max` 支持多个待执行项，队列容量和入队时机以官方约束为准。可据此核对同目标串行、在途继续和按成功发布顺序置顶的要求。[Artifacts 交接](https://docs.github.com/en/actions/tutorials/store-and-share-data) · [Actions 并发排队](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- R2 支持用 `If-None-Match` 条件创建对象、用 `If-Match` 依据当前 ETag 更新索引。可用来防止并发覆盖索引或历史归档。R2 S3 直读与走缓存的公网域名有不同的可见性，验收应分别取证。[R2 条件写入](https://developers.cloudflare.com/r2/api/s3/conditional-operations/) · [R2 一致性](https://developers.cloudflare.com/r2/reference/consistency/)
- Helm 的仓库索引支持合并新旧包记录，适用于本项目的历史版本保留。npm 的 dist-tag 可指向已有版本，可作为未来正式版本工具调研的参考。本期默认版本由 `release.json` 首条决定。[Helm 索引合并](https://helm.sh/docs/v3/topics/chart_repository/#add-new-charts-to-an-existing-repository) · [npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages/#adding-a-dist-tag-to-a-specific-version-of-a-package)

## 待确认和复核事项

- 根据构建代码评审结果确认具体优化范围及验收条件，并确定 `packages/skills/script` 中可删除的代码范围。
- 规划时明确 `VERSION` 字段格式、时间戳粒度，以及同一候选重跑和新发布的区别。对照旧规格的同源双构建比较要求，说明如何比较同一发布输入的产物。依据 `packages/skills/build/plugins/vite-plugin-version/index.ts:13` 和 `specs/skills/001-skills-distribution/spec.md:939`。
- 定出 `env.mode` 的提供方式、缺少 `enabled` 的旧集合如何承接原 `publish` 规则，以及每个集合在 `release` 和 `prod` 的实际条件。旧筛选会跳过未声明 `publish: true` 的 `profile`，迁移后的行为以用户示例为验收输入。重点核对普通 `build`、直接 Vite 调用和挂载入口。
- 核对是否有调用方实际使用旧公开地址或 SemVer 条目，再决定兼容范围。对齐当前 MD5 安装器与此前规格中的 SHA-256、长度和包内版本校验要求。确认实际 HTTPS 下载根、缓存行为，以及公网验证是否列作接入生产的前置。依据 `specs/skills/001-skills-distribution/contracts/curl-delivery.md:66` 和 `specs/skills/002-conversation-to-skill/requirements/raw/2026-11-24-r2-release-layout.md:19`。

## Spec Kit 交接

1. 执行 Spec 需求分析时，先用上述路径核实当前分支。把已确认的需求、受影响的兼容行为和可观测的验收条件写入 `spec.md`。工具用法和实现选择交给规划，未决事项继续标明待确认。
2. 根据宪章在 `specs/skills/` 下扫描包内编号并建立功能目录。目录创建后，将本提示词移到新目录的 `requirements/prompts/`，按日期和主题重命名为 `YYYY-MM-DD-skills-release-pipeline.md`。参见 `.specify/memory/constitution.md:156`。
3. 在生成 `speckit.tasks` 前，用 `spec.md`、`plan.md` 和调研记录复核当前实现、可复用入口和验证方式。发现分支变化或遗漏时，先补对应材料，再按测试环境验收、生产接入的依赖顺序拆分任务。
