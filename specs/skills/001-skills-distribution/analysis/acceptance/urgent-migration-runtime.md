# 紧急辅线迁仓运行与依赖准备

## 当前结论与边界

本记录对应2026-11-12当前协作安排：主线`packages/skills`由用户手写，AI不构建、修复或接管其中间态；紧急辅线连续推进可以独立完成的迁仓准备。已读取[spec顶部连续推进豁免与双线分工](../../spec.md)、[plan](../../plan.md)、[T090](../../tasks.md)及[迁移交接](urgent-handoff.md)。新仓库尚未创建，用户要求当前仓库工作结束后由协调者提醒建仓，本记录不再次索取目标。

本次仅写本报告及自有临时目录`/tmp/urgent-public-runtime-wygmrwec`。完成依赖清点、最小根配置草案及离线配置等效核验；未安装任何依赖，未写实际新根，未执行发布、目标安装或MCP部署。没有复制node_modules、认证、环境变量文件或原私有.specify。T090仍未通过，临时演练不替代真实迁仓。

原冻结输入保持：sourceRevision为`7e79b524b85fdfb5678acbe54ebfb41ec94bec1f`，version为`0.1.0`，candidateDigest为`498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6`。本次不修改该包源码、dist或README，不将其此前133项实测结果换成新仓库结果。

## 实际依赖闭包

读取紧急包package.json、实际安装目录中的包元数据，以及真实根catalog。按生产source.ts相同的逐层node_modules查找方式递归读取dependencies/optionalDependencies，不执行包代码。观测到410个不同package@version、806条依赖边、必需依赖缺失0、可选依赖缺失61；可选缺失逐条保留，不声称新平台依赖完整。当前共享preset的宽依赖也进入此数，它不是最小草案将来安装的依赖数量。

机器可读清点：`/tmp/urgent-public-runtime-wygmrwec/dependency-inventory.json`。记录直接引用、实际catalog范围、真实解析版本、依赖边、包engines/license/peer声明及缺失项，不复制依赖代码。它是当前Foundry依赖观测，不是新仓库锁或可复用来源摘要。

| 紧急包直接开发依赖     | 声明或catalog范围       | 本次实际解析 |
| ---------------------- | ----------------------- | ------------ |
| @foundry/preset-config | workspace:*             | 1.0.0        |
| @types/node            | catalog:types → ^25.5.0 | 25.9.9       |
| @types/semver          | catalog:types → ^7.8.0  | 7.8.0        |
| eslint                 | catalog:dev → ^10.11.0  | 10.14.0      |
| semver                 | catalog:shared → ^7.7.4 | 7.8.6        |
| typescript             | catalog:dev → 6.0.3     | 6.0.3        |
| vite                   | catalog:build → ^8.0.10 | 8.3.6        |
| yaml                   | catalog:shared → 2.8.3  | 2.8.3        |

当前公共ESLint工厂来自`@antfu/eslint-config@9.5.1`，保持unocss、formatters、pnpm、antislop启用及isInEditor=false。启用功能需要显式提供原依赖上下文可解析的可选peer：`@unocss/eslint-plugin@66.12.0`、`eslint-plugin-format@2.0.1`、`eslint-plugin-slop@0.1.3`、`eslint-plugin-sonarjs@4.2.2`，以及ESLint本身。不能靠原根提升偶然满足，或在新根通过关规则消除依赖。

实际工具版本记录在`/tmp/urgent-public-runtime-wygmrwec/tool-versions.json`：Node24.22.2、pnpm12.16.1、npm11.19.1、Git2.56.0、jq1.8.1、Bash5.3.9、Python3.15.2、uv0.13.6、Codex CLI0.167.2。这里仅执行各自版本读取，未启动模型会话或复制认证。

## 可审阅的新根草案

草案位置：`/tmp/urgent-public-runtime-wygmrwec/draft-root`。它不是实际目标仓库，尚无新Git身份、依赖安装或许可证完成事实。

