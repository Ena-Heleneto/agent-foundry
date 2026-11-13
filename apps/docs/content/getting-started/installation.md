---
title: 安装指南
description: 准备开发环境，区分本地技能副本与正式分发安装。
---

## 环境要求

使用Node至少22.20.0和pnpm12。Python应用要求Python至少3.12及uv。推荐使用仓库mise.toml准备工具；Nuxt Content使用Node原生SQLite，不需要外部数据库。

## 在本地运行

进入你已克隆的Agent Foundry仓库根目录：

```bash
pnpm install
pnpm dev
```

打开 http://localhost:3005 。安装过程构建共享预设并准备Nuxt；不会自动修改其他项目、注册hooks或发布技能。

## 生成当前仓库技能副本

```bash
pnpm skills:link
```

该命令从紧急版九项正式技能来源生成当前仓库的.agents/skills副本，不安装eval样本。它用于本地开发，不等于向任意目标项目完成正式安装、hooks或Increment挂载。

## 正式分发安装

公开发布来源尚未提供。紧急版采用官方skills安装与同版公共脚本显式挂载两步，必须使用同一已核验版本的完整材料；不要以含eval的开发仓库根作为正式整包安装来源。

完整契约维护在仓库packages/skills-distribution-urgent/README.md。Linux x86_64、Codex和项目级是当前已验证范围；其他平台与全局安装不由本指南承诺。

## 构建与检查

```bash
pnpm build
pnpm lint
pnpm check-types
```

主线目前保留用户手写中间态，存在既有lint问题。严格候选另用pnpm build:candidate，要求实际输入已提交；不自动创建Git提交或绕过来源保护。
