# 官方安装预检与显式第二步

唯一公开入口是 `node script/index.mjs [参数]`。紧急版只支持 Linux x86_64、Codex 项目级和明确技能名；全局、其他系统/agent、隐藏和自有下载自动安装均不支持。需要 Node ≥22.20.0、Bash、tar、curl、Git、GNU 文件工具及预先准备的 jq 1.8.1；`FOUNDRY_JQ` 可指定已有 jq，不自动安装工具。

在消费项目的当前目录，先运行只读预检：

```text
node <同版script目录>/index.mjs --check --official --source <固定完整发布SHA的GitHub raw根> --version <版本> --agent codex --skill <名称> --project <当前项目绝对路径>
```

预检只读取 npm 官方 skills latest 的同次发布元数据和完整包，在内存中核验 integrity 和 package.json 版本，再读取该包实际 Codex 项目路径规则。布局改变、断网或校验失败会停止，不回退旧表，不运行 npx，不写 npm 缓存、锁、安装收据、技能暂存或目标项目。

成功报告的 `official.args` 是本次建议：固定 tree 来源、同次解析的 `skills@<版本>`、明确技能名、`--agent codex`、`--copy`，不含 global。用户按该建议实际执行官方安装。raw/tree 两种来源必须对应同仓库、同完整发布 SHA、同子目录；查询、编码、路径歧义或非支持来源不提供可执行建议。本地内容测试直接使用真实官方 CLI，不作为对外预检来源。

官方安装完成后，用相同的来源、版本、技能和项目普通调用：

```text
node <同版script目录>/index.mjs --source <同一固定GitHub raw根> --version <同一版本> --agent codex --skill <同一名称> --project <当前项目绝对路径>
```

普通调用只进入 `mount-entry` 核验已有官方目录。无自有收据也可复用完整同版文件；不会造收据、覆盖技能或补装依赖。技能名称可重复指定，去重保序，依赖必须显式补选。`--source-dir` 仅供本地同版材料与自有沙箱验证，不能据此宣称已完成公开来源消费。

同版运行材料、集中配置和所选正文/附件全部通过摘要与文件全集核验后，才会进入所选 hooks 和 Increment。`--check --official` 或 `--no-mount` 的成功不能替代实际挂载。stdout 保留一个结构化阶段报告，诊断和官方工具日志写 stderr。
