# 插件封装与集合配置调整原始输入

本页覆盖本轮可见表达；更早来源及结构迁移见[集合构建原始输入](2026-11-11-collection-build.md)。

用户要求：“每一个 plugin都写成组合函数的形式，所有的逻辑都写在 function的里面，不要再function外面声明变量、泛型、或者函数”。集合配置希望管理集合内skill，保留packageName、mcp，以skill映射存放hook、prompt、optional、priority及其他可能属性；command读取文件名、description读取文件内description，不重复维护。用户同时说明：“然后脚本要动态生成的，具体怎么生成我们后面在处理”。

后续澄清保留原意和纠正顺序：

1. 用户以hook下面列多个事件、技能层共享prompt/optional/priority的示例补充结构。
2. 对“skill映射是否决定集合要复制哪些技能？”答“是的”。
3. 说明同技能事件可能有不同提示词和optional后，用户答：“那就将 prompt 放到 kook的属性下面”。上下文将kook理解为hook，采用逐事件对象保留参数差异。

落地结构及工程选择见[讨论](../discussions/2026-11-11-plugin-skill-config.md)。不把未确定的生成规则记成用户已认可设计。
