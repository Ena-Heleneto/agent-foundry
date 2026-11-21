# T082：工作区候选的真实官方内容安装验收

日期：2026-11-12。范围只覆盖Linux/Codex项目级的官方技能发现及复制安装MVP，输入为[原Task](../../tasks.md#t082)、[本项方案](../../implementation/T082.md)和候选同版脚本；不抵扣完整挂载、宿主加载、本地全部完成或公开来源验收。

## 工作区测试入口适配

原official-install测试从包内强制复制pnpm-lock.yaml/.gitignore并重建独立根，这不再适用于工作区包。当前骨架默认消费packages/skills-distribution-urgent/dist，内部URGENT_CANDIDATE_ROOT可显式切换同版完整候选；不新增对外参数，不放宽生产GitHub来源。不自动构建、创建候选或skip，缺材料明确失败。

候选先用当前verifyCandidate实际读盘核对schema、精确文件全集、完整内容及9项正式身份，再从候选同版script/install-skills/read-agents.mjs核验当次真实npm latest发布包的版本/SRI和Codex项目路径，固定该次版本执行实际npx。工具缓存、用户目录、项目及临时路径均由本次测试拥有，不复制作者node_modules到消费端。

骨架保留真实CLI发现、整包/分类/单项/多项、增量、无效名称、公共脚本独立取得、错版/缺依赖/同名未知内容/用户修改的完整断言，并补显式eval请求失败及缺附件保护。已装目录和附件逐项核验普通文件、完整路径集合、原字节长度与SHA-256，未选新增0；每个安全反例保留执行前字节。--no-mount只用于内容核验反例，不被记为实际第二步挂载成功。

## 当前实际结果：正式候选尚未生成

| 实际命令                                                                                                                              | 结果及边界                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test tests/official-install.test.mjs | failed，1fail/0pass/0skip，准确报告缺少packages/skills-distribution-urgent/dist实际候选；在网络/真实CLI之前停止，不是产品能力红灯，也不计官方内容验收通过。 |
| pnpm --config.verifyDepsBeforeRun=false exec eslint --fix packages/skills-distribution-urgent/tests/official-install.test.mjs         | success，随后该文件及T080/T082相关方案证据不带fix的ESLint复核退出0。                                                                                        |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent run check-types                                  | success，严格tsc退出0。                                                                                                                                     |
| 本次真实latest/SRI、实际官方发现与四粒度安装/完整字节/增量/eval反例                                                                   | not-run，当前正式候选尚无，不能以旧副本或局部沙箱成功代替。                                                                                                 |

T080已有27项构建/来源范围通过，但当前真实工程来源仍待协调者统一冻结并完成正式build。骨架保留，待其就绪后使用相同测试命令复验并在本记录追加真实candidateDigest/sourceRevision、当次官方版本/SRI和逐项结果。未修改任务checkbox、构建/共享helper、主线或README，未提交、推送或发布。

## 正式候选就绪后的实际官方消费（2026-11-12）

协调者精确本地提交新包及所需catalog后，回传正式build与同源第二次build成功，完整36文件索引100%一致；复用日志/tmp/foundry-urgent-workspace-build*.log及首次索引/tmp/foundry-urgent-build-first-index.json，不把此前沙箱结果冒认本次正式构建。本代理在协调者明确停止重建并放行后，只读实际dist核对version=0.1.0、sourceRevision=47397b714194c4f5312825af0e20ddd88dfad0e6、9项正式技能、仅identity、35项files加release.json共36文件，独立计算candidateDigest为024f4ad70f1d90e9a4c032e2d15b72cc1edaf0d305ff1b29f9f363992bb0c543。

实际运行：

```bash
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test tests/official-install.test.mjs
```

候选同版在线读取并校验本次真实skills latest=1.8.1，integrity=sha512-QK3wlZ5j8wcpLPUOXt7+1Gu1f9JKpv7lBpO0zmqKa5VBrt45/woVo8Max1x4wha3pCNafNHiiodYK6Xi/0alQQ==。所有官方安装固定本次1.8.1，没有回退历史静态版本。

本次完整测试实际约18.9秒，11个Node测试计数中9通过、2失败、0skip/todo；2个失败是同一个发现子用例及其父测试的连带结果，不能写成全套通过。其余9个真实子用例全部通过：

- 整个9项范围、frontend分类、单技能、多技能四种选择，正文/全部附件长度及SHA-256、完整文件集合100%一致，无安装链接，未选新增0，消费端node_modules新增0。
- 同版增量只新增本次所选，前次技能正文及附件原字节保留。
- 官方无效名称及显式eval-short-rule均拒绝，目标.agents不存在，安装写入0。
- 根脚本及集中配置独立取得并按同版files逐项核对，不假设单技能自带公共材料。
- 真实官方已装目录中的缺依赖、错版、缺附件、未知同名及用户修改，均由候选普通唯一入口的内容核验拒绝，操作前后消费项目字节一致。这些--no-mount反例不算完整挂载成功。

### 发现子用例的真实CLI兼容问题及定向修正

失败原因是测试official()把--json无条件附加到--list；官方1.8.1实际返回“The --json flag cannot be combined with --list.”。该调用尚未进入技能发现，不是候选缺技能。按systematic-debugging先查证：在自有项目去掉json后，真实npx skills@1.8.1 add <同候选dist> --agent codex --copy --yes --list退出0，输出Found 9 skills及九个名称，目标.agents仍不存在。另读取同版、相同SRI的官方npm包源码package/dist/_chunks/remove.mjs，确认jsonMode与options.list的显式互斥分支；复现原始输出和该官方模块暂存于/tmp/urgent-official-list-5bw5jx45/。

协调者认可只修测试参数及解析后，official()对list不附json，其余安装继续JSON模式。发现断言只从真实官方输出中移除终端控制符，按边框后四格缩进的独立技能名称行提取，并精确比较候选9项名称及Found 9数量；不从磁盘目录或静态表冒充官方发现。生产代码和候选字节未改。

修正后以同版1.8.1和同候选在独占项目定向执行合法--list，实际退出0、九项名称完全匹配、目标写入0。名称为artifact-project-description、artifact-spec-analysis、bug-report、business-node-delivery、document-changed-symbols、implementation-preparation、nuxt-ui-styling、task-increment、vue-reactivity。该次仅复验发现及新解析，不重复9项安装，不将它与上一轮拼成已完整重跑通过；T089在最终新冻结输入上仍须完整运行同一官方安装测试。

修改后本文件tests/official-install.test.mjs的ESLint退出0，严格check-types退出0。源码写入权已交回协调者，仅追加本证据与方案；未改候选、生产脚本、主线、README、任务状态或执行公开写入。T082已有上述真实内容证据，但最终同输入全套重跑、完整第二步及宿主加载仍按原任务独立验收。

## 最终冻结输入上的完整复验（2026-11-12）

协调者完成最终说明及挂载材料后，以实际来源7e79b524b85fdfb5678acbe54ebfb41ec94bec1f及candidateDigest=498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6运行全套。该候选已包含最终README和mount材料，不再沿用上文47397b7的旧候选身份。本代理本轮只读取/tmp/foundry-urgent-final-all-tests.log核对既有实际结果，不重新运行测试或修改源码/候选。

日志第41～53行记录官方安装父项及全部10个子场景完整通过，父项耗时17072.603315ms。发现子项已真实使用合法list参数，精确九项发现及零安装写入通过；原--json与--list互斥失败已由前述测试层修正解决，本次不再仅由定向复验拼接通过。

本次完整通过包含：发现、全量9项、frontend分类、单技能、多技能、增量、无效名称、显式eval拒绝、同版公共脚本独立取得，以及缺依赖/错版/缺附件/未知同名/用户修改保护。安装正文及全部附件原字节与同版identity一致，未选新增0，正式来源eval=0，保护反例保留原字节。官方latest实际仍为1.8.1，SRI为sha512-QK3wlZ5j8wcpLPUOXt7+1Gu1f9JKpv7lBpO0zmqKa5VBrt45/woVo8Max1x4wha3pCNafNHiiodYK6Xi/0alQQ==，与本次固定CLI及日志中的来源/候选摘要对应。

该父项加10子项共11个Node计数已包含在协调者全套133/133之内，不额外累加。日志第139～146行显示pass133、fail0、skip0、todo0，实际总耗时426396.791543ms。上文旧缺dist/错误互斥参数及各次受限结果保留为修正历史，不能覆盖本次同一最终输入的完整复验事实。

这完成本项本地官方内容MVP的最终完整复验证据；完整正常第二步、宿主加载与本地最终暂停分别沿T087/T089原验收及其证据判断，不据此自动完成整个新仓库独立运行、迁后真实公开来源消费或最终SC-019。任务状态及交接清点由协调者收口，本轮只追加本记录及T082方案，未改handoff/README/源码或执行发布。
