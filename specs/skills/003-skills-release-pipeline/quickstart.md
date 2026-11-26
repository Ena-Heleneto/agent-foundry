# 验收指南：主线技能按环境构建与发布

在功能实现后按以下步骤复验，独立保存门禁、S3 回读和公网安装结果。当前规划继承已核对的基线，尚无新功能部署结果。 [范围与现状](spec.md) · [数据模型](data-model.md)

## 1. 本地工具和基线

以待验证的明确提交建立干净工作区。安装仓库锁定依赖及 mise 工具链。安装验收需要 Linux、Bash、curl、Node、npm、tar、jq、uv，真实挂载另需已初始化的隔离 Spec Kit 项目与 Specify。T008 用隔离 Vite 构建检查正式挂载产物及内存构建行为，不调用临时手动挂载脚本。容器验收需可用 Docker。

```bash
git rev-parse HEAD
pnpm install --frozen-lockfile
pnpm --filter @foundry/preset-config run build
pnpm --filter @foundry/skills run check-types
pnpm --filter @foundry/skills run lint
pnpm --filter @foundry/skills run test
node --test packages/skills/tests/distribution/{vite-plugin-skill,vite-plugin-engine,speckit-mount,hidden-contract}.test.mjs
```

预期满足目标包的类型检查和相关回归。验证实际动态加载的挂载子插件也进入类型检查。此前基线为 Node 64 项和 Python 39 项，Node 运行前需具备 jq。旧工作流测试的缺文件结果按现状记录，复用到新入口的断言有独立判定。

## 2. 在同一提交运行三组门禁

实现阶段提供技能包 test:release 命令，CI 与本地验收均调用同一个入口。提交核对后执行如下命令。

```bash
command -v jq
command -v uv
git rev-parse HEAD
pnpm --filter @foundry/skills run test:release
```

| 用例         | 输入和操作                                                                                                                                   | 预期观察                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 按环境选择   | 运行无参数的 `build` 以及显式 `--mode development`、`--mode release`、`--mode production`，加入集合与技能级开关夹具。 | 默认与显式 `production` 选择一致；各 mode 按配置过滤集合，`release` 生成测试发布材料。未知 mode 失败。 |
| 安装器选包   | 生成两份标记不同的真实归档，用隔离 HTTPS 夹具提供倒序版本与根入口。分别默认选首条、显式选另一条，再分别让 SHA-256、长度和包内时间戳不一致。  | 请求的下载地址与实际安装文件都对应选中记录。三类失败各返回失败且无项目写入。默认挂载、--no-mount、--hidden 沿原接口复核。                              |
| 持久化与顺序 | 在独立对象存储边界执行实际版本准备及发布逻辑，首发后补发旧提交，并模拟同目标连续请求、读表错误、条件冲突和中途写入失败。                     | 第一轮从确认缺失开始，第二轮置顶并保留首发。归档目录和 VERSION 同值。失败运行零重试、零未完整条目登记。                                                |

本地隔离门禁无需真实桶凭据。作业证据保留三组结果、被测提交、关键产物和失败阶段。失败、工具缺失和必需测试跳过均阻止放行。队列调度及 R2 对象语义还需实际平台前置验证。 [发布契约](contracts/build-and-publish.md)

### 容器构建与产物导出

这是 T008 的单独产物验收。从仓库根设置本次待验的 SOURCE_REVISION 为实际提交 SHA。Dockerfile 使用该提交的源码作为构建上下文，并按本地默认配置构建。依赖和导出放在隔离目录。

```bash
(
  set -euo pipefail
  : "${SOURCE_REVISION:?需要待验提交 SHA}"
  docker_check_dir="$(mktemp -d)"
  mkdir "$docker_check_dir/source"
  git archive "$SOURCE_REVISION" | tar -xf - -C "$docker_check_dir/source"
  docker buildx build \
    --file "$docker_check_dir/source/packages/skills/deploy/Dockerfile" \
    --target artifacts --output "type=local,dest=$docker_check_dir/artifacts" \
    "$docker_check_dir/source"
  test -f "$docker_check_dir/artifacts/VERSION"
  test -f "$docker_check_dir/artifacts/curl/install.sh"
  test -f "$docker_check_dir/artifacts/engine/install.sh"
  test -f "$docker_check_dir/artifacts/skill/profile/conversation-recording/SKILL.md"
  test ! -d "$docker_check_dir/artifacts/skill/eval"
  tar -tzf "$docker_check_dir/artifacts/skills.tar.gz" |
    grep -Fx -- 'skill/coding/document-changed-symbols/SKILL.md'
  printf '容器构建提交与导出目录：%s %s\n' "$SOURCE_REVISION" "$docker_check_dir/artifacts"
)
```

