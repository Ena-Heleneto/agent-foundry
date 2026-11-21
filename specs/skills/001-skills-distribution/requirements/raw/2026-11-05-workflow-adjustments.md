@specs/skills @specs/skills/001-skills-distribution @specs/skills/20261029-speckit-workflow-foundation
关于模式，我们有一些小小的想法的调整，这次基于现实场景出发，涉及到 explore guide tutor 等多个改动
我们需要讨论需求，并生成两个spec的追加提示词，同时在spec中落盘原始需求提示词文件到原始需求目录
修改宪章时要同步修改宪章提示词

需求讨论
以项目目标和客观事实为准绳，理性审视需求与未来构想，独立思考、不盲从、不迎合，敢于质疑、充分辩论，允许观点激烈碰撞，主打一个有理有据、战斗爽！

explore 探索式开发的描述并不明确，我们需要修改skill内容和命名
这是一种对我们来说很基本的一种协作方式，是按照我的的思维模式推进
使用方式是 $speckit-mode-explore [任务] [想法或者逻辑或者思路],默认不创建子任务
比如我们现在有一个实现一个页面的task，然后使用 $speckit-mode-explore 大概会是这样
先帮我设计一下数据库 -> 感觉不太行，调整一下 -> 写curd -> 然后在前端注册接口 -> 然后写header组件 -> 等等等
这个实现逻辑中大概率不会按照task的顺序，所以我们需要记录我们的实现思路和根据我们的思路记录task的状态

新增指令,阶段性muv指令，我还没想好命名，帮我命名
这个指令存在大量的逻辑，定位问题，我们需要讨论一下需求
它通常在plan阶段后使用 $speckit-mode-[指令]
如果spec中不存在plan和task，提示先plan
如果spec中存在plan但是没有task，则替代speckit-task生成task，同时在plan中追加阶段mvu
如果spec中存在plan和task，则在plan中追加阶段mvu，同时修改task
他的场景是为了解决当我没有实现思路时，为我提供实现思路，可以参考explore中我对场景的举例
值得注意的是，ai的task顺序往往和我的实现思路中的实现顺序出现较大出入，我们需要讨论一下这是为什么，在这个指令中，我们要尽可能避免
但是最近的开发过程中存在另一种场景
在实现过程中，我可能有大的muv，但是实现过程并不清晰，这也是之前的实现子任务的原因，但是子任务的效果并不理想
而且阶段性mvu与子任务的权责冲突了，我觉得可以移除子任务了
我觉得我们可以将指令的权责放宽 $speckit-mode-[指令] [task]，基于任务创建mvu，并修改plan和task

guide 引导式开发的定位也不再清晰，如果我们已经通过上面的阶段性muv指令生成了mvu，我们就可以通过explore的方式实现了

tutor 导师协作模式，我们需要重构这个模式，并将这个模式加到本期的测试范围，移除 review复盘模式，删除review skill和自动化注册逻辑
移除这个模式原有的子任务逻辑，重写导师逻辑
使用方式是 $speckit-mode-tutor [task]
当使用这个指令后，将对应的task提升成muv，并修改task，task拓展逻辑大概和之前的子任务逻辑相同
整理知识点啥的，我的思路不太清晰，我们需要讨论一下
在每次对话或者task中的小项结束，生成片段式的知识索引，在task结束后，与我一同在归档项目中写学习报告

修改宪章
在每次对话时，生成对话记录，注意，这与tutor模式的知识索引并不相同，我想要记录并生成我的画像
我希望ai可以尽可能符合我的逻辑思维与我协作

修改宪章
spec中的文件要按照权责分别放在不同的目录，尤其是我们自己生成的文件

移除钩子
artifact-issue-description 、 artifact-pr-description 、mvu-gate 、artifact-business-flow 、artifact-logic-flow 、explainer-doc-sync 的skill和脚本自动化挂载逻辑

新增spec分析钩子
我们新增一个生命周期钩子来替换之前的 artifact-logic-flow，在after-task中触发
我们在task环节后，根据我们的muv 、 plan 、task 结合需求提示词 生成一个 spec分析文档
包括 业务分析 ，业务流程图，技术分析，技术流程图，muv里程碑，里程碑流转图
当文件内容过多时，将生成目录和索引目录文件，将不同的内容放置到不同的文件

主线spec @specs/skills/20261029-speckit-workflow-foundation
当 @specs/skills/20261029-speckit-workflow-foundation 完成后，@specs/skills/001-skills-distribution 验收 tutor和阶段性muv指令
我将新增一个基础的业务spec验收explore，其他的需求跟随 @specs/skills/20261029-speckit-workflow-foundation验收

WE ARE THE ONE
