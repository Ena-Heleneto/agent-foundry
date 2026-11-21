import { readFileSync } from 'node:fs'

/**
 * 将本次自动挂载的脚本路径写入引擎入口的 Bash 源码。
 *
 * @param scripts 已按稳定顺序排列的 engine 内相对脚本路径。
 * @returns 协调可选隐匿及自动挂载的 Bash 入口。
 * @throws 源脚本读取失败或缺少唯一的挂载列表时抛错。
 */
export function createEngineInstallScript(scripts: string[]): string {
  /**
   * 引擎运行逻辑在同目录的 Bash 源脚本中维护。
   */
  const source = readFileSync(new URL('./install.source.sh', import.meta.url), 'utf8')
  /**
   * 空数组所在行是自动挂载路径的唯一插入位置。
   */
  const sections = source.split(/^scripts=\(\)$/mu)
  if (sections.length !== 2)
    throw new Error('引擎 install.source.sh 必须恰好包含一行 scripts=()')

  /**
   * 每条路径作为一个 Bash 字面量，保留文件名中有特殊含义的字符。
   */
  const scriptList = [
    'scripts=(',
    ...scripts.map(script => `  '${script.replaceAll('\'', '\'\\\'\'')}'`),
    ')',
  ].join('\n')
  return sections.join(scriptList)
}