记录待验 SHA、Docker 构建结果及 artifacts 的实际文件。按 [T008 确认的验收口径](implementation/T008.md)，未指定 Vite `--mode` 的容器构建按默认 `production` 选择，包含当前启用的 `profile`，不含仅开发模式启用的 `eval`，且保有 VERSION、安装入口与引擎入口。容器附带归档应包含已启用集合的技能成员。若缺可用 Docker 或含待验输入的真实提交，记录缺前置；本项不代替 T019 的生产发布验收。

## 3. 比较同源构建与交接候选

用两个干净输出目录和同一已确认的源码 SHA、依赖、构建模式、下载根及固定时间戳。下例中的下载根是隔离测试夹具输入。实现后的构建以这两个变量接收冻结值和下载根。

```bash
export FOUNDRY_SKILLS_RELEASE_TIMESTAMP=20261125T120905123Z
export FOUNDRY_SKILLS_DOWNLOAD_BASE_URL=https://downloads.fixture.invalid
comparison_dir="$(mktemp -d)"
pnpm --filter @foundry/skills run build --mode release --outDir "$comparison_dir/first"
pnpm --filter @foundry/skills run build --mode release --outDir "$comparison_dir/second"
diff -qr "$comparison_dir/first" "$comparison_dir/second"
```

预期两份输出的文件相对路径和原字节一致。CI 实际发布另对冻结归档的 SHA-256 与字节长度核验，复核包内入口和从构建作业交接给发布作业的入口字节一致。归档可记录 tar/gzip 元数据差异，实际上传使用候选制品交接的原字节。

## 4. 从测试桶回读同次对象

获得对 release 测试桶的适用授权后，通过现行测试发布入口运行目标提交。记录触发 SHA、三组门禁、候选 SHA-256、入口制品、发布时间戳及实际对象键。以下命令在已有授权配置的 AWS CLI 环境中只读运行。使用实际 release 桶、R2 S3 endpoint 与发布版本。

```bash
(
  set -euo pipefail
  : "${RELEASE_BUCKET:?需要本次实际测试桶}"
  : "${RELEASE_R2_ENDPOINT:?需要本次实际 R2 S3 地址}"
  : "${RELEASE_VERSION:?需要本次实际发布时间戳}"
  : "${CANDIDATE_ARCHIVE:?需要本次原始归档路径}"
  : "${CANDIDATE_ENTRY:?需要本次安装脚本路径}"
  : "${CANDIDATE_ARCHIVE_URL:?需要本次候选的固定归档地址}"
  readback_dir="$(mktemp -d)"
  aws --endpoint-url "$RELEASE_R2_ENDPOINT" s3api get-object \
    --bucket "$RELEASE_BUCKET" --key "release/$RELEASE_VERSION/skills.tar.gz" "$readback_dir/skills.tar.gz"
  aws --endpoint-url "$RELEASE_R2_ENDPOINT" s3api get-object \
    --bucket "$RELEASE_BUCKET" --key install.sh "$readback_dir/install.sh"
  aws --endpoint-url "$RELEASE_R2_ENDPOINT" s3api get-object \
    --bucket "$RELEASE_BUCKET" --key release.json "$readback_dir/release.json"
  archive_sha256="$(sha256sum "$CANDIDATE_ARCHIVE" | cut -d ' ' -f 1)"
  archive_bytes="$(wc -c < "$CANDIDATE_ARCHIVE")"
  readback_sha256="$(sha256sum "$readback_dir/skills.tar.gz" | cut -d ' ' -f 1)"
  readback_bytes="$(wc -c < "$readback_dir/skills.tar.gz")"
  [[ "$readback_sha256" == "$archive_sha256" ]] || { printf '%s\n' '归档 SHA-256 不匹配' >&2; exit 1; }
  [[ "$readback_bytes" == "$archive_bytes" ]] || { printf '%s\n' '归档字节长度不匹配' >&2; exit 1; }
  cmp "$CANDIDATE_ENTRY" "$readback_dir/install.sh"
  jq -e --arg version "$RELEASE_VERSION" --arg url "$CANDIDATE_ARCHIVE_URL" \
    --arg sha256 "$archive_sha256" --argjson bytes "$archive_bytes" \
    '.[0] | .version == $version and .url == $url and .sha256 == $sha256 and .bytes == $bytes' \
    "$readback_dir/release.json"
)
```

