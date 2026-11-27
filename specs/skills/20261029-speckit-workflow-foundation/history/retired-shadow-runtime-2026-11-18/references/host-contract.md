# 新对话记录候选的宿主约束

适用当前已观察的Linux宿主：来源session_meta声明0.169.0，消息是event_msg/item_completed，提供真实thread_id、turn_id、item.id、completed_at_ms和Text内容。仅版本相同不代表结构相同；旧user_message/agent_message格式缺少本候选所需身份时明确拒绝，不能改造或猜造身份求通过。

## 接入与范围

本附件随独立Skill使用，不经Spec Kit扩展/hook或AGENTS/CLAUDE项目路由管理。用户直接调用或宿主技能发现后，仍须实际执行下面的来源核验和受管运行，不能把安装/匹配当作自动记录成功；不另设Agent管理服务。用户要求暂停、清空或只归档时保持该次范围，不自动恢复记录。

从实际宿主取得当前thread身份及唯一source，先校验session_meta.id和cwd。只读该确切会话，不按正文搜索其他会话；源绝对路径仅作本次运行输入，不写入Skill或分发物。资料根必须在目标项目内，使用该项目已有布局，不能直接用项目根，也不跨项目复制画像。

执行本Skill时，在当前会话运行期间通过宿主已有的受管执行入口运行同目录上一层的 `scripts/shadow_runtime.py`。它是前台程序，既不fork/daemon化也不自行安装服务；受管执行范围沿宿主处理，不使用shell的 `&`、nohup或脱离CLI的全局守护进程。Skill文件存在不代表宿主已经接入或自动启动成功。

新可见消息到达即记录。quit/停止不等待收尾，不做退出后补录；本候选不要求SessionEnd、独立结束句柄或强杀专项前置，也不将任意父PID当作主会话身份。没有真实接入上下文时报告未接入，不用逐条模型抄写冒认自动采集。

## 运行

使用Python 3.11+标准库，无第三方依赖。将下列占位项替换为宿主真实提供的值；不要将机器路径写回本参考：

```text
python3 -B <skill目录>/scripts/shadow_runtime.py capture
  --project-root <目标项目根>
  --memory-root <项目内资料根>
  --thread-id <当前真实thread>
  --source <唯一当前消息JSONL>
```

参数在同一次命令中传入。默认从接入时文件末端开始，inotify就绪后先读新增数据，再等待文件事件；不会每轮让模型调用保存。`--start-offset <字节位置>`仅用于当前仍运行会话已到达的消息，必须是完整行边界；起点及此前覆盖缺口如实说明，不能给已关闭会话补录。

`--once`是一次性诊断/当前会话重放入口，不是历史导入器：默认从session_meta之后读取当前已有行，不继续监听。来源未完成尾行报告source_gap，不拼造后半行。普通自动记录使用持续运行入口。

同一仍运行会话恢复时，在capture命令加`--resume`，不同时传start-offset。它校验原设备/inode、session_meta摘要、已确认前缀摘要和完整行边界，再从coverage中的checkpoint_offset续读。已有检查点的持续入口必须显式resume，禁止重新从EOF跳过窗口；无检查点、来源改写/轮转/截断时拒绝自动恢复。恢复样本单独说明，不能称为首次到达时的实时保存。工具只能核验文件身份及字节，调用方仍须以真实宿主上下文确认会话正在运行，不能借此采集已关闭会话。

```text
python3 -B <skill目录>/scripts/shadow_runtime.py inspect
  --project-root <目标项目根>
  --memory-root <项目内资料根>
  --thread-id <当前真实thread>
```

inspect返回：

- received_count/received_coverage：已持久保存的接收事实，含真实身份、源完成时点、源偏移及实际观察时点。
- recorded_count/source_refs/recorded_coverage：有关联原文摘要且当前读回相符的成功收据，含实际saved_and_read_back_at_ns。
- raw_count/raw_source_refs：当前原文实际存在的范围；unconfirmed_source_refs和received_but_not_saved分别说明原文未确认收据、接收但尚未确认保存的范围。
- source：已核验来源结构、接入origin_offset、checkpoint_offset及前缀摘要。接入前不承诺覆盖，不推定不同线程的统一顺序。
- gaps：不含正文的故障分类、源偏移、实际检测和解决时点；null解决时点表示尚未核实解决。没有完整身份的半行不冒认已接收可见消息。
- analyzed_coverage/profile_coverage为null：本候选尚不提供这些事实，不是分析成功或无缺口。

