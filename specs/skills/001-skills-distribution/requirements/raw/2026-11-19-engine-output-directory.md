# 引擎子插件产物目录

2026-11-19，来源为当前可见会话中的用户请求。

> @packages/skills/build/plugins/vite-plugin-engine/index.ts 引擎启动的插件生成物移动到 dist/engine 目录下

## 后续统一调用入口

2026-11-19，来源为当前可见会话中的后续用户请求。

> @packages/skills/build/plugins/vite-plugin-engine/index.ts 这个插件生成一个脚本，内容是调用子插件生成脚本，这个脚本由 @packages/skills/build/plugins/vite-plugin-curl/install.source.sh 调用

## 2026-11-20 缺安装源文件的失败要求

来源为当前可见会话。上一轮测试说明缺少 `install.source.sh` 时构建会报错、旧 dist 已被清空，用户随后确认：

> 报错就可以了，还需要别的操作吗

## 2026-11-20 构建压缩与安装调度

2026-11-20，来源为当前可见会话中的后续用户输入。

> 我的意思是工具处理用来复制的源脚本文件，不是动态生成的脚本模板文件

> @packages/skills/build/plugins/vite-plugin-curl/install.source.sh 我们这个地方不去调取某个指定的子脚本产物，而是统一调用引擎入口脚本，将参数传递到引擎入口

> 我们不在 @packages/skills/build/plugins/vite-plugin-curl/install.source.sh 中做函数检查处理

> 逻辑都写到默认导出的函数中，我想这个文件只有一个函数，不要直接写成闭包，将逻辑合理的写到函数中

> 将目录参数和相关的逻辑移除，这是内部插件，不需要这些逻辑

> @packages/skills/build/plugins/vite-plugin-curl/index.ts install.sh 没有使用格式化工具

> 同步spec
