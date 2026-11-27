# 按职责拆分插件与构建依赖讨论

日期：2026-11-11。来源为当前会话，尚未形成新的已认可实施方案，也没有重开T072。

## 用户方向与澄清

用户希望把扫描src及输出子目录、按集合mcp配置复制、复制集合技能、准备集合内特定目录分别组织为插件，并询问有先后依赖时怎样处理并行。随后明确特定目录名为script，用于“挂载脚本啥的”。脚本是手写维护还是由hooks生成、具体生成规则和MCP内容均未确定，不能据此恢复旧生成逻辑或立即扩改源目录。

## 本轮查证与纠正

通过Context7查询当前Vite官方插件顺序和接口；Rolldown接口页仍有来自Rollup的parallel分类，而ObjectHook及兼容差异页明确说明当前顺序行为。因此上一轮直接说当前buildStart/writeBundle允许跨插件并行过于笼统，需要按实际版本纠正。

本轮在自有/tmp工程实测Vite 8.3.6实际依赖Rolldown 1.2.16：插件A的async buildStart等待30ms后结束，才执行插件B的buildStart；writeBundle同样是A等待完成后才执行B。初次探针仅因从pnpm软链路径定位依赖失败，修正为Vite真实安装路径后完成测试；未以失败定位结果判断钩子语义。未修改真实配置或dist。

权威来源：[Vite插件顺序](https://github.com/vitejs/vite/blob/v8.3.5/docs/guide/api-plugin.md#plugin-ordering)、[Rolldown顺序执行说明](https://rolldown.rs/apis/plugin-api#sequential-hook-execution)、[ObjectHook](https://rolldown.rs/reference/TypeAlias.ObjectHook)。order/enforce会影响具体排序，不能把数组位置理解为整个插件先后跑完。

## 讨论中的职责与数据关系

- 扫描插件先发现集合根和配置，提供本次构建的内存上下文；若script稍后生成，不提前冻结会漏掉新增文件的完整文件表。
- script准备若为集合复制的输入，必须先完成，再枚举并复制集合；若脚本插件独立交付产物，则按真实输入依赖判断是否可以并行。
- 技能资产与MCP资产在只读取同一份集合信息、目标路径不同且互不依赖时可并行；若MCP读取实际dist技能输出，则须等对应写出完成，不能仅据名称认为独立。
- 资产优先通过Vite产物API提交，最终由Vite写出。只为生成空目录的mkdir放写出后，避免在buildStart提前建立dist又被清理。
- 如要可控并行，可以由组合/协调插件在同一阶段await Promise.all调用各职责模块的准备函数，汇合后统一提交；这是自定义调度设计，不是Vite自动按依赖图并行的功能，也不应手工调用其他插件完整生命周期。

上述是待讨论建议，尚未写插件、创建script目录或实现MCP内容；不把用户的概念询问当作对未确定脚本生成规则的认可。
