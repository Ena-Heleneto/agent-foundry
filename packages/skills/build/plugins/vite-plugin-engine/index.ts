import type { Plugin, PluginOption, Rolldown } from 'vite'
import { createHash } from 'node:crypto'
import { lstatSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { scanCollections } from '#utils/scan-skills'
import { createEngineInstallScript } from './install-script.ts'

/**
 * 按顺序加载全局与集合子插件，限定子插件输出路径并交付引擎入口。
 *
 * @param publishOnly 是否只从选择发布的集合发现子插件。
 * @returns 子插件及后置入口生成插件，由 Vite 执行各自构建钩子。
 * @throws 子插件导入、解析或工厂调用失败时，附带实际入口路径。
 */
export default async function vitePluginEngine(publishOnly = false): Promise<PluginOption[]> {
  /**
   * 从包内定位全局和集合子插件目录，全局优先，集合沿用扫描顺序及 plugin 开关。
   */
  const directories = [
    { root: fileURLToPath(new URL('./sub-plugins', import.meta.url)), source: '全局' },
    ...(await scanCollections(fileURLToPath(import.meta.resolve('#src')), { publishOnly }))
      .filter(({ config }) => config.plugin === true)
      .map(({ directory }) => ({ root: join(directory, 'plugin'), source: '集合' })),
  ]

  /**
   * 发出文件时补齐稳定名称，并将产物及源码映射限制在 engine 下。
   */
  const emissionProxy: ProxyHandler<Rolldown.PluginContext['emitFile']> = {
    apply(emitFile, _context, [file]: [Rolldown.EmittedFile]) {
      /**
       * 显式文件名保留，缺省名称由声明名称及内容散列生成。
       */
      let fileName: string
      if (file.type === 'prebuilt-chunk') {
        fileName = file.fileName
      }
      else if (file.fileName != null) {
        fileName = file.fileName
      }
      else {
        /**
         * 缺少声明名称时使用文件类型作为名称。
         */
        const name = file.name || (file.type === 'asset' ? 'asset' : 'chunk')
        /**
         * 同名文件按资产内容或入口模块区分。
         */
        const hash = createHash('sha256').update(file.type === 'asset' ? file.source : file.id).digest('hex').slice(0, 12)
        /**
         * 资产保留扩展名，动态入口块使用 js 扩展名。
         */
        const extension = posix.extname(name)
        fileName = file.type === 'chunk'
          ? `${name}-${hash}.js`
          : `${name.slice(0, name.length - extension.length)}-${hash}${extension}`
      }

      /**
       * 预构建块的源码映射路径与产物路径使用相同的校验。
       */
      const paths: [string, string?] = [fileName]
      if (file.type === 'prebuilt-chunk' && file.sourcemapFileName !== undefined)
        paths[1] = file.sourcemapFileName

      paths.forEach((path, index, filenames) => {
        if (path === undefined)
          return

        /**
         * 按产物路径约定统一分隔符并拒绝越出 engine 的路径。
         */
        const relativePath = path.replaceAll('\\', '/')
        if (!relativePath || posix.isAbsolute(relativePath) || /^[a-z]:/i.test(relativePath) || relativePath.split('/').includes('..'))
          throw new Error(`子插件产物路径必须位于 engine 目录内：${path}`)
        filenames[index] = posix.join('engine', relativePath)
      })

      return emitFile(file.type === 'prebuilt-chunk'
        ? { ...file, fileName: paths[0], sourcemapFileName: paths[1] }
        : { ...file, fileName: paths[0] })
    },
  }

  /**
   * 给 emitFile 加上路径处理，其他钩子上下文方法沿用原接收者。
   */
  const contextProxy: ProxyHandler<Rolldown.PluginContext> = {
    get(context, key) {
      if (key === 'emitFile')
        return new Proxy(context.emitFile.bind(context), emissionProxy)

      /**
       * 文件引用查询等方法继续使用构建器提供的上下文。
       */
      const value: unknown = Reflect.get(context, key, context)
      return typeof value === 'function' ? value.bind(context) : value
    },
  }

  /**
   * 保留各类钩子的参数、接收者及返回值。
   */
  type PluginHook = (this: unknown, ...args: never[]) => unknown

  /**
   * 处理各类 Vite 钩子的参数和返回值，只代理具有 emitFile 的上下文。
   */
  const hookProxy: ProxyHandler<PluginHook> = {
    apply(hook, context: unknown, args) {
      if (typeof context !== 'object' || context === null || !('emitFile' in context) || typeof context.emitFile !== 'function')
        return Reflect.apply(hook, context, args)

      return Reflect.apply(hook, new Proxy(context as Rolldown.PluginContext, contextProxy), args)
    },
  }

  /**
   * 子插件按来源和名称依次装入，Vite 负责调度它们的钩子。
   */
  const plugins: PluginOption[] = []
  for (const { root, source } of directories) {
    if (!lstatSync(root, { throwIfNoEntry: false })?.isDirectory())
      continue

    /**
     * 按目录名顺序发现普通子插件目录，全局扫描跳过备份。
     */
    const names = readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory()
        && entry.name.startsWith('vite-plugin-')
        && (source !== '全局' || !entry.name.endsWith('_copy')))
      .map(entry => entry.name)
      .sort()

    for (const name of names) {
      /**
       * 只读取约定位置的普通 index.ts 文件。
       */
      const entryPath = join(root, name, 'index.ts')
      if (!lstatSync(entryPath, { throwIfNoEntry: false })?.isFile())
        continue

      try {
        /**
         * 子插件工厂按发现顺序导入和调用。
         */
        const { default: createPlugin }: { default: () => PluginOption } = await import(pathToFileURL(entryPath).href)
        if (typeof createPlugin !== 'function')
          throw new TypeError('默认导出必须是 Vite 插件工厂')

        /**
         * 工厂结果保留 Vite 选项的数组层级和待解析的 Promise。
         */
        const pluginOption = await Promise.resolve(createPlugin()).then(function scopeOption(this: ProxyHandler<PluginHook>, option: PluginOption): PluginOption {
          if (!option)
            return option
          if (Array.isArray(option))
            return option.map(scopeOption, this)
          if (option instanceof Promise)
            return option.then(scopeOption.bind(this))

          /**
           * 复制插件及其原型，通过原生代理处理钩子调用。
           */
          const plugin: Plugin = Object.assign(Object.create(Object.getPrototypeOf(option)), option)
          for (const [key, hook] of Object.entries(option as Plugin)) {
            if (key === 'api')
              continue
            if (typeof hook === 'function') {
              Reflect.set(plugin, key, new Proxy(hook as PluginHook, this))
            }
            else if (hook && typeof hook === 'object' && typeof hook.handler === 'function') {
              Reflect.set(plugin, key, { ...hook, handler: new Proxy(hook.handler as PluginHook, this) })
            }
          }
          return plugin
        }.bind(hookProxy))
        plugins.push(pluginOption)
      }
      catch (cause) {
        throw new Error(`加载${source}子插件失败：${entryPath}`, { cause })
      }
    }
  }

  /**
   * 末尾注册入口生成钩子，使用本次构建的 Shell 资产汇总挂载清单。
   */
  plugins.push({
    name: 'vite-plugin-engine-install',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (bundle['engine/install.sh'])
          this.error('引擎统一入口路径已被占用：engine/install.sh')

        /**
         * 选择自动挂载脚本并按相对路径排序，隐匿脚本由引擎按参数选择。
         */
        const scripts = Object.values(bundle)
          .filter(output =>
            output.type === 'asset'
            && output.fileName.startsWith('engine/')
            && output.fileName !== 'engine/script/hidden-install.sh'
            && output.fileName.endsWith('.sh'),
          )
          .map(output => output.fileName.slice('engine/'.length))
          .sort()
        this.emitFile({ type: 'asset', fileName: 'engine/install.sh', source: createEngineInstallScript(scripts) })
      },
    },
  })
  return plugins
}
