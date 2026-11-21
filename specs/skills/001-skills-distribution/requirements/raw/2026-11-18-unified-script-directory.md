# 所有交付脚本统一到 dist/script（2026-11-18）

## 用户原话

用户指定 `packages/skills/build/plugins/vite-plugin-curl` 和 `specs/skills/001-skills-distribution`，先提出：

> 我们修改一下架构，将所有脚本都打包到dist/script中

随后中断上一轮，补充明确本轮边界：

> 我们修改一下架构，将所有脚本都打包到dist/script中 ，先不要实施，先修改spec

## 需求整理与替代关系

主线交付脚本集中到 `dist/script/`，包括安装入口和隐匿辅助脚本，不再将入口与辅助脚本分别放在 `dist/curl/install.sh` 和 `dist/curl/script/`。结合现有两个脚本的名称，本次规格将目标路径表述为 `dist/script/install.sh`、`dist/script/hidden-install.sh`；这两个完整路径是对用户目录要求和现有文件名的整理，不是额外用户原话。

“所有脚本”指主线交付所需的运行脚本；不据此恢复 `packages/skills/script/old/`、交付构建源码或测试工具，也不扩大正式技能白名单或支持平台。后续新增且纳入交付的运行脚本沿同一目录要求，不提前恢复暂缓的挂载实现。

技能正文及附件仍按既有规则交付到 `dist/skill/`，根 `dist/VERSION` 和统一版本来源保持。此处“打包到”表达脚本输出目录集中，沿用后续流水线统一归档的安排，不恢复插件独立压缩或新增脚本包。源码组织、包内映射、下载地址及调用接线留后续规划适配。

## 本轮范围

只修订已有 Spec、保存本输入及增量质量核查；不修改插件、模板或安装脚本，不生成构建产物、不执行安装或发布，不改变 Task 身份及工程 checkbox。Plan、Tasks、模型、契约、指南和派生分析中的旧路径尚未同步，后续规划须以最新 Spec 为准核对。

主线用户手写分工保持；紧急版继续自身源码、脚本、输出及既定交付路线，本轮不调整或启动其实施。上一轮中断前仅进行了只读探查和范围说明，没有实施产品代码。

## 后续规划与骨架授权（2026-11-18）

规格保存后，用户明确要求：

> 使用子代理执行 speckit-plan, 然后新增一个脚本vite插件

随后针对本次新增插件的范围，用户选择：

> 只新增插件骨架，迁移和接线留后续

本次据此由子代理增量同步已有 Plan 及其设计产物，然后新增 `vite-plugin-script` 的最小骨架，不迁移现有 curl 脚本、模板或输出，不注册到 Vite 配置。新插件后续承接脚本交付职责是规划方向，不能把未注册骨架记成 `dist/script/` 已实现；本次授权不扩大为完整 T077 实施、任务完成或发布。原“先修改 Spec”的操作范围记录保留其发生时语境，本节是后续新增授权。

## 后续任务同步与逻辑迁移授权（2026-11-18）

用户在骨架完成后继续要求：

> 使用子代理执行 speckit-task ，然后将 @packages/skills/build/plugins/vite-plugin-curl/index.ts 中的扫描并生成脚本的逻辑移动到 @packages/skills/build/plugins/vite-plugin-script/index.ts ，@packages/skills/build/plugins/vite-plugin-curl/hidden-install.template.ts 也移动到 packages/skills/build/plugins/vite-plugin-script

本轮将 `speckit-task` 对应到项目已有 `speckit-tasks` 技能，由子代理先增量同步原任务与必需的综合分析，随后迁移现有逻辑和模板。此次明确授权覆盖前轮留待后续的迁移动作，不再停留于骨架；仍只处理原 T077 的局部职责，不接管全部安装、隐匿协议、正式归档或发布工作。

沿已保存的统一目录规划，脚本插件承接扫描、模板派生及脚本资产交付，目标为 `dist/script/install.sh` 和 `dist/script/hidden-install.sh`；安装源 `install.source.sh` 暂留原目录复用，模板移入新插件目录。为使迁移后的实际构建继续交付脚本，协调者同步注册脚本插件、移除不再需要的 curl 虚拟入口；这是本次逻辑迁移的必要接线选择。curl 插件保留非脚本职责骨架，不引入发布数据的新实现，不执行生成的安装脚本。

## 安装入口职责纠正（2026-11-18）

用户随后追问：

> 不对啊 install.sh 是从哪里构建的

在协调者说明入口从现有 `install.source.sh` 原字节交付、读取与emit也被一起迁移后，用户明确要求：

> 将install.sh 的逻辑移动回 packages/skills/build/plugins/vite-plugin-curl

本节纠正前段由协调者扩大的迁移解释：curl 插件继续负责读取原目录的 `install.source.sh` 并交付安装入口；script 插件只承接技能扫描和隐匿模板派生，模板仍位于新插件目录。所有运行脚本输出到 `dist/script/` 的目录要求保持，入口仍输出为 `dist/script/install.sh`。统一输出目录不等于必须由同一插件生成全部脚本，不再以此前规划中的“script唯一生成全部脚本”覆盖用户本次明确分工。
