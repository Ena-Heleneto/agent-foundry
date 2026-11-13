# T079：共享接口与真实缺能力基线

覆盖本次独立副本 `<source-home>/workspace/ena/foundry/feature/skills-distribution-urgent/`，不代表正文发布、官方注册或 Codex 宿主加载通过。依据 [实施方案](../../implementation/T079.md)及紧急契约；接口记录在本方案和目标测试，临时协作副本为 `/tmp/urgent-contract-interfaces.md`。

已交付 `tests/helpers/urgent-sandbox.mjs` 和 `tests/urgent-contract.test.mjs`。每条用例拥有独立临时目录，真实加载 TypeScript 验证器或执行唯一 Node 入口；发布风险使用自有 bare Git，不接真实远端。覆盖 identity 兼容模型及候选摘要、缺附件、额外文件、错版本/源码、development、identity 遗漏、大小写、链接、越界、raw/tree 固定来源、无自有收据复用、hook 故障阻断 Increment、无授权零写入、带父/非 commit tag、并发和推送响应丢失。

实际验证如下：

| 命令                                                                 | 实际结果                    | 原因与范围                                                                                                                                                        |
| -------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --test tests/urgent-contract.test.mjs`（首次14项）             | 退出1；0通过、14失败、0跳过 | 旧schema拒绝identity-only，verifyCandidate与resolveOfficialSource缺失，普通入口拒绝project，publish模块缺失；均为具体产品缺能力                                   |
| 同命令（补齐Git四项后18项）                                          | 退出1；1通过、17失败、0跳过 | runtime同期已实现固定来源纯函数，该项转绿；其余候选、普通入口、阶段事实和发布仍失败。完整原始输出暂存 `/tmp/urgent-t079-red.tap`                                  |
| `<source-home>/.local/share/mise/installs/pnpm/latest/pnpm run lint` | 退出0                       | 新测试与当前独立工程ESLint通过                                                                                                                                    |
| 同前缀 `run check-types`                                             | 退出2                       | 复制旧插件的3项既有错误：content.generateBundle与distribution.writeBundle在exactOptionalPropertyTypes下带undefined，以及distribution.ts61可选参数赋值；由T080适配 |
| 同前缀 `run build`                                                   | 退出1                       | 尚无T080有效Vite配置，默认寻找index.html失败；没有生成有效候选                                                                                                    |

失败处理不以 skip、生产占位或无断言绕过；产品未完成与依赖环境未具备分别说明。hook故障只在外部CLI进程边界注入失败，用于验证生产顺序，不作为官方成功注册证据。测试用 LICENSE 明确为样本数据，不能用于真实公开许可证明。T082、T084、T087及T092仍须各自完成真实官方安装、挂载、派发和宿主完整加载；本基线不勾选这些验收。

## 当前工作区接入后的T079基线（2026-11-12）

本节对应当前工作区packages/skills-distribution-urgent，不替换上方旧仓库外副本的历史结果。协调者已实际放行T078来源/配置前置，新的工作区方案及内部接口已保存并读回，见[本项方案](../../implementation/T079.md#工作区续接复核2026-11-12)。主线packages/skills仍沿用户手写分工，本项不改主线、旧副本、任务checkbox或产品实现。

内部source接口固定sourcePackagePath、sourceRevision、inputFiles、inputDigest、dependencies及dependencySnapshotDigest；source不进入公开Release，schemaVersion=1和原候选接口保持。inputFiles采用Git根相对POSIX路径及固定path/bytes/sha256顺序，以UTF-8路径字节排序后计算JSON字节摘要；忽略的根锁和共享预设dist分列依赖事实。测试通过实际Git和独立磁盘摘要核对，不用产品摘要函数生成自身预期。

新增tests/workspace-source.test.mjs共14项，helper提供带空格路径packages/urgent skills、真实Git提交、catalog、共享preset源码/exports/生成字节、实际已安装yaml解析位置和未跟踪根锁。所有写入只在各项独占临时根，9项技能正文和附件来自已恢复字节，README/LICENSE明确为测试数据，不是正式发布候选或许可证据。旧18项契约不人为破坏求红。

| 实际命令                                                                                                                             | 结果                                        | 本次含义                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pnpm --filter @foundry/skills-distribution-urgent exec node --test --test-isolation=none tests/urgent-contract.test.mjs              | 退出1，18项：17通过、1失败、0跳过，约11.2秒 | 候选磁盘核验、URL、无收据、Git授权/冲突/并发/断连均真实通过；hook故障用例因尚未到达外部uvx调用失败，与guard/Bash未完成接口一致，不能当官方hook通过。原始输出/tmp/foundry-t079-old-contract.log。 |
| pnpm --filter @foundry/skills-distribution-urgent exec node --test --test-isolation=none tests/workspace-source.test.mjs             | 退出1，14项：0通过、14失败、0跳过，约3.3秒  | 所有用例的完好嵌套来源前置均被真实产品以“来源必须是独立 Git 根目录”拒绝；不是启动或依赖错误。原始输出/tmp/foundry-t079-workspace-red.log。                                                       |
| pnpm --filter @foundry/skills-distribution-urgent exec eslint --fix tests/helpers/urgent-sandbox.mjs tests/workspace-source.test.mjs | 退出0                                       | 仅自动修复本项拥有的文件；没有对全包禁用规则或修改其他实现。                                                                                                                                     |

14项骨架分别为：完整嵌套来源接口；无关脏文件与主线eval存在但正式候选仍9项；README、构建源码、技能正文三种相关未提交输入；被Git忽略的实际脚本；catalog、preset的TS配置与ESLint源码三种共享输入；根锁及生成dist依赖证据；input、revision、dependency三种读取期间漂移；只读核验保留技能字节且不生成dist。

每项拒绝测试均先要求同一完好嵌套基线成功，再引入自身单一错误。因此当前红灯真实定位的是嵌套来源能力缺失，后续破坏和漂移断言尚未被触达，不能把统一的旧Git根拒绝冒认成14种风险分别已验证拒绝。T080适配后须逐项运行到自身断言；读取漂移只用私有PATH包装真实Git，实际读取成功后再改本次拥有字节或提交，以标记证明已经注入，不返回伪造blob。

已把实际红灯及冻结接口回传协调者和T080实施者，允许其按依赖开始产品适配；T079保留测试骨架，由共享helper唯一写入者维护。真实官方安装、迁移、hooks/Increment宿主加载及完整本地交付仍按对应Task独立验收，本项没有将未执行或失败转为通过。

### 骨架交接时的后续实际复验

在首次14项红灯回传T080后，补充第15项“已提交catalog与实际解析工具版本不一致时拒绝来源”：真实提交yaml声明999.0.0，实际解析仍为现有已安装版本，工作树干净；拒绝必须来自声明/实际依赖比较，不能靠脏工作树遮蔽。未修改生产实现。

T080同期进行适配后实际再运行同一workspace命令，15项为14通过、1失败、0跳过，约53.5秒，原始输出/tmp/foundry-t079-workspace-red-final.log。唯一失败是新增已提交catalog反例Missing expected exception，已回传T080继续适配；其余用例已通过完好嵌套基线并实际执行各自断言，包括3种读取期间漂移。此轮发生在产品适配过程中，只证明该次实际输入，不将其记作T080最终验收；Git包装器随后将dependency漂移内容改为合法YAML注释，避免语法错误遮蔽字节复核，最终版本仍须由T080复验。

本项3个JS文件（helper、workspace-source及urgent-contract）的不带fix scoped ESLint退出0；本包check-types实际退出0，日志/tmp/foundry-t079-types.log；git diff --check退出0。原urgent-contract仅展开既有多语句单行以满足项目格式，断言语义保持。T079方案/证据已保存并读回，source/helper和新增契约骨架交接给构建实现者消费；后续不再并发修改共享helper，除非协调者明确安排故障修复。工程checkbox由协调者按T079本身的骨架与接口职责判断，不把本记录当产品全部通过。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
