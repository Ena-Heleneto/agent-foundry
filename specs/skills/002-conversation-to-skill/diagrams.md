# 关键流程图 · 从 Codex 对话生成协作 Skill

## 项目安装与首次启用

首次启用的位置是主线 `profile` 集合的项目级安装入口。现有 Spec Kit 开发挂载脚本提供集中声明、核对来源和登记到项目的参考。图中的信任及自动启用路径由 T035 在 Codex CLI 上复验。 [记录集合](../../../packages/skills/src/profile/collection.config.ts) · [挂载参考](../../../scripts/dev/mount-speckit.sh)

```mermaid
flowchart TD
    A["同次项目安装交付记录 Skill 和必要组件"] --> B{"候选需要 Codex 信任确认？"}
    B -->|需要| C["在空白引导会话中完成原生确认"]
    B -->|已满足启用条件| D["核对项目来源及当前启用状态"]
    C --> D
    D --> E{"已读回安装完成所需条件？"}
    E -->|已满足| F["安装完成，空白会话零记录"]
    E -->|待满足| G["安装尚未启用，保留待处理原因"]
    F --> H["正常打开 Codex 并发第一条消息"]
```

## 会话先保存，再继续任务

现有范围规则位于记录 Skill 的 `references/session-scope.md`，保存规则位于 `references/save-events.md`。候选须用回调时点可取得的宿主证据确认范围，再沿这些规则保存。首条原话先写入并读回，详情可打开后补上链接。同轮提交失败后、重试前的修复按普通业务内容处理。 [范围规则](../../../packages/skills/src/profile/conversation-recording/references/session-scope.md) · [保存规则](../../../packages/skills/src/profile/conversation-recording/references/save-events.md)

```mermaid
flowchart TD
    A["收到用户消息或已纳入会话的活动"] --> R{"是否仅为记录维护的内部工具活动？"}
    R -->|是，不产生待记录事件| G
    R -->|否| I{"能核实交互入口、当前有效目录与原会话均符合仓库范围？"}
    I -->|是| B["确认会话身份和原归档日期"]
    I -->|否或无法核实| J["跳过记录与正文补读，继续用户任务"]
    B --> K{"当前内容属于提交步骤或结果回复？"}
    K -->|是，仅跳过该次步骤及结果回复| G
    K -->|否| C["首条消息时建档，后续内容续写原文件"]
    C --> D{"写入并读回成功？"}
    D -->|是| E["核对详情与附件，更新主记录链接"]
    D -->|否| F["标记实际缺口"]
    E --> G["继续会话任务"]
    F --> G
    G --> H["后续事件或再次恢复"]
    H --> A
```

## 正常最终回复的发送顺序

图中是 FR-002 现行验收顺序。T035 优先验证 Codex 的 `Stop` 回调，在宿主发完回复后自动保存并读回全文。记录 Skill 当前时序规则随 T035 候选的正式切换更新。 [现有 Skill 时序](../../../packages/skills/src/profile/conversation-recording/references/recording-timing.md) · [宿主证据](research.md#正常最终回复结束后的保存与读回)

```mermaid
sequenceDiagram
    participant Host as Codex 宿主
    participant Recorder as 项目记录流程
    participant File as 项目主记录
    participant Terminal as 用户终端
    Host->>Terminal: 正常发送回复，直到全文发完
    Host->>Recorder: 提供本轮实发回复全文
    Recorder->>File: 保存回复原文
    File-->>Recorder: 读回全文并逐字核对
    Recorder-->>Host: 回复已保存并读回
```

## 父代理分别判断两个阶段

规则位于规划中的提炼和分析 Skill 入口。父代理通过已有工具派发，能支持一条特点时启动提炼。此前确认的特点也可直接进入分析判断。

```mermaid
flowchart TD
    A["本仓库已确认保存的对话"] --> B{"依据足以支持特点？"}
    B -->|否| C["等后续材料"]
    B -->|是| D["提炼子代理保存特点"]
    D --> K["父代理确认特点"]
    K --> E{"特点足以形成或修订规则？"}
    J["此前已确认的特点"] --> E
    E -->|否| F["继续使用当前产物"]
    E -->|是| G["分析子代理生成规则和 Skill 候选"]
    G --> H["父代理在共享写入协调内核对版本并采纳"]
```

## 删除后如何处理迟到的旧分析

规则位于规划中的 `packages/skills/src/profile/conversation-analysis/SKILL.md`。AI 用现有工具删除当前规则，之后仍可用真实材料重新形成规则。

```mermaid
flowchart TD
    A["用户删除一条规则"] --> B["移除独占依据与失效关联"]
    B --> C["共享依据与原始对话仍可用"]
    C --> D{"在同一写入协调内核对：回传版本是否过期？"}
    D -->|是| E["保留当前删除决定"]
    D -->|否| F["依据本轮材料判断是否形成规则"]
```

## 多个父会话更新同一份协作 Skill

规则位于规划中的 `packages/skills/src/profile/conversation-analysis/SKILL.md`。以同一资料区和协作 Skill 为写入协调范围，AI 使用现有工具在同一边界内核对版本、采纳与删除。并发效果由 T019、T022 和 T026 核对，失败及恢复见[数据模型](data-model.md)。

```mermaid
flowchart TD
    A["不同父会话并行派发，候选携带基准版本"] --> B["候选各自保存并回传"]
    B --> C["进入同一份 Skill 的写入协调"]
    C --> D{"候选版本与当前版本一致？"}
    D -->|否| E["保留过期候选与来源，当前产物不变"]
    E --> F["退出协调，后续按最新材料重新判断"]
    D -->|是| G["采纳规则、依据关联与目录，核对后推进版本"]
    G --> H["退出协调，下一个写入者重新核对版本"]
    I["用户删除规则"] --> J["进入同一协调，清理独占依据并推进版本"]
    J --> H
```
