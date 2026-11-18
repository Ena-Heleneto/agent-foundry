import { readFile } from 'node:fs/promises'

export async function readPackageVersion(): Promise<string> {
  const packageJson: { version: string } = JSON.parse(
    await readFile(new URL(import.meta.resolve('#package.json')), 'utf8'),
  )
  return packageJson.version
}
