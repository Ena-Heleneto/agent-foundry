import { cpSync, mkdirSync } from 'node:fs'

/**
 * 按公开出口复制两个共享预设，不编译或执行技能资产。
 */
for (const name of ['eslint-config', 'tsconfig-json']) {
  mkdirSync(new URL(`../dist/${name}/`, import.meta.url), { recursive: true })
  cpSync(new URL(`../src/${name}/`, import.meta.url), new URL(`../dist/${name}/`, import.meta.url), { recursive: true })
}
