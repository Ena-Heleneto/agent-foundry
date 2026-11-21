import { Buffer } from 'node:buffer'
import { parse, stringify } from 'yaml'

/**
 * 复用已校准的 Eve v1 元数据格式，其余 Agent 保留原字节；不选择运行时 CLI 版本。
 * @param files 相对文件路径与 base64 字节。
 * @param agent 目标 agent 标识。
 * @returns 不修改输入的安装文件投影；Eve 的 YAML 输出须经真实 CLI 校准。
 */
export function projectFiles(files: Record<string, string>, agent: string): Record<string, string> {
  return Object.fromEntries(Object.entries(files).map(([file, encoded]) => {
    if (agent !== 'eve' || file.split('/').at(-1)?.toLowerCase() !== 'skill.md')
      return [file, encoded]
    /**
     * 官方对 Eve 的各层 SKILL.md 均执行相同 frontmatter 转换。
     */
    const raw = Buffer.from(encoded, 'base64').toString('utf8')
    /**
     * 不含 frontmatter 的文档仍保留正文，处理方式与官方一致。
     */
    const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u)
    /**
     * YAML 解析结果必须先缩窄类型。
     */
    const parsed: unknown = match ? parse(match[1]!) : {}
    if (parsed !== null && (typeof parsed !== 'object' || Array.isArray(parsed)))
      throw new Error(`Eve 元数据必须是对象：${file}`)
    /**
     * 只有对象类型进入逐字段转换。
     */
    const data = (parsed ?? {}) as Record<string, unknown>
    /**
     * 按官方顺序生成元数据，保留原本正文。
     */
    const metadata: Record<string, unknown> = {}
    /**
     * 这三个字段只接受字符串，顺序与官方转换保持一致。
     */
    for (const key of ['name', 'description', 'license']) {
      if (typeof data[key] === 'string')
        metadata[key] = data[key]
    }
    if (data.compatibility !== undefined)
      metadata.compatibility = data.compatibility
    if (typeof data.version === 'string' || typeof data.version === 'number')
      metadata.version = data.version
    if (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata))
      metadata.metadata = data.metadata
    /**
     * 官方移除正文首个换行，并使用 YAML 而不是 JSON 序列化头部。
     */
    const content = (match?.[2] ?? raw).replace(/^\r?\n/u, '')
    /**
     * 空元数据不生成空的 frontmatter。
     */
    const projected = Object.keys(metadata).length ? `---\n${stringify(metadata).trimEnd()}\n---\n${content}` : content
    return [file, Buffer.from(projected).toString('base64')]
  }))
}
