# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

[Gates determined based on constitution file]

## 小闭环详情

闭环详情见 [mvu.md](mvu.md)。

本项目在 plan.md 同级创建或增量维护闭环详情文件；本节最终只保留上述一处文件级链接。总体推荐顺序、理由和依赖写入方案，逐条 MVU 索引、锚点跳转及 Task 范围列表留在详情或任务清单。每条详情标题下先写“状态＋依据”，再保留四个短段：闭环结果、节点与关键逻辑、关联 Task、验收信号；不复制完整设计或八栏目。Task 未生成时明确关联待补，生成后补齐真实 ID/职责。

状态使用未开始、进行中、待验收、已通过、受阻，依据本闭环职责的真实任务记录和验收证据填写。仅生成规划仍为未开始；实现具备而缺闭环验收时待验收；已通过须引用覆盖验收信号的实际证据；受阻写明当前障碍及恢复条件。相关事实变化或恢复时核对摘要，不按关联任务勾选数机械汇总，不反向修改 Task 完成事实；plan 不复制各条状态。

旧详情按本次范围迁出，已有详情先复用；保护原定位、任务身份/目标/验收/完成事实及证据，将有效旧引用改为详情中的对应位置，不能修改的引用如实报告。复用已有历史来源，不自动创建 plan.history.md 或其他整份方案快照。plan 已是导航时不重新导入详情。

任务生成及原生 analyze 必须明确读取同级闭环详情，核对节点、Task 职责与验收，不依赖逐条索引或文件发现清单。尚无详情文件时先兼容原 plan 内容，只有详情而缺 plan 时仍须完成方案前置。保存失败报告已写/未写及恢复入口，停止依赖动作。这些模板说明在生成 plan 后移除，保留文件级链接与实际总体方案。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file ($speckit-plan command output)
├── mvu.md               # 小闭环四项详情；plan 只留文件级链接
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
