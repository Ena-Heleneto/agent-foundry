# 引擎子插件产物目录

2026-11-19，来源为当前可见会话中的用户请求。

> @packages/skills/build/plugins/vite-plugin-engine/index.ts 引擎启动的插件生成物移动到 dist/engine 目录下

## 后续统一调用入口

2026-11-19，来源为当前可见会话中的后续用户请求。

> @packages/skills/build/plugins/vite-plugin-engine/index.ts 这个插件生成一个脚本，内容是调用子插件生成脚本，这个脚本由 @packages/skills/build/plugins/vite-plugin-curl/install.source.sh 调用

## 2026-11-20 缺安装源文件的失败要求

来源为当前可见会话。上一轮测试说明缺少 `install.source.sh` 时构建会报错、旧 dist 已被清空，用户随后确认：

> 报错就可以了，还需要别的操作吗
