# T095 隔离验证材料

日期：2026-11-11。对应[原 Task](../../../../tasks.md#t095)、[方案](../../../../implementation/T095.md)和[验收记录](../../entry-discovery-mechanism.md)。独占现场为 `/tmp/foundry-t095-20261111-ed900wvy`，所有项目和测试用户由已有 sandbox 创建，真实全局技能及生产脚本未改。

## 可复验入口

运行 `node packages/skills/tests/distribution/entry-discovery.test.mjs`。实际官方集成需显式传入 FOUNDRY_ENTRY_SPECIFY_CLI 和 FOUNDRY_ENTRY_SKILLS_CLI；FOUNDRY_ENTRY_EVIDENCE_ROOT 可接收各沙箱完整快照和 calls.json。没有工具时官方四项明确 skip；本轮提供的是实际 Specify 1.2.6 和 skills 1.7.4 的缓存可执行入口，不在测试中联网安装依赖或读取旧 dist。

每个正向项目由官方 init 初始化，官方本地安装三份当前源，候选只将 Increment 来源归位，再交官方扩展生成唯一正式入口。项目/全局和无桥接/有桥接四个案例分别留证，复制的官方实际输出完整快照用于后续只读发现和加载，不称复制动作是另一次安装。

实际发现调用：`python /tmp/foundry-t095-20261111-ed900wvy/discover.py <project|global|references-bridged>`，协议来自本机 CLI 生成 schema，保留 initialize、skills/list 请求和真实响应。测试用户 HOME 与当前认证运行时分开，发现不调用模型或复制凭据。

实际全文读取：`python /tmp/foundry-t095-20261111-ed900wvy/load.py <global|references-bridged>`，按发现结果明确请求读取正式正文和必要附件，默认模型、read-only、每回合180秒限时，事件/回执/完整文件前后摘要分别保存。它不是普通自然语言自动发现或业务执行验证，相关后续仍由 T099 承担。

`audit.py` 独立核对官方来源/扩展/生成集合、附件目标、零调用保护、发现结果、完整工具输出及文件保护。初次沙箱 EPERM、缺候选模块红灯、目录链接和附件目录冲突红灯、桥接反例均保留，不改写成首次成功。

## 留存范围

official-cases 保存用于发现/加载的真实官方输出快照；official-cases-final-code 保存最终代码的12项完整重跑，普通生成结果与前者逐字同版。host 与 discovery 分别保存读取及发现，parent-before 只包含本 Task 必需父资料，src-snapshot 保存本轮测试骨架及正式源的实际字节。

父资料选取快照不是整个仓库副本；正式 Spec 的其他引用沿仓库原位置读取。完整原始归档与结构化结果在实际保存后由验收记录引用，不夹带仓库画像、认证或凭据。构建、真实挂载、其他平台及真实用户效果均未由本材料验证。
