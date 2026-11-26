import type { Stmt } from 'sh-syntax/sync'
import { createSourceIndex, parse, print, walk } from 'sh-syntax/sync'

/**
 * 判断语句能否整体排成一行，保留复合语句体和 heredoc 的边界。
 * @param statement 需要检查的 Bash 语句。
 * @returns 语句及其管道或条件链可按一行输出时返回 true。
 */
function canFoldStatement(statement: Stmt): boolean {
  if (statement.redirs.some(redirection => redirection.hdoc))
    return false

  /**
   * 简单命令及其组合可以折叠，带语句体的命令由内部语句分别处理。
   */
  const command = statement.cmd
  if (command?.type === 'BinaryCmd')
    return command.x !== null && command.y !== null && canFoldStatement(command.x) && canFoldStatement(command.y)

  return command === null || ['CallExpr', 'DeclClause', 'LetClause', 'ArithmCmd', 'TestClause'].includes(command.type)
}

/**
 * 压缩 Bash 脚本的命令续行、普通注释和布局空白，保留字面量的值。
 * @param source 需要压缩的 Bash 源码。
 * @param options 压缩选项。
 * @param options.preserveHeaderLines 原样交付的头部行数，可用于保留协议标记。
 * @returns 压缩后的脚本内容，heredoc 仍保留数据所需的换行。
 */
export function minifyShellScript(source: string, { preserveHeaderLines = 0 } = {}): string {
  /**
   * 暂存头部行，以便在压缩正文后原样写回。
   */
  const lines = source.split('\n')
  /**
   * 保留协议头的脚本仅解析其后的正文。
   */
  const body = lines.slice(preserveHeaderLines).join('\n')
  /**
   * 解析语句和字面量，区分 Shell 注释与参数中的井号。
   */
  const script = parse(body, { keepComments: false })
  walk(script, (node) => {
    if (node.type !== 'SglQuoted' || node.dollar || !node.value.includes('\n'))
      return

    // 以 Bash 的转义形式保留多行单引号参数的值。
    node.dollar = true
    node.value = node.value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n')
  })

  /**
   * 将语法树上的 UTF-8 字节偏移转换为字符串索引。
   */
  const sourceIndex = createSourceIndex(body)
  /**
   * 保存互不重叠的语句替换，以便保留语句外的分隔符。
   */
  const replacements: { start: number, end: number, value: string }[] = []
  walk(script, (node) => {
    if (node.type !== 'Stmt' || !canFoldStatement(node))
      return

    /**
     * 语句在正文中的完整范围，包括重定向和可选的尾部分号。
     */
    const start = sourceIndex(node.start)
    /**
     * 语句结束位置不包含相邻语句。
     */
    const end = sourceIndex(node.end)
    /**
     * 仅重新打印跨行的命令。
     */
    const original = body.slice(start, end)
    if (!original.includes('\n'))
      return false

    /**
     * 由 Bash 语法打印器处理续行和命令替换。
     */
    const folded = print(node, { singleLine: true })
    /**
     * 打印独立语句时可能省略分号，嵌回原处时需要保留分隔。
     */
    const separator = original.endsWith(';') && !folded.endsWith(';') ? ';' : ''
    replacements.push({ start, end, value: folded + separator })
    return false
  })

  /**
   * 从文件末尾开始插入，前面各语句的索引仍指向原位置。
   */
  const foldedBody = replacements.sort((a, b) => b.start - a.start)
    .reduce((text, { start, end, value }) => text.slice(0, start) + value + text.slice(end), body)
  return [...lines.slice(0, preserveHeaderLines), print(foldedBody, { minify: true, keepComments: true })].join('\n')
}
