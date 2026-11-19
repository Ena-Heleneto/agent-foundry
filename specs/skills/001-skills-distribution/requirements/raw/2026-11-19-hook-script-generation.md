# 集合挂载声明与 hook 脚本生成（2026-11-19）

来源为本会话可见用户输入，以下原话按出现顺序保存：

> 我想想，我们扫描了集合中的skill，可能需要在配置中标注skill在哪个hook中啥的 packages/skills/src/workflow/collection.config.ts ，我们讨论下

> emm，补全配置文件中的声明

> bug-report 不是要挂载成指令吗

> 补全根据读取到的配置中skill的hook配置生成脚本

本次重新允许集合技能项声明 hook 和 command，替代此前集合配置不涉及工具专属声明的限制；bug-report 应有命令入口。最后一条实施请求限定按 hook 配置生成脚本，command 已有声明，其生成不因本次局部请求自动完成。具体局部方案及实际结果沿原 [T077](../../implementation/T077.md) 保存。

## 后续入口路径纠正

> @packages/skills/build/plugins/vite-plugin-curl/index.ts有问题 install.sh 打在dist/curl/install.sh路径

当前源码及刚构建的入口均在 dist/script/install.sh，协调者据此将本条理解为指定改到 dist/curl/install.sh，并在过程说明中明确该理解后实施。只调整安装入口，隐匿与 Speckit 辅助脚本仍在 dist/script；旧统一脚本目录的要求对入口由本条覆盖，其余范围不扩大。

## 后续移除 bug-report

> emm，我们先移除bug report的skill和配置还有挂载逻辑·

按本会话正在修改的主线范围执行：移除 packages/skills 的 bug-report 正文、集合 command 声明和开发挂载脚本复制名单，并同步主线说明；该命令尚无独立生成实现，不创建额外卸载器。紧急版冻结来源及其安装副本保留，历史需求和验证证据不追溯改写。

## 后续补全 Increment 命令生成

> 补全其他的plugin逻辑

协调者说明 Speckit 剩余命令与所有主线插件涉及不同范围，用户通过宿主文本选择：

> 先补齐 Speckit 的 Increment 命令生成

本条只授权当前 Speckit 插件消费 Increment 的 command 声明并生成注册材料，不扩大为其他主线构建插件、完整下载安装或发布实施；主线 bug-report 保持移除。
