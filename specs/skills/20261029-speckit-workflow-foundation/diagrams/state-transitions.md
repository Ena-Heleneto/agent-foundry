# 技术流程：目录 Markdown 的保存与恢复

来源：contracts/workflow.md；更新 2026-10-31。取消 JSON 状态提交图，不新增子任务管理脚本。

```mermaid
flowchart TD
    Index[读取父级交付约定和子任务索引] --> Read[读取子任务 README 与证据]
    Read --> Check{归属 原验收 依赖是否有效}
    Check -->|否| Stop[报告缺失或冲突 暂停]
    Check -->|是| Work[按模式执行并取得实际证据]
    Work --> Save[保存证据与续接说明]
    Save --> Verify{读回核对成功}
    Verify -->|否| Retry[报告已写与未写 核对文件后重试]
    Retry --> Save
    Verify -->|是| Accept{原验收是否有足够证据}
    Accept -->|否| Keep[保留未完成 续做原子任务]
    Accept -->|是| Complete[仅更新该子任务 README 状态]
```

术语：索引是指向原记录的链接；读回核对是确认文件确实保存了本次内容；原验收是开始前约定的通过标准。位置：<FD>/tasks.md、sub-task/<Subtask ID>/README.md 和 evidence.md；执行者为 agent，不存在 state.py 或 state.json。完成不自动勾父任务或代表学习通过；此图不承诺跨文件事务。

## 从未拆分到父级整体交付约定

```mermaid
flowchart TD
    Request[用户请求拆分原任务] --> Read[读取原目标 范围 约束 验收和做法]
    Read --> Existing{已有子任务}
    Existing -->|有| Resume[续用原身份和验收 不另建一组]
    Existing -->|无| Form{请求的拆分形式}
    Form -->|普通对话| Standard[标准工程步骤]
    Form -->|Tutor| Learning[工程步骤加学习环节]
    Standard --> Save[先保存详细子任务]
    Learning --> Save
    Save --> Verify{格式 读回 覆盖和链接核对通过}
    Verify -->|否| Keep[保留父级原文 报告并核对后重试]
    Keep --> Save
    Verify -->|是| Parent[父级保留整体交付约定 移除详细做法]
    Parent --> Work[按依赖逐项执行与验证]
    Work --> Whole[依据父级整体验收判断最终交付]
```

术语：整体交付约定回答“交付什么、怎样算整体完成”；详细做法回答“这一步在哪里、怎么做、怎么验”。覆盖核对表示原要求都能在父级约定和子任务中找到去处。位置：权威规则为 `.specify/memory/constitution.md` VII；消费位置计划为 `packages/skills/src/skills/workflow/task-*/SKILL.md`；实际记录位于原 Spec 的 `tasks.md` 和子任务目录。T035～T038 尚未实施，本图是设计，不表示行为已通过。