| 草案文件                                              | 职责及与实际迁仓的关系                                                                                                                                                |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| package.json                                          | private ESM根、Node≥22.20.0、pnpm12约束；仅紧急包build/lint/types/test编排，没有旧postinstall、nuxt:prepare或部署链；ISC字段只是待配真实许可正文的目标声明。          |
| pnpm-workspace.yaml                                   | `packages/*`与`tooling/*`、紧急包已有命名catalog、预设启用peer；保留原直接依赖范围，新增peer用本次实际版本。未搬入全根catalog、overrides或dangerouslyAllowAllBuilds。 |
| .gitignore                                            | 排除依赖、dist、Python环境、缓存和.env；继续不跟踪pnpm-lock.yaml，未改变本仓库锁策略。                                                                                |
| tooling/preset-config/package.json                    | 保留@foundry/preset-config包名及既有两个公共出口匹配规则，只提供eslint-config与tsconfig-json；这是等价局部配套提案，未自动扩大为搬迁整个原preset。                    |
| tooling/preset-config/src/eslint-config/index.js      | 复用原工厂全部选项和消费方append接口；新增声明具有中文多行JSDoc。                                                                                                     |
| tooling/preset-config/src/tsconfig-json/tsconfig.json | 原公共TS基线原字节副本；紧急包自身更严格覆盖仍生效。                                                                                                                  |
| tooling/preset-config/build/copy-presets.mjs          | 仅Node标准库复制上述两个出口到真实dist；脚本位于生产source采集覆盖的build目录。                                                                                       |

草案没有当前机器绝对路径、Foundry工程目录路径、用户配置或旧初始化脚本引用。保留`@foundry/preset-config`命名空间是为了复用当前公开exports协议；将来若决定重命名，应显式改动消费声明并重新验收，不能只替换目录名。没有复制原preset的Nuxt、Uno配置或其他业务预设。

此草案只覆盖紧急包独立复核的根配套，未冒认四处源码完整初始化。主线自身依赖声明目前是该紧急catalog的子集，但其ESLint/TS可执行工具是否由新根显式提供、测试外部文件及用户正在改写的构建实现仍须独立确定，不能用当前草案宣称主线可构建。

## source捕获与目录映射

逐段核对`packages/skills-distribution-urgent/build/distribution/source.ts`：生产captureSource没有写死`packages/preset-config`。它从紧急包的真实Node依赖解析位置找到workspace包，再要求解析后的包目录位于同一个实际Git根内。`tests/helpers/urgent-sandbox.mjs`中的固定`packages/preset-config`是该测试私有fixture布局，不是生产根路径推断。

草案映射为原公共包名`@foundry/preset-config` → 新根`tooling/preset-config`。不需要因为这个目录变化修改source.ts的生产路径逻辑，但只改workspace引用远不足以产生有效候选。T090至少必须真实满足：

