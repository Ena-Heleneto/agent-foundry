# 流程图：主线技能构建与发布

## 一次构建共享同一份技能选择

构建选择是本轮允许交付的集合和技能名单。副作用由各自插件负责。

**代码位置** [Vite 配置](../../../packages/skills/vite.config.ts) · [扫描](../../../packages/skills/build/utils/scan-skills.ts) · [技能插件](../../../packages/skills/build/plugins/vite-plugin-skill/index.ts) · [引擎插件](../../../packages/skills/build/plugins/vite-plugin-engine/index.ts) · [隐匿插件](../../../packages/skills/build/plugins/vite-plugin-engine/sub-plugins/vite-plugin-hidden-install/index.ts) · [挂载插件](../../../packages/skills/src/workflow/plugin/vite-plugin-speckit-mount/index.ts)

```mermaid
flowchart TD
    entry["Vite 提供当次 mode；默认 production"]
    environment["Node 扫描函数接收 mode"]
    collection["先判断集合是否启用"]
    selection["筛选已启用技能并形成构建选择"]
    skills["复制技能与生成发布清单"]
    plugins["发现启用集合的插件"]
    hidden["派生隐匿候选"]
    mount["派生 Spec Kit 挂载材料"]
    entry --> environment --> collection --> selection
    selection --> skills
    selection --> plugins
    selection --> hidden
    selection --> mount
```

## 同目标串行准备与写入

版本表是安装器选包的依据。最后写表成功才登记新版本。ETag 是读取现有表时取得的对象标识，用它防止别人修改过的版本表被覆盖。

**代码位置** [测试入口](../../../.github/workflows/skills-deploy-release.yml) · [现行门禁](../../../.github/workflows/skills-test.yml) · [版本插件](../../../packages/skills/build/plugins/vite-plugin-version/index.ts) · [公共工作流](../../../.github/workflows/skills-deploy-common.yml)

```mermaid
flowchart TD
    tests["同一提交三组门禁通过"]
    queue["等待同目标的发布槽位"]
    build["构建取时并打包归档及入口"]
    version["从归档 VERSION 校验发布标识"]
    read["独立作业从 S3 下载旧表并在本地准备新表"]
    archive["条件创建归档并回读核验"]
    entry["写根入口并核对原字节"]
    register["按缺失或源 ETag 条件写表"]
    proof["回读同次对象并记录证据"]
    fail["终止本次部署并记录失败步骤"]
    tests --> queue --> build --> version --> read
    read -->|新表制品与源状态| archive --> entry --> register --> proof
    version -. 包内标识无效 .-> fail
    read -. 读取或验证失败 .-> fail
    archive -. 上传或校验失败 .-> fail
    entry -. 写入或校验失败 .-> fail
    register -. 条件冲突或写入失败 .-> fail
    proof -. 回读证据失败 .-> fail
```

后续发布在上一次释放目标槽位后读取表。测试环境的门禁和实际 S3 回读满足生产接入条件。公网安装按单独前置验收。

## 安装器核对同一个选中版本

选择一条记录后，版本标识和下载地址固定到该次安装。完整性校验先于项目写入。

**代码位置** [根入口生成](../../../packages/skills/build/plugins/vite-plugin-curl/index.ts) · [安装器源](../../../packages/skills/build/plugins/vite-plugin-curl/install.source.sh) · [同包引擎](../../../packages/skills/build/plugins/vite-plugin-engine/install.source.sh)

```mermaid
flowchart TD
    index["从对应环境读版本表"]
    choose{"有显式版本"}
    first["固定首条记录"]
    exact["精确匹配唯一记录"]
    archive["按记录地址下载到临时目录"]
    verify["校验 SHA-256 与字节长度"]
    version["隔离读取 VERSION 并核对时间戳"]
    project["写入项目并按参数调用引擎"]
    fail["报告原因，项目内容保持原样"]
    index --> choose
    choose -->|否| first
    choose -->|是| exact
    first --> archive
    exact --> archive
    archive --> verify --> version --> project
    index -. 无有效表 .-> fail
    exact -. 匹配失败 .-> fail
    archive -. 下载失败 .-> fail
    verify -. 值不匹配 .-> fail
    version -. 版本无效或不一致 .-> fail
```
