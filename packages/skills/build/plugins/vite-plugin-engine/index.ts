import type { Plugin, PluginOption, Rolldown } from 'vite'
import { createHash } from 'node:crypto'
import { lstatSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { scanCollections } from '#utils/scan-skills'
import { createEngineInstallScript } from './install-script.ts'

/**
 * 在子插件输出完成后生成统一入口，空脚本集合也交付有效入口。
 *
 * @returns 最后收集 engine 内 Shell 资产的构建插件。
 */
function engineInstallPlugin(): Plugin {
  return {
    name: 'vite-plugin-engine-install',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (bundle['engine/install.sh'])
          this.error('引擎统一入口路径已被占用：engine/install.sh')

        /**
         * 只消费本次实际生成的脚本资产，保留相对 engine 的稳定调用顺序。
         */
        const scripts = Object.values(bundle)
          .filter(output => output.type === 'asset' && output.fileName.startsWith('engine/') && output.fileName.endsWith('.sh'))
          .map(output => output.fileName.slice('engine/'.length))
          .sort()
        this.emitFile({ type: 'asset', fileName: 'engine/install.sh', source: createEngineInstallScript(scripts) })
      },
    },
  }
}

/**
 * 保留不同 Vite 钩子的参数、返回值和执行上下文。
 */
type PluginHook = (this: unknown, ...args: never[]) => unknown

/**
 * 将子插件的相对输出地址限定在构建根的 engine 目录内。
 */
function enginePath(fileName: string): string {
  /**
   * 统一以 Vite 产物使用的正斜杠解释路径。
   */
  const relativePath = fileName.replaceAll('\\', '/')
  if (!relativePath || posix.isAbsolute(relativePath) || /^[a-z]:/i.test(relativePath) || relativePath.split('/').includes('..'))
    throw new Error(`集合子插件产物路径必须位于 engine 目录内：${fileName}`)
  return posix.join('engine', relativePath)
}

/**
 * 为未指定 fileName 的资产或入口块生成稳定名称。
 */
function defaultFileName(file: Rolldown.EmittedAsset | Rolldown.EmittedChunk): string {
  /**
   * 名称来自插件声明，缺省按文件类型取名。
   */
  const name = file.name || (file.type === 'asset' ? 'asset' : 'chunk')
  /**
   * 同名的不同资产内容或不同入口模块使用不同的文件名。
   */
  const hash = createHash('sha256').update(file.type === 'asset' ? file.source : file.id).digest('hex').slice(0, 12)
  if (file.type === 'chunk')
    return `${name}-${hash}.js`

  /**
   * 资产后缀保留原用途，散列放在扩展名之前。
   */
  const extension = posix.extname(name)
  return `${name.slice(0, name.length - extension.length)}-${hash}${extension}`
}

/**
 * 在 Vite 为引用分配文件名之前指定 engine 内的实际输出路径。
 */
function scopeEmission(file: Rolldown.EmittedFile): Rolldown.EmittedFile {
  if (file.type === 'prebuilt-chunk') {
    return {
      ...file,
      fileName: enginePath(file.fileName),
      sourcemapFileName: file.sourcemapFileName === undefined ? undefined : enginePath(file.sourcemapFileName),
    }
  }
  return { ...file, fileName: enginePath(file.fileName ?? defaultFileName(file)) }
}

/**
 * 为子插件提供带输出前缀的 emitFile，同时保留 Vite 的其他上下文方法。
 */
function scopeHook(hook: PluginHook): PluginHook {
  return function (this: unknown, ...args) {
    if (typeof this !== 'object' || this === null || !('emitFile' in this) || typeof this.emitFile !== 'function')
      return hook.apply(this, args)

    /**
     * 只替换当前钩子的文件发出方法，其他方法使用原始上下文。
     */
    const context = new Proxy(this as Pick<Rolldown.PluginContext, 'emitFile'>, {
      get(target, key) {
        if (key === 'emitFile')
          return (file: Rolldown.EmittedFile) => target.emitFile(scopeEmission(file))

        /**
         * 保留其他上下文方法的原接收者，包括 Vite 的文件引用查询。
         */
        const value: unknown = Reflect.get(target, key, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    return hook.apply(context, args)
  }
}

/**
 * 保留 Vite 的异步和嵌套插件结构，为其中的文件生成钩子限定产物路径。
 */
function scopePluginOutput(option: PluginOption): PluginOption {
  if (!option)
    return option
  if (Array.isArray(option))
    return option.map(scopePluginOutput)
  if (option instanceof Promise)
    return option.then(scopePluginOutput)

  /**
   * 保留原插件配置和钩子元数据，包装其中能发出文件的上下文。
   */
  const plugin: Plugin = Object.assign(Object.create(Object.getPrototypeOf(option)), option)
  for (const [key, hook] of Object.entries(option)) {
    if (key === 'api')
      continue
    if (typeof hook === 'function') {
      Reflect.set(plugin, key, scopeHook(hook as PluginHook))
    }
    else if (hook && typeof hook === 'object' && typeof hook.handler === 'function') {
      Reflect.set(plugin, key, { ...hook, handler: scopeHook(hook.handler as PluginHook) })
    }
  }
  return plugin
}

/**
 * 加载已启用的集合插件，将产物归入 engine 并生成统一调用入口。
 *
 * @param sourceDir 集合来源目录，缺省通过 #src 定位当前包的 src。
 * @returns 子插件及后置入口生成插件，由 Vite 执行各自构建钩子。
 * @throws 子插件导入或工厂调用失败时，附带实际入口路径。
 */
export default async function vitePluginEngine(
  sourceDir = fileURLToPath(import.meta.resolve('#src')),
): Promise<PluginOption[]> {
  const enabledCollections = (await scanCollections(sourceDir)).filter(({ config }) => config.plugin === true)

  /**
   * 保存按集合及插件名排列的子插件配置，各自生成 engine 内的文件。
   */
  const plugins: PluginOption[] = []
  for (const { directory } of enabledCollections) {
    const pluginDirectory = join(directory, 'plugin')
    if (!lstatSync(pluginDirectory, { throwIfNoEntry: false })?.isDirectory())
      continue

    const names = readdirSync(pluginDirectory, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name.startsWith('vite-plugin-'))
      .map(entry => entry.name)
      .sort()

    for (const name of names) {
      const entryPath = join(pluginDirectory, name, 'index.ts')
      if (!lstatSync(entryPath, { throwIfNoEntry: false })?.isFile())
        continue

      try {
        const { default: createPlugin }: { default: () => PluginOption } = await import(pathToFileURL(entryPath).href)
        if (typeof createPlugin !== 'function')
          throw new TypeError('默认导出必须是 Vite 插件工厂')
        plugins.push(scopePluginOutput(await createPlugin()))
      }
      catch (cause) {
        throw new Error(`加载集合子插件失败：${entryPath}`, { cause })
      }
    }
  }
  return [...plugins, engineInstallPlugin()]
}
