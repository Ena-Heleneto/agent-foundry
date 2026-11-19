import type { CollectionSkillOption } from '#utils/define-collection-handle'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse, stringify } from 'yaml'

/**
 * 挂载材料所需的技能身份、源目录和集合声明。
 */
interface MountSkill {
  name: string
  source: string
  config: CollectionSkillOption
}

/**
 * 将文本作为单个 Shell 字面量引用，防止提示词中的引号和命令替换被执行。
 *
 * @param value 要嵌入的原始文本。
 * @returns Bash 单引号字面量。
 */
function quoteShell(value: string): string {
  return `'${value.replaceAll('\'', '\'\\\'\'')}'`
}

/**
 * 读取源技能描述并生成引用目标项目已安装技能的命令文件。
 *
 * @param skill 含 command 声明的技能，未声明时返回空值。
 * @returns 官方命令元数据、文件内容及目标项目内的技能路径。
 */
async function createCommand(skill: MountSkill) {
  if (skill.config.command === undefined)
    return
  /**
   * 命令名同时决定扩展 ID 和文件名，只接受官方规范形式。
   */
  const match = /^speckit\.([a-z0-9-]+)\.([a-z0-9-]+)$/u.exec(skill.config.command)
  if (!match)
    throw new Error(`非法命令名称：${skill.config.command}`)
  /**
   * 正文只在构建期读取，不把源机器路径带到运行项目。
   */
  const body = await readFile(join(skill.source, 'SKILL.md'), 'utf8')
  /**
   * 支持 LF 和 CRLF frontmatter，不将技能业务复制到命令正文。
   */
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(body)
  /**
   * 官方命令描述必须来自源元数据，缺失或空值直接拒绝。
   */
  const metadata = frontmatter ? parse(frontmatter[1]) as { description?: unknown } | null : null
  if (typeof metadata?.description !== 'string' || !metadata.description.trim())
    throw new Error(`技能 ${skill.name} 缺少有效 description`)
  /**
   * 当前支持的项目级 Codex 安装路径，运行前核对该引用实际存在。
   */
  const skillFile = `.agents/skills/${skill.name}/SKILL.md`
  return {
    extensionId: match[1],
    name: skill.config.command,
    file: `commands/${match[2]}.md`,
    description: metadata.description,
    skillFile,
    content: `---\n${stringify({ description: metadata.description })}---\n\n完整读取项目内的 ${skillFile}，遵循该技能及其所需附件处理本次请求。\n\n本入口只调用已安装技能一次，不复制另一套业务；若本次调用已执行该技能则沿用结果，源技能不得再次调用本入口。\n\n用户输入：$ARGUMENTS\n`,
  }
}

/**
 * 将启用技能的 hook 和 command 配置嵌入单个 Bash，运行时准备官方输入并注册。
 * JSON 作为 YAML 子集保存参数原值；没有有效挂载声明时返回空串。
 *
 * @param skills 已扫描的技能及原始配置。
 * @returns 可由 Bash 执行的自包含脚本，或无有效声明时的空串。
 */
export async function createSpeckitMountScript(skills: readonly MountSkill[]): Promise<string> {
  /**
   * 任何官方注册前先核对命令引用，避免缺件时先写入部分 hook。
   */
  const prechecks: string[] = []
  /**
   * 每个声明独立准备扩展目录，CLI 失败时由 set -e 停止后续注册。
   */
  const registrations: string[] = []
  for (const skill of skills) {
    /**
     * 禁用技能不读取元数据，也不生成命令或事件。
     */
    const { name, config } = skill
    if (!config.enabled)
      continue
    if (!/^[a-z][a-z0-9-]*$/u.test(name))
      throw new Error(`非法挂载技能名称：${name}`)
    /**
     * 有命令声明时从源正文读取描述并准备命令输入。
     */
    const command = await createCommand(skill)
    /**
     * 显式禁用的事件不进入扩展，其余参数原样保留。
     */
    const hooks = Object.fromEntries(Object.entries(config.hook ?? {})
      .filter(([, options]) => options.enabled !== false)
      .map(([event, options]) => [event, { ...options, command: command?.name ?? name }]))
    if (!command && Object.keys(hooks).length === 0)
      continue
    /**
     * 命令按声明使用命名空间，纯 hook 沿用技能身份。
     */
    const extensionId = command?.extensionId ?? name
    /**
     * 原 hook 参数保持，命令文件独立放入官方 provides 声明。
     */
    const manifest = {
      schema_version: '1.0',
      extension: { id: extensionId, name: extensionId, version: '1.0.0', description: '工作流技能挂载' },
      requires: { speckit_version: '>=1.2.6' },
      provides: command ? { commands: [{ name: command.name, file: command.file, description: command.description }] } : {},
      hooks,
    }
    registrations.push(`mkdir -- "$temporary_root/${extensionId}"`)
    if (command) {
      prechecks.push(`[[ -f ${quoteShell(command.skillFile)} ]] || { printf '%s\\n' ${quoteShell(`缺少已安装技能：${command.skillFile}`)} >&2; exit 1; }`)
      registrations.push(
        `mkdir -- "$temporary_root/${extensionId}/commands"`,
        `printf '%s' ${quoteShell(command.content)} > "$temporary_root/${extensionId}/${command.file}"`,
      )
    }
    registrations.push(
      `printf '%s\\n' ${quoteShell(JSON.stringify(manifest))} > "$temporary_root/${extensionId}/extension.yml"`,
      `specify extension add --dev "$temporary_root/${extensionId}"`,
    )
  }
  if (registrations.length === 0)
    return ''

  return [
    '#!/usr/bin/env bash',
    '# 在已初始化的目标项目根运行；注册 hooks 和命令，不执行技能业务。',
    'set -euo pipefail',
    '[[ -d .specify ]] || { printf "%s\\n" "请在已初始化的 Spec Kit 项目根运行" >&2; exit 1; }',
    ...prechecks,
    `temporary_root="$(mktemp -d "\${TMPDIR:-/tmp}/foundry-hooks-XXXXXXXX")"`,
    'trap \'rm -rf -- "$temporary_root"\' EXIT',
    'trap \'exit 130\' INT',
    'trap \'exit 143\' TERM',
    ...registrations,
    '',
  ].join('\n')
}
