# 集合脚本扫描与复制（2026-11-18）

## 用户原话与确认

> 我想想 @packages/skills/src/workflow/collection.config.ts 只用来声明skill，不涉及其他的工具，在顶层新增一个字段，script，属性是一个字符串或者数组或者boolean，默认是flase，在@packages/skills/src/workflow 目录下新增一个目录script，如果 script字段为true，vite插件将script目录下的脚本复制到dist/script目录下，这样就解耦了

协调者针对字符串和数组提出：相对于集合内script/目录的文件路径；true递归复制整个目录，未配置或false不复制。用户明确选择：

> 按相对文件路径选择

## 本次确认范围

集合配置保留技能声明及通用交付开关，不再存放工具专属hook或command。顶层script支持boolean、字符串和字符串数组，默认false；workflow设置true，并建立同级script/目录。true递归交付目录内普通文件，字符串/数组只选择明确文件，保留相对目录层级，输出到共享dist/script/。不支持glob；缺失的明确来源、不安全路径、链接和重复输出报错，不覆盖其他集合或既有生成资产。目录占位.gitkeep不作为交付文件。

脚本插件独立扫描集合配置及目录，用Vite资产交付原字节，不解释或执行脚本内容。本次只实现通用复制能力及配置整理，不编写Speckit挂载业务；目录先用.gitkeep保留，实际脚本后续由用户维护。入口仍由curl插件交付，已有hidden生成仍保持，紧急版不变。

此方向替代本次讨论中“在集合技能项中声明hook/command，再动态生成Speckit挂载脚本”的主线方案。旧配置的hook原文在当前Git基线保留，本会话新增command已由用户明确改向；不改写历史需求或紧急版定义。本次不改变Task身份/依赖/checkbox，不自动实现安装、挂载或发布。

## 后续配置与实现纠正

用户随后要求：

> @packages/skills/utils/define-collection-handle.ts 使用defu整合默认配置和传入配置

> 移除 packages/skills/build/utils/scan-scripts.ts

当前配置使用 defu 合并传入值与 script: false 默认值；扫描器、对应测试和插件复制接线已移除。上节“实现通用复制能力”保留其当时语境，不能作为当前复制能力已交付的依据；通用复制仍为需求。

## 独立 Speckit 脚本与逐项实施

用户先要求在 workflow/script 下新建 Speckit 挂载脚本，随后梳理五项技能的职责和触发时机，再明确：

> emm，可以了，我们写一个挂在脚本吧 packages/skills/src/workflow/script/speckit-mount.sh

讨论整理的挂载关系为：implementation-preparation 对应 before_implement，artifact-spec-analysis 对应 after_tasks，artifact-project-description 对应 after_converge；task-increment 由 speckit.modes.increment 正式入口调用，规划保存后显式复用分析能力；bug-report 按用户报告诉求手动使用。结案描述仍以真实验收完成为前置，执行 Converge 本身不代表结案；不新增 after_increment。

Agent 随后一次扩展了环境预检、CLI 预演、冲突保护、整套注册与测试。用户中断并纠正：

> 等等，为什么写这么多，先撤回，我们一个一个实现

已撤回该次实现和新增测试、局部方案文档，speckit-mount.sh 恢复为两行 Bash 骨架。上述挂载关系是已讨论方向，不是已实现或验收事实；此次 Agent 自行扩展的实现细节不作为用户新增认可。后续一次处理一项，不恢复配置内工具定义或接管未请求的插件工作。

用户本轮要求：

> 我们先将目前的内容同步到spec

本轮仅同步既有规格及上述来源，不继续实现脚本、不生成任务或改变工程 checkbox。
