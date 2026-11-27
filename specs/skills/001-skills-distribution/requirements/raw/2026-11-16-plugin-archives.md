# 插件独立归档与变量位置的原始输入

日期：2026-11-16。来源：当前技能分发对话中可见的用户消息，按出现顺序摘录；未取得宿主会话/轮次 ID，不编造精确时间。本文保留原话，实际实现与取舍整理见 [规格](../../spec.md) 和 [curl 交付契约](../../contracts/curl-delivery.md)。

- “我们现在遇到一个问题,我想让不同的vite插件之间隔离开，然而构建成一个产物包的化需要skill和script在同一个目录，我们可以打成两个产物包，一个脚本包，一个skill包，然后在 install.sh 中 分别下载”
- “我们应该怎么做，再哪个生命周期中处理。我们先处理 packages/skills/build/plugins/vite-plugin-skill/index.ts”
- “帮我实现一下”
- “咋这么多参数”
- “相同内容重复打包，哈希也一致 是什么意思”
- “不对吧，我们不是每次构建都重新构建新产物嘛”
- “修复构建压缩包参数”
- “不对啊，你改了什么，@packages/skills/dist/skill.tar.gz 生成在 @packages/skills/dist/skill 目录下”
- “@packages/skills/build/plugins/vite-plugin-curl 也做压缩更改”
- “const execFileAsync = promisify(execFile) 这个东西是什么”
- “不要在插件函数外面声明别的变量”
- “同步spec”

以上授权范围为对话中逐步指定的局部实现与本次资料同步，不视为完整 Task 验收、安装调用已接通或发布授权。
