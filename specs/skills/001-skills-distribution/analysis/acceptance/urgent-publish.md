# T088：工作区内部发布工具及Git故障验证

实际日期：2026-11-12。来源为[原任务](../../tasks.md#t088)、[本项方案](../../implementation/T088.md)、[紧急契约](../../contracts/urgent-release.md)及当前packages/skills-distribution-urgent字节。只覆盖本次自有临时bare Git，不代表真实远端、迁仓、公开来源安装或宿主验收通过；工程checkbox由协调者统一维护。

## 本次范围与根因

复用现有内部publishCandidate和16项发布测试。协调者已在当前工作区真实运行16/16通过，日志/tmp/foundry-urgent-publish-baseline.log；本代理随后独立复现共享ESLint的12项问题，包括未使用正则捕获组、单行多语句、inspectCandidate认知复杂度31及publishCandidate复杂度19，日志/tmp/foundry-t088-lint-before.log。没有降低规则或类型强度。

核查发现原发布器只检查coding/frontend/workflow分类和名称语法，没有独立核对获准9项身份；构建verifyCandidate已有白名单，但发布阶段不允许编译TS。先增加真实反例：将合法单技能改为coding/unapproved-tool，正文、frontmatter、路径、identity及所有摘要一起正确重算，授权仍绑定实际候选和本次bare。原产品实际接受，新增17项执行为16通过、1失败（Missing expected rejection），日志/tmp/foundry-t088-publish-red.log。这是真实准入缺口，不能用摘要合法代替获准技能身份。

协调者确认沿现有9项集合由独立发布器校验。发布器新增独立白名单，维持分类对应关系；测试从真实构建models.publicSkills读取9项，并逐项通过独立bare的真实发布/远端核验检查两处允许身份一致。不将TS编译或构建器导入产品发布路径；测试用合成正文/许可明确仅验证身份准入，不冒认正式技能正文交付或真实ISC证据。

## 实际修改

候选核验按声明文件、逐技能正文与identity、集合关系、adapter拆分，保留原顺序与每个约束；未知正式名称在任何远端调用前拒绝。错误阶段记录抽为局部函数，保持prepare/publish/remoteVerify/consumption原事实和原因，不增加状态系统。semver仅移除未使用捕获，不改变接受语言；Git树模式改为非捕获后同步使用实际blob和路径组索引，真实文件对象回读测试通过。

原16项测试断言保留，只展开四处多语句单行；增加未知技能拒绝与9项模型一致性两项，共18项。候选样本仍只在自有目录准备，发布不安装依赖、不构建、不执行payload、不修改候选，不生成runId/artifactId/PlatformReceipt或full/ready标签。新标签无force、实际无父commit和精确文件全集、已有同字节复用/异字节拒绝、并发/断连回读及已写事实保护均保持。

## 实际验证

| 命令                                                                                                                                           | 实际结果                                 | 证明范围                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm --filter @foundry/skills-distribution-urgent exec node --test --test-isolation=none tests/publish.test.mjs（新增未知技能反例、修复前）    | 退出1，17项16通过、1失败、0跳过，约2.6秒 | 未获准但字节一致的技能原先实际可发布；日志/tmp/foundry-t088-publish-red.log。                                                                               |
| 同命令（补独立白名单后）                                                                                                                       | 退出0，17/17、0跳过，约2.4秒             | 原16项保留，新白名单反例真实拒绝、零新ref；日志/tmp/foundry-t088-publish-green.log。                                                                        |
| pnpm --filter @foundry/skills-distribution-urgent exec node --test --test-isolation=none tests/publish.test.mjs tests/urgent-contract.test.mjs | 退出0，36/36、0跳过，约16.9秒            | 发布18项加旧契约18项，包含模型九身份、真实无父精确树/同版复用/异字节/带父/非commit、并发及响应丢失/断连；日志/tmp/foundry-t088-publish-contract-final.log。 |
| pnpm --filter @foundry/skills-distribution-urgent run lint                                                                                     | 退出0                                    | 当前实际整包共享ESLint通过；日志/tmp/foundry-t088-package-lint.log。                                                                                        |
| pnpm --filter @foundry/skills-distribution-urgent run check-types                                                                              | 退出0                                    | 当前严格TS检查通过；日志/tmp/foundry-t088-package-types.log。                                                                                               |
| pnpm --filter @foundry/skills-distribution-urgent exec eslint build/publish.mjs tests/publish.test.mjs                                         | 退出0                                    | 发布职责的局部最终ESLint通过；日志/tmp/foundry-t088-scoped-lint-final.log。                                                                                 |

新增模型一致性夹具首轮曾因尚未建立frontend目标父目录而失败，属于测试准备错误；补齐本次拥有目录后实际重跑36项全部通过，没有改产品或削弱断言求绿。最终校验只对应执行时真实字节，其他并行模块后续改变后仍按其范围复验。

## 未执行与交接边界

本项没有向真实GitHub或其他外部仓库写入，没有提交本工作区、迁仓、推送源码或正式发布。内部bare操作是本次隔离试验，不等于具体真实候选已获发布授权。产品完整构建/双构建、真实官方两步安装、旧迁移及完整宿主加载由T080/T082/T084～T087独立验证；本项的工程/发布范围结果不替代那些未完成证据。真实许可正文及适用第三方许可仍由供件/交接核对，测试许可证不充当实际ISC许可。

原pipeline/publish准入和T089本地全部成功后暂停保持。后续T090～T093仍需用户实际迁仓及明确继续、重新冻结来源身份和绑定具体repository/version/sourceRevision/candidateDigest的授权，再进行真实发布、匿名全集核验和消费，不以本记录自动放行。
