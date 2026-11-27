import { readFile } from 'node:fs/promises'

/**
 * 从指定包清单取得版本，默认使用当前技能包。
 * @param manifest 包清单的绝对路径或文件 URL。
 * @returns 包声明的版本。
 */
export async function readPackageVersion(
  manifest: string | URL = new URL(import.meta.resolve('#package.json')),
): Promise<string> {
  /**
   * 版本值直接取自当前清单。
   */
  const packageJson: { version: string } = JSON.parse(
    await readFile(manifest, 'utf8'),
  )
  return packageJson.version
}