## 保存与可观察结果

原文放 `conversations/raw/<thread>.jsonl`。只处理UserMessage与AgentMessage；Agent的commentary/final_answer或final保留phase。Text分段原字保留在text_parts，text按分段顺序直接拼接，不插入额外字符；工具/思维/系统开发者提示不写入。

本版验证范围是普通自由文本，以及已观察的异步题目/普通回答文本：题目仍属Agent，questions/delivery等封装不进入用户原文；用户的A按实际UserMessage原字保存，不猜题目关联、不替换成选项。非文本内容、非空text_elements及未知内容形状返回unsupported_source和覆盖缺口。未取得实际引用字段前不宣称支持附件；后续仅保存可核验引用和必要说明，不复制原件。

每条保留thread_id/turn_id/item_id、role、phase、text/text_parts、source_completed_at（源completed_at_ms原值）、source_offset（源行字节位置）和observed_at_ns。线程内按源行顺序保存，不以文本相同判重。

所有原文与覆盖写入使用同根固定 `.shadow-write.lock` 的短fcntl锁；不在锁内运行模型。先保存接收事实，再append、flush/fsync和读回原文，最后保存读回收据；全部成功后才输出saved。saved_and_read_back_at_ns是原文读回后实际时点，不预填到待写原文。收据包含原文规范JSON的SHA-256，外部改写/删除导致不符时返回identity_conflict。重启从真实原文重建判重，相同身份内容变化拒绝，不能先判重后保存。

coverage.md是处理事实，不是工程Task账本。其全部内容为标题“对话记录覆盖”及一个JSON代码块，format为shadow-recording-v1、forget_generation为0、threads按真实线程分组；每组仅received、recorded、gaps、source四项。根、组、收据、缺口及来源字段均按本版白名单校验，未知字段/版本或非零代际拒写。分析/遗忘协议后续扩展需明确迁移，不能直接向此文件追加Markdown段落。无需state.json；旧日期摘要不迁移或伪装为全文。

覆盖文件使用同目录临时文件、同步、替换、目录同步和读回。原文已写但覆盖收据失败时保留原文，inspect说明未确认；重放后实际同步/核对原文，再以verification=recovery_readback及当前时点补收据。普通新追加为verification=append。同事件已确认收据不重复，相同文字不同身份分别保留；不承诺多文件事务或崩溃后的自动回滚。

capture_ready仅证明本次来源校验/监听初始化完成，不证明已有消息全部落盘。saved只对应该条成功范围。source_gap、identity_mismatch、unsupported_source、unsupported_coverage、identity_conflict、save_failed均停止当前候选并保留实际已存；错误输出不包含私人正文。gap_persisted仅表示本次错误事实能否另存成功，资料根不可写时仍输出false及错误，不假装完整留档。调用方在下一次可见反馈说明故障和已写/未写，继续正常协作。保存失败能核实为本次追加的尾部在锁内恢复；恢复也失败则保留现场，不报成功。

## 当前交付限制

半行在运行期间暂存，完整行再解码；畸形完整行、已有目标坏尾行、来源轮转/截断或监听溢出明确停止，不自动修复或重接。主动停止不执行最后一次drain，未完成内容不计入已存。

同根已有未知格式的 `conclusions/coverage.md` 或非零遗忘代际时拒写（unsupported_coverage），避免在尚未实现遗忘协议前忽略失效依据。不得删掉已有coverage绕过。正在缓冲的半行记partial_source，补齐并成功越过对应偏移后只补实际解决时点；未知偏移、来源身份失效等不能仅靠后来的保存自动宣布解决。

本候选只实现capture/inspect。snapshot、分析实际派发、commit、forget、完整多会话发布和2000字入口仍按原Task推进；记录成功不代表这些能力已经交付。源码附件变化后须精确复制完整Skill到隔离目标并实际消费；不得手改已安装副本。正式项目复制/启用和最终来源验收沿各自Task，不因候选测试通过自动改真实配置。
