# T103：TV-10 隔离候选与输入

日期：2026-11-10。对应[原Task](../../../../tasks.md#t103)及[已讨论实施方案](../../../../implementation/T103.md)。本目录是最小候选和证据，不是packages/skills生产来源，也不构成T104交付。

## 已实际准备

临时根为/tmp/foundry-tv10-20261110，seed项目由已有Specify CLI 1.2.6使用init、codex skills集成、sh脚本和non-interactive参数实际生成。原生Implement入口保留官方字节；CLI版本输出和初始化记录在raw/specify-version.log与raw/init-baseline.log，init-options实际声明1.2.6。

官方skills@1.7.4下载首先因沙箱DNS返回EAI_AGAIN，按环境工具授权联网取得，实际版本查询为1.7.4。官方包位于临时npm-cache的_npx目录，以包自身元数据和CLI核对，不修改真实项目依赖。官方来源安装的状态目录采用该固定版实际支持的XDG_STATE_HOME放在临时根，遥测关闭，项目来源仍由官方CLI安装。

本轮先执行无候选对照，之后才写[candidate/implementation-preparation/SKILL.md](candidate/implementation-preparation/SKILL.md)和同目录hook配置。候选无脚本、模板或额外附件，正文执行目标项目治理，不引入个人路径、状态服务或另一套规则。

## 无指导对照

control-no-guidance从seed复制原生入口，独立初始化Git，不含候选、有效宪章或准备hook。演示Spec为specs/demo/001-order；T001计算整数分小计，T002后续加运费。order.py起始只有模块说明，test_order.py只验证T001，未给任何Task保存认可方案。实际输入为“$speckit-implement specs/demo/001-order T001。”。

第一次Codex在外层沙箱中无法初始化app-server，退出1，事件为0、业务文件无变化；这是环境错误，不计RED或停止通过。通过工具授权在外层沙箱外启动宿主后，被测Codex仍使用workspace-write并固定临时工作根，第二次实际完成T001、写order.py并勾选T001，T002保持待办。原始工具轨迹30项事件、结果与摘要在raw/control-no-guidance-attempt-2，首次错误另保留在raw/control-no-guidance。宿主日志曾有模型列表刷新超时，但实际执行随后完成、退出0。

这是无指导对照的RED，证明该输入在原生无准备条件下会实际实施；它不是带有效宪章和候选的正常环境结果，也不抵扣后续TV-10。候选复验须用干净项目，不能拿已被对照实现的业务代码继续测试缺方案。

## 执行与判读

临时prepare_case.py从官方seed创建独立场景，run_case.py启动真实codex exec、保留原始JSONL/错误/最终回复、业务及原Task前后摘要，重复执行保存新attempt目录。它们仅为本次验证夹具，不进入分发运行核心；证据不把最终回答当全文加载或文件保护的替代。

后续每例记录治理是否存在、候选来源/安装及实际读取、hook配置、输入、实际业务文件/checkbox差异、预期/实际及限制。样例A的正向实现仍须用户真实认可其自身方案；本Task的“开始”不提供该认可。未测或失败均不勾选T103；实际汇总将保存在[TV-10结果](../../tv-10-preparation.md)，结果文件写成前不将此链接当验收已存在。

## 第三轮补齐

[当前验收](../../tv-10-preparation.md#第三轮补齐与当前验收2026-11-10)、[结果索引](round3-results.json)、[第三轮原始归档](retained-round3.tar.gz)和[新样例真实共同认可](proposals/shared-contract-approval.json)补齐来源故障、保存/恢复、实际并行、实质变化及撤回续做。前两轮档案不覆盖、不改写；T104仍须复验最终来源。
