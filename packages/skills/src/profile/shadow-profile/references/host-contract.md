# 新对话记录候选的宿主约束

适用当前已观察的Linux宿主：来源session_meta声明0.169.0，消息是event_msg/item_completed，提供真实thread_id、turn_id、item.id、completed_at_ms和Text内容。仅版本相同不代表结构相同；旧user_message/agent_message格式缺少本候选所需身份时明确拒绝，不能改造或猜造身份求通过。

## 接入与范围

从实际宿主取得当前thread身份及唯一source，先校验session_meta.id和cwd。只读该确切会话，不按正文搜索其他会话；源绝对路径仅作本次运行输入，不写入Skill或分发物。资料根必须在目标项目内，使用该项目已有布局，不能直接用项目根，也不跨项目复制画像。

主代理在当前会话运行期间，通过宿主已有的受管执行入口运行同目录上一层的 `scripts/shadow_runtime.py`。它是前台程序，既不fork/daemon化也不自行安装服务；调用方管理该执行范围，不使用shell的 `&`、nohup或脱离CLI的全局守护进程。Skill文件存在不代表宿主已经接入或自动启动成功。

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

```text
python3 -B <skill目录>/scripts/shadow_runtime.py inspect
  --project-root <目标项目根>
  --memory-root <项目内资料根>
  --thread-id <当前真实thread>
```

inspect输出真实已存三元组及数量；analyzed_coverage/profile_coverage为null表示本候选尚不提供这些事实，不是分析成功或无缺口。

## 保存与可观察结果

原文放 `conversations/raw/<thread>.jsonl`。只处理UserMessage与AgentMessage；Agent的commentary/final_answer或final保留phase。Text分段原字保留在text_parts，text按分段顺序直接拼接，不插入额外字符；工具/思维/系统开发者提示不写入。

本版验证范围是普通自由文本。非文本内容、非空text_elements及未知内容形状先返回unsupported_source；问答控件封装尚未完成专门适配，不将其称为已支持。既有5条控件探针不抵扣本候选范围。

每条保留thread_id/turn_id/item_id、role、phase、text/text_parts、source_completed_at（源completed_at_ms原值）、source_offset（源行字节位置）和observed_at_ns。线程内按源行顺序保存，不以文本相同判重。

所有原文写入使用同根固定 `.shadow-write.lock` 的短fcntl锁；不在锁内运行模型。成功需append、flush/fsync和读回；只有之后才输出saved收据，其中saved_and_read_back_at_ns是实际时点，不预填到待写原文。重启从真实原文重建判重，相同身份内容变化返回identity_conflict。不能静默覆盖原文，也不能先判重后保存。

capture_ready仅证明本次来源校验/监听初始化完成，不证明已有消息全部落盘。saved只对应该条成功范围。source_gap、identity_mismatch、unsupported_source、identity_conflict、save_failed均停止当前候选并保留实际已存；错误输出不包含私人正文。保存失败能核实为本次追加的尾部在锁内恢复；恢复也失败则保留缺口，不报成功。

## 当前交付限制

半行在运行期间暂存，完整行再解码；畸形完整行、已有目标坏尾行、来源轮转/截断或监听溢出明确停止，不自动修复或重接。主动停止不执行最后一次drain，未完成内容不计入已存。

同根已有 `conclusions/coverage.md` 时，本版拒绝继续写入（unsupported_coverage），避免在尚未实现遗忘代际和拒收协议前忽略失效依据。不得删掉已有coverage绕过；后续应沿原方案完善共同协议。

本候选只实现capture/inspect。snapshot、分析实际派发、commit、forget、完整多会话发布和2000字入口仍按原Task推进；记录成功不代表这些能力已经交付。源码附件变化后须精确复制完整Skill到隔离目标并实际消费；不得手改已安装副本。正式项目复制/启用和最终来源验收沿各自Task，不因候选测试通过自动改真实配置。
