import type { Plugin } from 'vite'
import type { CollectionOption } from '#utils/define-collection-handle'
import { globSync, readdirSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

async function parseCollectionOption(dir: string) {
  const _dir = pathToFileURL(join(dir, 'collection.config.ts')).href
  const collectionModule: { default: CollectionOption } = await import(_dir)
  const content = collectionModule.default
  const { packageName, skill } = content
  const enabledSkills = Object.entries(skill)
    .filter(([, option]) => option.enabled)
    .map(([name]) => ({ name, url: join(dir, name) }))
  return { collection: packageName, enabledSkills, url: join('dist', 'curl', 'skill', packageName) }
}

export default function vitePluginSkill(): Plugin {
  const virtualId = 'virtual:skill'
  const resolvedId = `\0${virtualId}`

  const sourceDir = join(process.cwd(), 'src')
  const entity = readdirSync(sourceDir, { withFileTypes: true })
    .filter(entry => !entry.isSymbolicLink())
    .filter(entry => entry.isDirectory())
    .map(entry => ({ name: entry.name, path: join(sourceDir, entry.name) }))
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)

  const availableSkills = new Set(globSync('*/*/SKILL.md', { cwd: sourceDir })
    .map(file => dirname(join(sourceDir, file))),
  )

  return {
    name: 'vite-plugin-skill',
    apply: 'build',

    config: () => ({ build: { rolldownOptions: { input: { installer: virtualId } } } }),

    resolveId(id) {
      if (id === virtualId)
        return resolvedId
    },

    load(id) {
      if (id === resolvedId)
        return `consola.info('Hello from virtual entry!')`
    },

    generateBundle(_options, bundle) {
      Object.entries(bundle).forEach(([fileName, output]) => {
        if (output.type === 'chunk' && output.isEntry && output.facadeModuleId === resolvedId) {
          delete bundle[fileName]

          if (output.sourcemapFileName)
            delete bundle[output.sourcemapFileName]
        }
      })
    },

    async writeBundle() {
      const collections = await Promise.all(entity.map(({ path }) => parseCollectionOption(path)))
      const selectedSkills = collections.flatMap(({ collection, enabledSkills, url }) =>
        enabledSkills
          .filter(skill => availableSkills.has(skill.url))
          .map(skill => ({ collection, name: skill.name, source: skill.url, target: join(url, skill.name) })))

      await Promise.all(selectedSkills.map(({ source, target }) => cp(source, target, { recursive: true })))
    },
    closeBundle() {},
  }
}