发布窗口内优先使用同次作业保存的回读件。另验收时若已发生后续发布，当前根对象可能属于随后运行，需使用保存的同次证据或另作授权的验收。预期归档实际 SHA-256 和字节数一致，入口原字节一致，首条的 version、url、bytes、sha256 全部对应实际候选和归档键。任一读取或比对失败即结束本次验收并返回失败。第一次明确缺表、第二次含历史及故障结果各按实际过程记录。缺公网域时使用认证 S3 回读证据。

## 5. 公网验证与生产接入

完成三组门禁和测试桶回读后，可依授权接入手动生产入口。每次手动运行对该次所选提交实际执行三组门禁。核对测试、`production` 模式的发布构建和交接候选的 SHA 一致以及生产桶身份。检查候选归档不含 `profile` 技能、插件及适用派生内容，并具备构建契约要求的完整发布材料。分别以门禁失败、跳过、缺结果和候选 SHA 不符进行受控验收，预期均无部署。

测试桶公网下载安装在实际 HTTPS 根和授权具备后独立执行。先核对该次候选入口绑定的真实下载根和实际版本表。历史条目若存认证 S3 地址，备份版本表并按对象键逐项核对归档长度和摘要。取得维护者授权后迁移必要 URL，确认回读只改变下载地址，版本、顺序和固定归档保持一致。记录迁移及缓存核对结果。 [下载根与切换](contracts/build-and-publish.md#下载根与切换)

```bash
(
  set -euo pipefail
  : "${PUBLIC_DOWNLOAD_ROOT:?需要实际公网 HTTPS 下载根}"
  : "${ISOLATED_SPEC_KIT_PROJECT:?需要已准备的隔离项目}"
  : "${CANDIDATE_ENTRY:?需要对应公网发布的原始入口路径}"
  if [[ -n "${HISTORICAL_RELEASE_VERSION:-}" ]]; then
    : "${HISTORICAL_SPEC_KIT_PROJECT:?需要另一个隔离项目}"
    [[ ! "$ISOLATED_SPEC_KIT_PROJECT" -ef "$HISTORICAL_SPEC_KIT_PROJECT" ]] || {
      printf '%s\n' '默认与历史版本验收须使用不同项目' >&2
      exit 1
    }
  fi
  public_check_dir="$(mktemp -d)"
  curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
    "${PUBLIC_DOWNLOAD_ROOT%/}/install.sh" --output "$public_check_dir/install.sh"
  cmp "$CANDIDATE_ENTRY" "$public_check_dir/install.sh"
  (
    cd "$ISOLATED_SPEC_KIT_PROJECT"
    bash "$public_check_dir/install.sh" --no-mount
  )
  if [[ -n "${HISTORICAL_RELEASE_VERSION:-}" ]]; then
    cd "$HISTORICAL_SPEC_KIT_PROJECT"
    bash "$public_check_dir/install.sh" "$HISTORICAL_RELEASE_VERSION" --no-mount
  fi
)
```

入口字节比对失败时，安装器不执行。对照实际索引首条、HTTPS 下载对象、安装摘要和项目文件。发生历史地址迁移时，将 HISTORICAL_RELEASE_VERSION 设为其中一个受影响的版本，在另一个隔离项目显式安装，并将实际地址、校验值和安装结果与迁移后版本表对应。适用挂载和隐匿另核对真实调用及其输出。公网状态不足时记录缺前置，S3 校验结果保留自身判定。
