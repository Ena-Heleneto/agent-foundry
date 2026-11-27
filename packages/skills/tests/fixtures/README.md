# 独立回归夹具

fixture从原仓库迁移时的实际文件复制，避免测试依赖私人.specify或业务应用。来源Git提交为c598a40771c0f86e7f7c1bf7d99fca215148f872。

- specify/.specify：公开脚本、plan/tasks核心模板及覆盖；GitHub Spec Kit部分与安装渲染保留MIT，见根licenses/SPEC-KIT-MIT.txt，自有增补沿ISC。
- foundry-dev：原初始化Bash入口及hooks包装，用于历史编排回归；不在新根postinstall执行。

这些材料保持原字节，单独排除格式改写。新测试代码仍接受正常检查，夹具存在不表示真实安装或外部宿主验收通过。