1. 新根将tooling/*列为workspace，真实包管理器为紧急包安装该workspace引用；目标仍使用正式公共exports解析，不能改成相对路径穿透或伪造node_modules。
2. 该包的package.json及适用tsconfig/Vite配置、build、src/eslint-config、src/tsconfig-json位于新Git根；两个真实生成目录dist/eslint-config与dist/tsconfig-json必须先构建存在。capture将源码与生成依赖分别留证。
3. 根package.json与pnpm-workspace.yaml为真实提交字节，每条catalog来自同版根；直接依赖、工作区依赖及其依赖必须按真实安装元数据满足声明。不能用旧依赖清单代替安装结果。
4. package/README/LICENSE/构建配置、src/script/build/types及根配置等被capture纳入的文件必须与新根实际HEAD一致；根锁若存在，其当前字节也进入dependencySnapshot。草案没有创建或复制旧锁。
5. 在真实新根安装依赖、构建预设、运行严格lint/typecheck后，冻结实际源码并双构建；重新读取version、sourceRevision、sourcePackagePath、inputDigest、dependencySnapshot与candidate/catalog摘要，再走同版官方两步和真实宿主。旧SHA与候选摘要不代替这些事实。

## 隔离核验与可复跑入口

已实际执行：

```bash
python3 /tmp/urgent-public-runtime-wygmrwec/validate-draft.py --reference-root "$PWD"
```

该脚本不安装依赖。它仅在自有草案内构建两个预设生成目录，并以显式参考根中已准备的库作比较。结果保存于`checks/equivalence.json`和`checks/validation.log`：

- 两个新增JS文件通过node --check；预设两处生成文件与源文件字节一致。
- 通过隔离VM把草案工厂链接到同一现成antfu实现，比较全部可序列化配置字段、插件ID及解析器元信息：57个配置块、572条规则配置项一致，消费方append接口结果一致。没有比较或声称插件函数对象身份相等。
- 用现成TypeScript解析同一紧急包在原公共TS基线和草案TS基线下的配置，选项和源码文件选择一致，strict=true、skipLibCheck=false；没有运行或声称独立新根类型检查。
- 原紧急包的所有catalog名称在草案均存在；草案不含参考工程绝对根路径，根脚本不存在postinstall。

初始检查曾把import-only公开出口交给CJS require.resolve而失败；另一次直接跨VM deepStrictEqual因函数/原型身份失败。之后分别按真实import出口和上述可比较字段核验；未改产品代码或关闭规则。经过与限制保存在`checks/probe-notes.txt`，不把这两次方法失败计作产品安装失败。

尚未执行的命令包括新根pnpm install、紧急包独立lint/check-types/build/test、真实新身份双构建及新来源消费，因为实际新根和安装依赖尚不存在；本次不会创建假成功标记或skip宿主测试来替代。当前参考工程通过不意味着未来相同范围会解析到相同版本。

## 工具、安装路径及独立未验项

紧急产品范围仍为Linux/Codex/项目级。作者侧使用现成Node/pnpm/Vite/TypeScript/ESLint/YAML/SemVer；消费者侧标准库Node脚本与Bash模块不携带这些Node第三方依赖。正常路径仍是官方skills CLI安装，再显式执行同版node script/index.mjs挂载，不能增加公开子命令或自动串联入口。在线读取本次skills latest及SRI，不把此前1.8.1固化成未来latest；Specify仍按已备1.2.6官方CLI执行。

正式新环境需准备Node≥22.20.0、npm/npx、Bash、jq、Git、curl、tar及脚本使用的标准Unix工具；挂载需已备Spec Kit项目环境、正式材料与治理，以及能运行1.2.6的Python/uvx环境，不能自动安装前置或复制原私有治理。真实宿主再准备有效Codex CLI认证，认证留宿主环境，不进入fixture/仓库。release.tools包含历史更广平台字段，不将PowerShell声明扩大为本紧急版已验证支持。

后续继续复用tests/helpers/prepare-host-context.py，显式传入实际候选、现成Specify CLI、工具参数及独占项目；真实执行官方list/安装全部9项、同版正常第二步两次，随后由完整测试运行真实宿主。目标路径、fixed source和身份必须取新仓库实际值；此处未对旧候选重复执行安装或模型会话。

主线的外部脚本与治理测试依赖、MCP默认旧manifest缺口仍按[urgent-handoff](urgent-handoff.md)独立未验：主线test_full_remount.py引用scripts/dev，test_mvu_documents.py引用.specify脚本/模板；这些不在四处迁移清单内，不能删除测试求绿或复制整个私有.specify补链。MCP的FastMCP/Python及uv.lock属于独立依赖体系，默认期待packages/skills/dist/manifest.json内嵌正文结构，紧急release.json不满足该结构；本次未改MCP、未安装其依赖、未部署。

## 许可材料与实际新根剩余输入

依赖声明和第三方实际正文分别核对，不将新仓库ISC字段扩展成依赖已重新许可。特别保留`eslint-plugin-sonarjs@4.2.2`冲突：本地package.json为LGPL-3.0-only，而同包LICENSE首行为SONAR Source-Available License v1.0，标注Last Updated November 13, 2024。本次未分发该包代码，也不作法律适用推论、不切版本或关闭规则。许可辅线继续处理实际通知。

证据位于`checks/sonarjs-license-evidence.json`；原相对目录为`node_modules/.pnpm/eslint-plugin-sonarjs@4.2.2_eslint@10.14.0_jiti@2.7.0_supports-color@10.2.2_/node_modules/eslint-plugin-sonarjs/`。package.json的SHA256为`163c18636b65fc1899f015cef625b524085ea8a2da8751b3faee81fdcf56267e`，LICENSE的SHA256为`b93b383060f0b26e95538455d8a92b0c9bc5bf61c3a1fd42583fc3d535330a03`。不复制依赖代码进迁移草案。

当前仓库可独立完成的本项准备已经形成具体材料。实际迁仓最小输入是用户创建的新仓库及目标根、获准四处源码的最终公开清单、实际ISC正文与第三方通知、新根catalog和预设配套决策、真实工具安装与Git提交身份。协调者在当前仓库工作完成后提醒用户建仓；地址未提供不阻止本项准备，也不允许提前把T090勾为完成。
