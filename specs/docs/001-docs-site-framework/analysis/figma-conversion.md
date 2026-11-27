# Figma 原型盘点与转换记录

## T017 真实原型盘点

2026-11-27 以用户提供的 Make 原型和空白 Design 文件为输入。两种视口实际打开了五个模块的 15 个视图，涵盖 14 条内容路径和首页同一路径下的第二章。 [实施方案](../implementation/T017.md) · [清单和画板契约](../contracts/site-navigation.md#页面转换契约figma)

### 原型输入与复现

- **Make 原型**。通过 Figma MCP 读取真实项目源码。用于运行的快照共 50 项，包含 `src/`、构建文件、`.figma/make/site.json` 与 favicon。将相对路径排序后取各项 `sha256sum` 输出，再对输出取 SHA-256，得到 `549b08c8b5b038d76c14089efc578b4b6e84655553c53f36340e6f9bf481eb92`。 [Agent Foundry 文档站原型](https://www.figma.com/make/FOn29DUppcpuJ3bRP9QEOU/Agent-Foundry-%E6%96%87%E6%A1%A3%E7%AB%99)
- **Design 目标**。通过当前 Figma 连接调用编辑工具的只读脚本，返回 `editorType=figma`、唯一页面 `Page 1`、页面 ID `0:1`、图层数 0。编辑工具的访问要求见 Figma 文档。画板写入在 T019 实测。 [空白 Design 文件](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=0-1) · [Figma 编辑工具要求](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/)
- **本地预览**。在临时目录用 Node 24.22.2 和 pnpm 12.16.1 执行 `pnpm install --ignore-scripts --prefer-offline`、`pnpm run build` 和 `pnpm run preview --host 127.0.0.1 --port <端口> --strictPort`。实际构建版本为 Vite 8.3.8，预览入口返回 HTTP 200。构建报告了 Vite 原生配置加载兼容提示和较大的 Three.js 产物提示。
- **浏览器**。使用 Playwright Core 1.65.1 和无头 Chromium 156.0.8078.4。桌面取 1440 × 900，手机取 390 × 844 并启用触摸。核对每个页面的标题、实际路径、发起操作的控件与可见导航内容。两个 Spec Kit 栏目另外核对了不同的正文和选中链接。

### 页面与视口

所有行均适用桌面与手机。默认画面中，桌面技能集合下拉关闭，手机全局菜单和目录抽屉关闭。技能页的手机目录首次打开时采用对应行的集合展开设置。Skills 章节是打开首页所见的画面，MCP 章节从页头的「02」章节按钮翻到，地址仍为 `/`。

| 模块             | 视图                | 原型路径                               | 桌面默认技能侧栏 | 桌面状态数 | 手机状态数 |
| ---------------- | ------------------- | -------------------------------------- | ---------------- | ---------- | ---------- |
| 首页             | Skills 章节         | `/`                                    | 无技能侧栏       | 2          | 3          |
| 首页             | MCP 章节            | `/`                                    | 无技能侧栏       | 2          | 3          |
| 技能文档         | 技能文档总览        | `/skills`                              | 两组折叠         | 8          | 7          |
| 技能文档         | frontend 集合       | `/skills/frontend`                     | 仅展开 frontend  | 8          | 7          |
| 技能文档         | component-scaffold  | `/skills/frontend/component-scaffold`  | 仅展开 frontend  | 8          | 7          |
| 技能文档         | design-tokens       | `/skills/frontend/design-tokens`       | 仅展开 frontend  | 8          | 7          |
| 技能文档         | accessibility-audit | `/skills/frontend/accessibility-audit` | 仅展开 frontend  | 8          | 7          |
| 技能文档         | workflow 集合       | `/skills/workflow`                     | 仅展开 workflow  | 8          | 7          |
| 技能文档         | spec-planning       | `/skills/workflow/spec-planning`       | 仅展开 workflow  | 8          | 7          |
| 技能文档         | code-review         | `/skills/workflow/code-review`         | 仅展开 workflow  | 8          | 7          |
| 技能文档         | release-notes       | `/skills/workflow/release-notes`       | 仅展开 workflow  | 8          | 7          |
| MCP 文档         | MCP 文档            | `/mcp`                                 | 无技能侧栏       | 2          | 3          |
| 与 Spec Kit 协作 | 栏目 A              | `/spec-kit/section-a`                  | 无技能侧栏       | 2          | 3          |
| 与 Spec Kit 协作 | 栏目 B              | `/spec-kit/section-b`                  | 无技能侧栏       | 2          | 3          |
| 项目开发文档     | 项目开发文档        | `/development`                         | 无技能侧栏       | 2          | 3          |
| 合计             | 15 个视图           | 14 条内容路径                          |                  | 84         | 81         |

原型的 `/spec-kit` 按路由定义重定向到栏目 A，采集使用对应内容路径。技能集合入口来自 `src/app/data/site.ts`，两组技能与详情路径来自 `src/app/data/skills.ts`，首页两章来自 `src/app/home/chapters.ts`。

### 可见导航状态

下列规则与上表每一行组成可复现的清单项。画板名称可用「视图 · 视口 · 状态」，基准组合命名为「默认」。例如「frontend 集合 · 手机 · 目录仅展开 frontend」。每个视图有一项桌面默认画面和一项手机默认画面。

| 适用范围                       | 状态及进入方式                                                                                                                                   | 核对点                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 桌面，所有视图                 | 集合下拉关闭或展开。在顶部「技能文档」按钮按 Enter 展开，按 Escape 收起。                                                                        | 展开后可见 frontend、workflow 和技能文档总览三个目标。MCP、Spec Kit 和项目开发入口可见。   |
| 桌面，九个技能视图             | 左侧目录可两组折叠、仅展开 frontend、仅展开 workflow、两组展开。每种侧栏状态均核对上方集合下拉的关闭和展开。                                     | 通过集合名左侧的按钮调整树，展开项显示该组三个技能链接，首次进入集合或详情时所属集合展开。 |
| 手机，所有视图                 | 顶部菜单关闭，或打开且技能集合展开，或打开且技能集合折叠。点击「展开菜单」时技能集合默认展开，点击菜单内「技能文档」切换，点击「收起菜单」关闭。 | 两个打开状态有不同高度和可见链接，四个文档模块仍可从菜单识别。                             |
| 手机，九个技能视图             | 在关闭顶部菜单后点「目录」，分别核对两组折叠、仅展开 frontend、仅展开 workflow、两组展开四种抽屉画面。点「收起目录」恢复默认。                   | 抽屉有独立的集合开合控件，打开时可见当前条目的选中状态。                                   |
| 两种视口，Spec Kit 栏目 A 和 B | 桌面使用「栏目导航」左侧栏，手机使用内容上方的横向栏目条。                                                                                       | 两个栏目各自有标题、正文和可定位的选中链接。                                               |

桌面的非技能视图有 2 项，技能视图有 4 种侧栏状态与 2 种下拉状态的 8 个组合。手机各视图有 3 种顶部菜单状态，技能视图另有 4 种目录抽屉状态。按表中规则共核对 165 个视口与导航组合，其中 30 项是默认画面。首页翻页和菜单开合等操作共用原路径，状态还需通过实际操作定位。

### 执行结果

| 检查                              | 结果         | 实际记录                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make 源码、预览构建及 Design 访问 | 通过         | 预览构建和入口请求通过，指定 Design 页可读取且有 0 个图层。                                                                                                                                                                                                 |
| 页面和导航盘点                    | 通过         | 逐项采集桌面 84 个组合和手机 81 个组合。汇总来自浏览器逐项运行和桌面首页的单项补测。                                                                                                                                                                        |
| 浏览器首轮运行                    | 失败，已复跑 | 浏览器连接器配置的 Chrome 不在本机。使用已安装 Chromium 后，首轮并行检查出现超时，改为按视口顺序执行。串行检查中桌面首页 Skills 首载仍有一次超时。此前单项检查已看到实时 Three.js 并操作了下拉，另以 `--disable-webgl` 补测了静态预览画面及同样的菜单操作。 |
| 候选方式比较、代表性与全量转换    | 未执行       | T018 使用本清单比较覆盖能力。T019 再验证目标文件的实际写入、字体与图片一致性、3D 及动画处理。                                                                                                                                                               |

桌面和手机的两个首页章节均在浏览器中观察到「实时渲染 · Three.js」。试转可以选首页 Skills 章节和 `/skills/frontend`。两页都覆盖桌面与手机，手机集合页可使用目录展开状态检查采集是否保留导航布局。 [T018 和 T019](../tasks.md#phase-8-user-story-6---一次启动将原型页面和状态转换为可编辑画板priority-p2)

## T018 转换方式实测

2026-11-27 使用 T017 的实际原型快照，重新核对 50 项源码文件的 SHA-256 汇总一致。原型预览运行于 `http://127.0.0.1:42303/`。样例选桌面 1440 × 900 的首页两个章节和手机 390 × 844 的 frontend 集合目录两个状态。浏览器使用 Chromium 156.0.8078.4 和 Playwright Core 1.65.1，禁用 WebGL 后由原型显示静态插图。 [T018 实施方案](../implementation/T018.md)

### 同一采集器的对照结果

批量 URL 对照逐项以全新页面加载地址，按清单设置视口，随后调用 Figma 的采集脚本。第二次运行先按清单操作状态，再调用同一脚本。每次运行均一次启动并取得四份原生剪贴板数据。核对剪贴板中的页面尺寸、章节标题坐标和抽屉属性后，得到以下结果。

| 样例               | 地址及进入方式                                    | 仅用 URL    | Playwright 驱动后 Code to canvas 载荷                                                    |
| ------------------ | ------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| 首页 Skills 默认章 | 桌面 `/`，直接打开                                | 命中 Skills | Skills 大标题位于视口内，MCP 大标题在下方，纵坐标约为 272 和 1124                        |
| 首页 MCP 章        | 桌面 `/`，点击第一章的「02」并等第二章滚动到位    | 回到 Skills | MCP 大标题位于视口内，Skills 大标题在上方，纵坐标约为 288 和 −564                        |
| 手机目录关闭       | 手机 `/skills/frontend`，直接打开                 | 命中关闭态  | 目录按钮 `aria-expanded=false`，抽屉隐藏，左边缘位于 −320 像素                           |
| 手机目录展开       | 手机 `/skills/frontend`，点击「目录」并等抽屉到位 | 回到关闭态  | 目录按钮 `aria-expanded=true`，抽屉左边缘为 0，含「技能文档总览」与 `component-scaffold` |

**批量 URL 导入**在同一采集器、实际原型的对照中命中 2/4。重复地址加载得到相同的默认章节或目录状态。html.to.design 的 Web 批量模式要求供应商服务可访问的公开页面，本地预览只在回环地址运行。对用户提供的 Make 链接作未登录 HTTP 读取，返回标题为 `Figma` 的 HTML 外壳，初始 HTML 未发现两个章节的元素。供应商文档将 Make 和本地页面列为浏览器扩展的适用输入。其 Web 批量导入实测缺前置，恢复条件是取得该服务可访问的公开预览和批量权限。 [html.to.design URL 导入说明](https://html.to.design/docs/web-tab)

**Figma MCP Code to canvas**以官方采集脚本运行剪贴板模式，使用 `window.figma.captureForDesign({ selector: 'body' })`。四份 `text/html` 输出均包含可解码的原生 `figh2d` 布局树，实际数据的记录如下。树中保留了视口之外的另一章和关闭的抽屉节点。T019 需在画板上复核裁切、隐藏和编辑效果。 [Code to canvas 文档](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) · [实际采集脚本](https://mcp.figma.com/mcp/html-to-design/capture.js)

| 样例               | 布局数据字节数 | SHA-256                                                            |
| ------------------ | -------------- | ------------------------------------------------------------------ |
| 首页 Skills 默认章 | 306952         | `19db4fc1da6cdb33d9c280dcbfd31d8ffa125bbc4e8fb3bedf6adeea9743cea9` |
| 首页 MCP 章        | 305641         | `810d21a69221578a26931ccb1b6a2f10fd51eab905dff5bc733946e9263664d7` |
| 手机目录关闭       | 350543         | `74a47798df3f043d1586cfbaa33cc53bb92cac0a4fd04a35733682b4ccd1db13` |
| 手机目录展开       | 347829         | `2c6a113e9149b3067a0bca48716095591db673b0bc1e7236a8603747b891f3f2` |

**Playwright 按清单采集**。一次启动依次打开四个样例，设置视口，按表执行操作，核对章节位置或抽屉可见性，再运行采集。实际得到 4/4 份与目标状态对应的布局数据。第一次读取剪贴板的异步判断提前返回空值，改为等待浏览器实际产生 MIME 为 `text/html` 的采集数据后，复跑并逐项验证数据与坐标。同一批的浏览器参考图和布局数据均有独立哈希。

### 采用方式与 T019 输入

采用 **Playwright 按清单操作 + Figma MCP Code to canvas**。以当前 Make 源码的本地预览为输入，Playwright 确认画面到位后使用对应的 Figma 一次性采集 ID。T019 面向同一 Design 文件的 `Page 1`（`0:1`）一次启动采集，候选样例为首页 Skills 章及 frontend 集合页的桌面与手机版本，其中手机集合页可用本轮验证过的目录展开态。T019 的实际落图、裁切与隐藏效果、文字和布局可编辑性、字体图片及 3D 处理状态为未执行。 [空白 Design 目标](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=0-1) · [代表性试转任务](../tasks.md#phase-8-user-story-6---一次启动将原型页面和状态转换为可编辑画板priority-p2)

## T019 代表性试转

2026-11-27 使用 T017 的 Make 原型快照和 T018 的采集方式。一次 Playwright 主流程依次启动四个样例，为每项设置实际视口并核对章节或目录状态，调用 Figma 采集脚本的 `captureOnceForDesign`。四次提交均返回 HTTP 200，四个采集编号均取得同一 Design 文件的完成回执。布局调整和命名在四块原生画板上以 Figma 脚本执行。 [实施方案](../implementation/T019.md) · [目标页面 Page 1](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=0-1)

### 实际画板

将四块画板的 Figma 渲染图逐项与同一次浏览器采集保存的参考图对照。各画板均为 `Page 1` 下的原生 FRAME，画板间无重叠。常规文字为有 `characters` 的 TEXT 层，导航和布局含可选择、可调整的原生框架与矢量层。

| 画板                                                                                             | 最终视口   | 可编辑性                              | 正文与导航状态                                                         | 图片和模型                   |
| ------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| [首页 Skills · 桌面](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=3-2)   | 1440 × 900 | 49 个文字层，150 个可调整框架或矢量层 | 第一章和两段说明均在视口内，顶部导航关闭，MCP 章在章节容器裁切范围之外 | 原 Three.js 文件夹保留为静帧 |
| [首页 Skills · 手机](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=4-2)   | 390 × 844  | 33 个文字层，132 个可调整框架或矢量层 | 第一章、手机页顶和下方操作区可见，手机全局菜单关闭                     | 原 Three.js 文件夹保留为静帧 |
| [frontend 集合 · 桌面](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=5-2) | 1440 × 900 | 31 个文字层，160 个可调整框架或矢量层 | frontend 选中且列出三个技能，workflow 折叠，集合说明和卡片可见         | 品牌图标和目录图标为矢量层   |
| [frontend 集合 · 手机](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=6-2) | 390 × 844  | 28 个文字层，163 个可调整框架或矢量层 | 左侧抽屉宽 320 像素，frontend 展开、workflow 折叠，背景遮罩保留        | 品牌和目录图标为矢量层       |

### 差异与处理

- 两块桌面画板导入时忽略了顶部容器的居中最大宽度，品牌图标的左边距为 32 像素。按源预览恢复左右各 112 像素，复核了主导航的居中位置。
- 首页纸纹导入时只绘制了左上角的单个纹理块。保留原采集的 180 × 180 像素纹理，恢复图像平铺、原透明度和原混合方式，复核了两个视口的完整纹理。
- 手机集合页导入时按完整文档定高 861 像素。以源视口 390 × 844 裁切，复核了展开抽屉、选中态和遮罩。
- 浏览器在两块首页源画面均为实时 Three.js，Figma 保留了当时的渲染图像。画板中的文件夹是图像层，旋转和章节入场动画在原型中查看。浏览器参考图与导入静帧之间可见连续动画带来的轻微姿态差异。
- 英文首页标题实际使用 `Instrument Serif`，品牌及集合标题使用 `Geist`，导入文字保留这些字体。首页中文标题的源浏览器使用 `Noto Serif SC`，导入时附在 `Instrument Serif` 的回退字形上。已将两处标题的原生文字恢复为 `Noto Serif SC Medium`（字重 500），并核对了衬线字形。四块画板的 Figma 字体缺失计数均为 0。
- 源浏览器的中文正文和目录实际使用 `Source Han Sans CN`，Figma 目标的可用字体中没有该字体。2026-11-27 用户回复「中文字体嘛，确认吧，项目中可以使用unocss的字体来处理」，确认试转画板采用 `Noto Sans SC`，并允许站点实现时通过 UnoCSS 处理字体。已在四块画板的 65 个原生文字层、73 个中文字体区间应用 `Noto Sans SC`。其中 3 个源半粗体区间使用目标可用的 Bold 字重。复核四块 Figma 渲染，第 1 块的桌面首页正文仍有一处换行差异，内容完整，视口和导航状态核对通过。 [站点 UnoCSS 配置](../../../../apps/docs/uno.config.ts)

### 验收状态

| 检查                             | 结果   | 证据或恢复条件                                                                  |
| -------------------------------- | ------ | ------------------------------------------------------------------------------- |
| 一次启动生成四块具名画板         | 通过   | 同一文件同一页面下四个独立原生画板，链接见上表                                  |
| 文字与布局可编辑、正文及导航状态 | 通过   | 四块均保留多层原生文字与布局，已检查手机目录、章节裁切和四个最终视口            |
| 字体替代                         | 通过   | 设计协作者确认使用 `Noto Sans SC`。四块画板更新后均复核渲染，缺失字体计数为 0。 |
| 3D 与动画处理                    | 已记录 | 两块首页使用原 Three.js 画面的静帧，模型交互和原始动画由 Make 原型提供          |
| T020 全量转换                    | 未执行 | T019 已通过验收，可按 T020 的原任务范围启动。                                   |

## T020 全量转换

2026-11-27 将 T017 盘点的 15 个视图、14 条内容路径转换为 165 块具名原生画板，按视图和设备摆放在同一 Design 文件的「T020 全量转换」页。桌面 84 块（1440 × 900），手机 81 块（390 × 844），其中 30 块为默认态。 [全量转换页](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=20-2) · [实施方案](../implementation/T020.md)

一次 Playwright 启动使用 T017 的 Make 快照，在每个实际视口中打开页面并操作菜单或目录。前两项取得逐项回执后，同一进程沿 Figma 服务器返回的续接编号提交其余项。165 次采集均返回 HTTP 200，各自取得独立的画板节点 ID。已核对 165 张浏览器参考图的哈希和尺寸、路径和章节、桌面下拉、手机菜单和抽屉及目录展开组合。Chromium 版本为 `156.0.8078.4`。执行清单 SHA-256 为 `23c648a7fcea634a716f5f3e7da900da96e6d2ee044d9e983e24c2f97095c43e`。

### 验收结果

| 检查                 | 结果              | 证据                                                                                                                          |
| -------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 一次启动和唯一映射   | 165 / 165         | 全量页上 165 个 FRAME 的名称、节点 ID、位置、尺寸和裁切逐项通过读回，画板之间无重叠，用户逐页操作 0 次                        |
| 正文、导航与可编辑性 | 165 / 165         | 检查了正文标题及内容锚点、桌面下拉开合、手机菜单、技能目录组合和 Spec Kit 当前栏目，所有画板均有原生 TEXT、FRAME 和 VECTOR 层 |
| 字体和图像           | 165 / 165         | 缺失字体计数为 0，首页恢复了源纹理平铺，验收了十张实时渲染静帧和各画板的 PNG 输出                                             |
| 参考图对照           | 42 / 42           | 覆盖 15 个视图的桌面和手机默认态，以及桌面下拉、手机主菜单和目录抽屉的代表性展开及折叠状态                                    |
| FR-012 与 FR-013     | 165 / 165（100%） | 全量验收通过，失败 0 项、缺前置 0 项、未执行 0 项。每项的画板链接与结果见下表                                                 |

### 导入修正与差异

- 84 块桌面画板的顶栏内容按原型恢复到距视口左右各 112 像素。42 块桌面下拉态在实图核对时发现菜单被正文遮挡，已用原生 Auto Layout 的叠放顺序恢复顶栏覆盖关系，并将菜单透明度校正到 100%。按 1280 像素的居中容器复核实际边距，逐块重新读回及导出 42 块画板。抽样中下拉面板与原型约有 1 像素的水平偏移，正文、菜单和选中态通过核对。
- 165 块画板按原型视口裁切。十块首页均复用了源预览的 180 × 180 像素纸纹，恢复平铺及原层的混合方式。品牌和导航图标保留可编辑的矢量图层。
- 已按 T019 确认的方案使用 `Noto Sans SC` 替代中文无衬线，首页中文副标题恢复为 `Noto Serif SC Medium`。共调整 2,211 个原生文字层中的 2,445 个字体区间，其中 153 个源半粗体区间采用 `Noto Sans SC Bold`。保留英文原字体。抽样可见中文替代产生字形及部分正文行尾换行差异，正文内容完整。 [T019 字体确认](#t019-代表性试转)
- 十个首页状态均取得 Make 的实时 Three.js 图像，使用各次采集中的原始渲染静帧。文件夹和连接节点的姿态随采集时点变化，模型旋转、章节过场及菜单动效在 Make 原型中查看。 [Make 原型](https://www.figma.com/make/FOn29DUppcpuJ3bRP9QEOU/Agent-Foundry-%E6%96%87%E6%A1%A3%E7%AB%99)
- 首轮源图中有首页入场和目录展开过渡。并行刷新参考图时首页切换超时，随后串行在状态稳定后刷新 15 张本地参考图并通过对照。三张桌面下拉样例使用修正后的 Figma 渲染图复核。全量转换发起 1 次。

### 逐项结果

画板链接按 T017 清单顺序排列。原生文字和布局列为实际 TEXT 数与可调整的 FRAME、VECTOR 层数。字体区间列记录本次调整数。所有行均通过正文、可见导航状态、字体、图层和 PNG 核验，标注「源图对照」的行另进行了渲染图逐对比对。

| 序号 | Figma 画板                                                                                                                                  | 可见导航                                             | 文字 / 布局层 | 字体区间 | 图片或矢量                     | 结果            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------- | -------- | ------------------------------ | --------------- |
| 001  | [Skills 章节 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=21-2)                                      | 下拉关闭                                             | 49 / 150      | 33       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 002  | [Skills 章节 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=22-2)                              | 下拉展开                                             | 57 / 178      | 39       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 003  | [MCP 章节 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=24-2)                                         | 下拉关闭                                             | 54 / 157      | 40       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 004  | [MCP 章节 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=25-2)                                 | 下拉展开                                             | 62 / 185      | 46       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 005  | [技能文档总览 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=26-2)                                     | 下拉关闭，目录折叠                                   | 28 / 109      | 15       | 20 个矢量层                    | 通过 · 源图对照 |
| 006  | [技能文档总览 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=27-2)                             | 下拉展开，目录折叠                                   | 36 / 137      | 21       | 26 个矢量层                    | 通过            |
| 007  | [技能文档总览 · 桌面 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=28-2)                      | 下拉关闭，目录展开 frontend                          | 31 / 140      | 15       | 35 个矢量层                    | 通过            |
| 008  | [技能文档总览 · 桌面 · 目录仅展开 frontend、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=29-2)        | 下拉展开，目录展开 frontend                          | 39 / 168      | 21       | 41 个矢量层                    | 通过 · 源图对照 |
| 009  | [技能文档总览 · 桌面 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=30-2)                      | 下拉关闭，目录展开 workflow                          | 31 / 139      | 15       | 35 个矢量层                    | 通过 · 源图对照 |
| 010  | [技能文档总览 · 桌面 · 目录仅展开 workflow、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=31-2)        | 下拉展开，目录展开 workflow                          | 39 / 167      | 21       | 41 个矢量层                    | 通过            |
| 011  | [技能文档总览 · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=32-2)                             | 下拉关闭，目录展开 frontend、workflow                | 34 / 170      | 15       | 50 个矢量层                    | 通过            |
| 012  | [技能文档总览 · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=33-2)               | 下拉展开，目录展开 frontend、workflow                | 42 / 198      | 21       | 56 个矢量层                    | 通过            |
| 013  | [frontend 集合 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=34-2)                                    | 下拉关闭，目录展开 frontend                          | 31 / 160      | 15       | 50 个矢量层                    | 通过 · 源图对照 |
| 014  | [frontend 集合 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=35-2)                            | 下拉展开，目录展开 frontend                          | 39 / 188      | 21       | 56 个矢量层                    | 通过            |
| 015  | [frontend 集合 · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=36-2)                            | 下拉关闭，目录折叠                                   | 28 / 129      | 15       | 35 个矢量层                    | 通过            |
| 016  | [frontend 集合 · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=37-2)              | 下拉展开，目录折叠                                   | 36 / 157      | 21       | 41 个矢量层                    | 通过            |
| 017  | [frontend 集合 · 桌面 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=38-2)                     | 下拉关闭，目录展开 workflow                          | 31 / 159      | 15       | 50 个矢量层                    | 通过            |
| 018  | [frontend 集合 · 桌面 · 目录仅展开 workflow、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=39-2)       | 下拉展开，目录展开 workflow                          | 39 / 187      | 21       | 56 个矢量层                    | 通过            |
| 019  | [frontend 集合 · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=40-2)                            | 下拉关闭，目录展开 frontend、workflow                | 34 / 190      | 15       | 65 个矢量层                    | 通过            |
| 020  | [frontend 集合 · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=41-2)              | 下拉展开，目录展开 frontend、workflow                | 42 / 218      | 21       | 71 个矢量层                    | 通过            |
| 021  | [component-scaffold · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=42-2)                               | 下拉关闭，目录展开 frontend                          | 24 / 131      | 10       | 35 个矢量层                    | 通过 · 源图对照 |
| 022  | [component-scaffold · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=43-2)                       | 下拉展开，目录展开 frontend                          | 32 / 159      | 16       | 41 个矢量层                    | 通过            |
| 023  | [component-scaffold · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=44-2)                       | 下拉关闭，目录折叠                                   | 21 / 98       | 10       | 20 个矢量层                    | 通过            |
| 024  | [component-scaffold · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=45-2)         | 下拉展开，目录折叠                                   | 29 / 126      | 16       | 26 个矢量层                    | 通过            |
| 025  | [component-scaffold · 桌面 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=46-2)                | 下拉关闭，目录展开 workflow                          | 24 / 128      | 10       | 35 个矢量层                    | 通过            |
| 026  | [component-scaffold · 桌面 · 目录仅展开 workflow、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=47-2)  | 下拉展开，目录展开 workflow                          | 32 / 156      | 16       | 41 个矢量层                    | 通过            |
| 027  | [component-scaffold · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=48-2)                       | 下拉关闭，目录展开 frontend、workflow                | 27 / 161      | 10       | 50 个矢量层                    | 通过            |
| 028  | [component-scaffold · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=49-2)         | 下拉展开，目录展开 frontend、workflow                | 35 / 189      | 16       | 56 个矢量层                    | 通过            |
| 029  | [design-tokens · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=50-2)                                    | 下拉关闭，目录展开 frontend                          | 27 / 136      | 11       | 37 个矢量层                    | 通过 · 源图对照 |
| 030  | [design-tokens · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=52-2)                            | 下拉展开，目录展开 frontend                          | 35 / 164      | 17       | 43 个矢量层                    | 通过            |
| 031  | [design-tokens · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=53-2)                            | 下拉关闭，目录折叠                                   | 24 / 104      | 11       | 22 个矢量层                    | 通过            |
| 032  | [design-tokens · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=54-2)              | 下拉展开，目录折叠                                   | 32 / 132      | 17       | 28 个矢量层                    | 通过            |
| 033  | [design-tokens · 桌面 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=55-2)                     | 下拉关闭，目录展开 workflow                          | 27 / 134      | 11       | 37 个矢量层                    | 通过            |
| 034  | [design-tokens · 桌面 · 目录仅展开 workflow、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=56-2)       | 下拉展开，目录展开 workflow                          | 35 / 162      | 17       | 43 个矢量层                    | 通过            |
| 035  | [design-tokens · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=58-2)                            | 下拉关闭，目录展开 frontend、workflow                | 30 / 166      | 11       | 52 个矢量层                    | 通过            |
| 036  | [design-tokens · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=59-2)              | 下拉展开，目录展开 frontend、workflow                | 38 / 194      | 17       | 58 个矢量层                    | 通过            |
| 037  | [accessibility-audit · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=60-2)                              | 下拉关闭，目录展开 frontend                          | 27 / 136      | 11       | 37 个矢量层                    | 通过 · 源图对照 |
| 038  | [accessibility-audit · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=61-2)                      | 下拉展开，目录展开 frontend                          | 35 / 164      | 17       | 43 个矢量层                    | 通过            |
| 039  | [accessibility-audit · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=62-2)                      | 下拉关闭，目录折叠                                   | 24 / 104      | 11       | 22 个矢量层                    | 通过            |
| 040  | [accessibility-audit · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=63-2)        | 下拉展开，目录折叠                                   | 32 / 132      | 17       | 28 个矢量层                    | 通过            |
| 041  | [accessibility-audit · 桌面 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=64-2)               | 下拉关闭，目录展开 workflow                          | 27 / 134      | 11       | 37 个矢量层                    | 通过            |
| 042  | [accessibility-audit · 桌面 · 目录仅展开 workflow、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=65-2) | 下拉展开，目录展开 workflow                          | 35 / 162      | 17       | 43 个矢量层                    | 通过            |
| 043  | [accessibility-audit · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=66-2)                      | 下拉关闭，目录展开 frontend、workflow                | 30 / 166      | 11       | 52 个矢量层                    | 通过            |
| 044  | [accessibility-audit · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=67-2)        | 下拉展开，目录展开 frontend、workflow                | 38 / 194      | 17       | 58 个矢量层                    | 通过            |
| 045  | [workflow 集合 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=68-2)                                    | 下拉关闭，目录展开 workflow                          | 31 / 159      | 15       | 50 个矢量层                    | 通过 · 源图对照 |
| 046  | [workflow 集合 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=69-2)                            | 下拉展开，目录展开 workflow                          | 39 / 187      | 21       | 56 个矢量层                    | 通过            |
| 047  | [workflow 集合 · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=70-2)                            | 下拉关闭，目录折叠                                   | 28 / 129      | 15       | 35 个矢量层                    | 通过            |
| 048  | [workflow 集合 · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=71-2)              | 下拉展开，目录折叠                                   | 36 / 157      | 21       | 41 个矢量层                    | 通过            |
| 049  | [workflow 集合 · 桌面 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=72-2)                     | 下拉关闭，目录展开 frontend                          | 31 / 160      | 15       | 50 个矢量层                    | 通过            |
| 050  | [workflow 集合 · 桌面 · 目录仅展开 frontend、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=73-2)       | 下拉展开，目录展开 frontend                          | 39 / 188      | 21       | 56 个矢量层                    | 通过            |
| 051  | [workflow 集合 · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=74-2)                            | 下拉关闭，目录展开 frontend、workflow                | 34 / 190      | 15       | 65 个矢量层                    | 通过            |
| 052  | [workflow 集合 · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=76-2)              | 下拉展开，目录展开 frontend、workflow                | 42 / 218      | 21       | 71 个矢量层                    | 通过            |
| 053  | [spec-planning · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=77-2)                                    | 下拉关闭，目录展开 workflow                          | 27 / 136      | 11       | 37 个矢量层                    | 通过 · 源图对照 |
| 054  | [spec-planning · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=78-2)                            | 下拉展开，目录展开 workflow                          | 35 / 164      | 17       | 43 个矢量层                    | 通过            |
| 055  | [spec-planning · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=79-2)                            | 下拉关闭，目录折叠                                   | 24 / 104      | 11       | 22 个矢量层                    | 通过            |
| 056  | [spec-planning · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=80-2)              | 下拉展开，目录折叠                                   | 32 / 132      | 17       | 28 个矢量层                    | 通过            |
| 057  | [spec-planning · 桌面 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=81-2)                     | 下拉关闭，目录展开 frontend                          | 27 / 135      | 11       | 37 个矢量层                    | 通过            |
| 058  | [spec-planning · 桌面 · 目录仅展开 frontend、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=82-2)       | 下拉展开，目录展开 frontend                          | 35 / 163      | 17       | 43 个矢量层                    | 通过            |
| 059  | [spec-planning · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=83-2)                            | 下拉关闭，目录展开 frontend、workflow                | 30 / 167      | 11       | 52 个矢量层                    | 通过            |
| 060  | [spec-planning · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=84-2)              | 下拉展开，目录展开 frontend、workflow                | 38 / 195      | 17       | 58 个矢量层                    | 通过            |
| 061  | [code-review · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=85-2)                                      | 下拉关闭，目录展开 workflow                          | 27 / 135      | 11       | 37 个矢量层                    | 通过 · 源图对照 |
| 062  | [code-review · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=86-2)                              | 下拉展开，目录展开 workflow                          | 35 / 163      | 17       | 43 个矢量层                    | 通过            |
| 063  | [code-review · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=87-2)                              | 下拉关闭，目录折叠                                   | 24 / 104      | 11       | 22 个矢量层                    | 通过            |
| 064  | [code-review · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=88-2)                | 下拉展开，目录折叠                                   | 32 / 132      | 17       | 28 个矢量层                    | 通过            |
| 065  | [code-review · 桌面 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=89-2)                       | 下拉关闭，目录展开 frontend                          | 27 / 135      | 11       | 37 个矢量层                    | 通过            |
| 066  | [code-review · 桌面 · 目录仅展开 frontend、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=90-2)         | 下拉展开，目录展开 frontend                          | 35 / 163      | 17       | 43 个矢量层                    | 通过            |
| 067  | [code-review · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=91-2)                              | 下拉关闭，目录展开 frontend、workflow                | 30 / 166      | 11       | 52 个矢量层                    | 通过            |
| 068  | [code-review · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=92-2)                | 下拉展开，目录展开 frontend、workflow                | 38 / 194      | 17       | 58 个矢量层                    | 通过            |
| 069  | [release-notes · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=93-2)                                    | 下拉关闭，目录展开 workflow                          | 24 / 130      | 10       | 35 个矢量层                    | 通过 · 源图对照 |
| 070  | [release-notes · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=94-2)                            | 下拉展开，目录展开 workflow                          | 32 / 158      | 16       | 41 个矢量层                    | 通过            |
| 071  | [release-notes · 桌面 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=95-2)                            | 下拉关闭，目录折叠                                   | 21 / 99       | 10       | 20 个矢量层                    | 通过            |
| 072  | [release-notes · 桌面 · 目录两组折叠、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=96-2)              | 下拉展开，目录折叠                                   | 29 / 127      | 16       | 26 个矢量层                    | 通过            |
| 073  | [release-notes · 桌面 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=97-2)                     | 下拉关闭，目录展开 frontend                          | 24 / 130      | 10       | 35 个矢量层                    | 通过            |
| 074  | [release-notes · 桌面 · 目录仅展开 frontend、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=98-2)       | 下拉展开，目录展开 frontend                          | 32 / 158      | 16       | 41 个矢量层                    | 通过            |
| 075  | [release-notes · 桌面 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=99-2)                            | 下拉关闭，目录展开 frontend、workflow                | 27 / 161      | 10       | 50 个矢量层                    | 通过            |
| 076  | [release-notes · 桌面 · 目录两组展开、集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=100-2)             | 下拉展开，目录展开 frontend、workflow                | 35 / 189      | 16       | 56 个矢量层                    | 通过            |
| 077  | [MCP 文档 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=101-2)                                        | 下拉关闭                                             | 13 / 47       | 14       | 5 个矢量层                     | 通过 · 源图对照 |
| 078  | [MCP 文档 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=102-2)                                | 下拉展开                                             | 21 / 72       | 20       | 11 个矢量层                    | 通过            |
| 079  | [栏目 A · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=103-2)                                          | 下拉关闭，栏目 A选中                                 | 21 / 62       | 25       | 8 个矢量层                     | 通过 · 源图对照 |
| 080  | [栏目 A · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=104-2)                                  | 下拉展开，栏目 A选中                                 | 29 / 90       | 31       | 14 个矢量层                    | 通过            |
| 081  | [栏目 B · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=105-2)                                          | 下拉关闭，栏目 B选中                                 | 19 / 59       | 24       | 8 个矢量层                     | 通过 · 源图对照 |
| 082  | [栏目 B · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=106-2)                                  | 下拉展开，栏目 B选中                                 | 27 / 87       | 30       | 14 个矢量层                    | 通过            |
| 083  | [项目开发文档 · 桌面 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=107-2)                                    | 下拉关闭                                             | 13 / 47       | 13       | 5 个矢量层                     | 通过 · 源图对照 |
| 084  | [项目开发文档 · 桌面 · 集合下拉展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=109-2)                            | 下拉展开                                             | 21 / 72       | 19       | 11 个矢量层                    | 通过            |
| 085  | [Skills 章节 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=110-2)                                     | 主菜单关闭                                           | 33 / 135      | 16       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 086  | [Skills 章节 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=111-2)                 | 主菜单展开、集合展开                                 | 44 / 170      | 26       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 087  | [Skills 章节 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=112-2)                 | 主菜单展开、集合折叠                                 | 37 / 143      | 21       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 088  | [MCP 章节 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=113-2)                                        | 主菜单关闭                                           | 38 / 140      | 23       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 089  | [MCP 章节 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=114-2)                    | 主菜单展开、集合展开                                 | 49 / 178      | 33       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 090  | [MCP 章节 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=115-2)                    | 主菜单展开、集合折叠                                 | 42 / 151      | 28       | 纸纹平铺，1 张原 Three.js 静帧 | 通过 · 源图对照 |
| 091  | [技能文档总览 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=116-2)                                    | 主菜单关闭                                           | 27 / 121      | 13       | 27 个矢量层                    | 通过 · 源图对照 |
| 092  | [技能文档总览 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=117-2)                | 主菜单展开、集合展开                                 | 38 / 159      | 23       | 33 个矢量层                    | 通过            |
| 093  | [技能文档总览 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=118-2)                | 主菜单展开、集合折叠                                 | 31 / 132      | 18       | 27 个矢量层                    | 通过            |
| 094  | [技能文档总览 · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=119-2)                            | 主菜单关闭，320 px 抽屉，目录折叠                    | 27 / 117      | 13       | 27 个矢量层                    | 通过 · 源图对照 |
| 095  | [技能文档总览 · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=120-2)                     | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 30 / 148      | 13       | 42 个矢量层                    | 通过 · 源图对照 |
| 096  | [技能文档总览 · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=121-2)                     | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 30 / 147      | 13       | 42 个矢量层                    | 通过 · 源图对照 |
| 097  | [技能文档总览 · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=122-2)                            | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 33 / 178      | 13       | 57 个矢量层                    | 通过 · 源图对照 |
| 098  | [frontend 集合 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=123-2)                                   | 主菜单关闭                                           | 28 / 169      | 11       | 56 个矢量层                    | 通过 · 源图对照 |
| 099  | [frontend 集合 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=124-2)               | 主菜单展开、集合展开                                 | 39 / 207      | 21       | 62 个矢量层                    | 通过            |
| 100  | [frontend 集合 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=125-2)               | 主菜单展开、集合折叠                                 | 32 / 180      | 16       | 56 个矢量层                    | 通过            |
| 101  | [frontend 集合 · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=126-2)                    | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 28 / 163      | 11       | 56 个矢量层                    | 通过            |
| 102  | [frontend 集合 · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=127-2)                           | 主菜单关闭，320 px 抽屉，目录折叠                    | 25 / 132      | 11       | 41 个矢量层                    | 通过            |
| 103  | [frontend 集合 · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=128-2)                    | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 28 / 162      | 11       | 56 个矢量层                    | 通过            |
| 104  | [frontend 集合 · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=129-2)                           | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 31 / 193      | 11       | 71 个矢量层                    | 通过            |
| 105  | [component-scaffold · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=130-2)                              | 主菜单关闭                                           | 20 / 135      | 6        | 40 个矢量层                    | 通过 · 源图对照 |
| 106  | [component-scaffold · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=132-2)          | 主菜单展开、集合展开                                 | 31 / 173      | 16       | 46 个矢量层                    | 通过            |
| 107  | [component-scaffold · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=133-2)          | 主菜单展开、集合折叠                                 | 24 / 146      | 11       | 40 个矢量层                    | 通过            |
| 108  | [component-scaffold · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=134-2)               | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 20 / 131      | 6        | 40 个矢量层                    | 通过            |
| 109  | [component-scaffold · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=136-2)                      | 主菜单关闭，320 px 抽屉，目录折叠                    | 17 / 98       | 6        | 25 个矢量层                    | 通过            |
| 110  | [component-scaffold · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=137-2)               | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 20 / 128      | 6        | 40 个矢量层                    | 通过            |
| 111  | [component-scaffold · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=138-2)                      | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 23 / 161      | 6        | 55 个矢量层                    | 通过            |
| 112  | [design-tokens · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=139-2)                                   | 主菜单关闭                                           | 23 / 141      | 7        | 42 个矢量层                    | 通过 · 源图对照 |
| 113  | [design-tokens · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=140-2)               | 主菜单展开、集合展开                                 | 34 / 179      | 17       | 48 个矢量层                    | 通过            |
| 114  | [design-tokens · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=141-2)               | 主菜单展开、集合折叠                                 | 27 / 152      | 12       | 42 个矢量层                    | 通过            |
| 115  | [design-tokens · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=142-2)                    | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 23 / 136      | 7        | 42 个矢量层                    | 通过            |
| 116  | [design-tokens · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=143-2)                           | 主菜单关闭，320 px 抽屉，目录折叠                    | 20 / 104      | 7        | 27 个矢量层                    | 通过            |
| 117  | [design-tokens · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=144-2)                    | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 23 / 134      | 7        | 42 个矢量层                    | 通过            |
| 118  | [design-tokens · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=145-2)                           | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 26 / 166      | 7        | 57 个矢量层                    | 通过            |
| 119  | [accessibility-audit · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=146-2)                             | 主菜单关闭                                           | 23 / 141      | 7        | 42 个矢量层                    | 通过 · 源图对照 |
| 120  | [accessibility-audit · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=147-2)         | 主菜单展开、集合展开                                 | 34 / 179      | 17       | 48 个矢量层                    | 通过            |
| 121  | [accessibility-audit · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=148-2)         | 主菜单展开、集合折叠                                 | 27 / 152      | 12       | 42 个矢量层                    | 通过            |
| 122  | [accessibility-audit · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=149-2)              | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 23 / 136      | 7        | 42 个矢量层                    | 通过            |
| 123  | [accessibility-audit · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=150-2)                     | 主菜单关闭，320 px 抽屉，目录折叠                    | 20 / 104      | 7        | 27 个矢量层                    | 通过            |
| 124  | [accessibility-audit · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=151-2)              | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 23 / 134      | 7        | 42 个矢量层                    | 通过            |
| 125  | [accessibility-audit · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=152-2)                     | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 26 / 166      | 7        | 57 个矢量层                    | 通过            |
| 126  | [workflow 集合 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=153-2)                                   | 主菜单关闭                                           | 28 / 169      | 11       | 56 个矢量层                    | 通过 · 源图对照 |
| 127  | [workflow 集合 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=154-2)               | 主菜单展开、集合展开                                 | 39 / 207      | 21       | 62 个矢量层                    | 通过            |
| 128  | [workflow 集合 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=156-2)               | 主菜单展开、集合折叠                                 | 32 / 180      | 16       | 56 个矢量层                    | 通过            |
| 129  | [workflow 集合 · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=157-2)                    | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 28 / 162      | 11       | 56 个矢量层                    | 通过            |
| 130  | [workflow 集合 · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=158-2)                           | 主菜单关闭，320 px 抽屉，目录折叠                    | 25 / 132      | 11       | 41 个矢量层                    | 通过            |
| 131  | [workflow 集合 · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=159-2)                    | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 28 / 163      | 11       | 56 个矢量层                    | 通过            |
| 132  | [workflow 集合 · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=160-2)                           | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 31 / 193      | 11       | 71 个矢量层                    | 通过            |
| 133  | [spec-planning · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=161-2)                                   | 主菜单关闭                                           | 23 / 141      | 7        | 42 个矢量层                    | 通过 · 源图对照 |
| 134  | [spec-planning · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=162-2)               | 主菜单展开、集合展开                                 | 34 / 179      | 17       | 48 个矢量层                    | 通过            |
| 135  | [spec-planning · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=163-2)               | 主菜单展开、集合折叠                                 | 27 / 152      | 12       | 42 个矢量层                    | 通过            |
| 136  | [spec-planning · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=164-2)                    | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 23 / 136      | 7        | 42 个矢量层                    | 通过            |
| 137  | [spec-planning · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=165-2)                           | 主菜单关闭，320 px 抽屉，目录折叠                    | 20 / 104      | 7        | 27 个矢量层                    | 通过            |
| 138  | [spec-planning · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=166-2)                    | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 23 / 135      | 7        | 42 个矢量层                    | 通过            |
| 139  | [spec-planning · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=167-2)                           | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 26 / 167      | 7        | 57 个矢量层                    | 通过            |
| 140  | [code-review · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=168-2)                                     | 主菜单关闭                                           | 23 / 141      | 7        | 42 个矢量层                    | 通过 · 源图对照 |
| 141  | [code-review · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=169-2)                 | 主菜单展开、集合展开                                 | 34 / 179      | 17       | 48 个矢量层                    | 通过            |
| 142  | [code-review · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=170-2)                 | 主菜单展开、集合折叠                                 | 27 / 152      | 12       | 42 个矢量层                    | 通过            |
| 143  | [code-review · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=171-2)                      | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 23 / 135      | 7        | 42 个矢量层                    | 通过            |
| 144  | [code-review · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=172-2)                             | 主菜单关闭，320 px 抽屉，目录折叠                    | 20 / 104      | 7        | 27 个矢量层                    | 通过            |
| 145  | [code-review · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=173-2)                      | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 23 / 135      | 7        | 42 个矢量层                    | 通过            |
| 146  | [code-review · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=174-2)                             | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 26 / 166      | 7        | 57 个矢量层                    | 通过            |
| 147  | [release-notes · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=175-2)                                   | 主菜单关闭                                           | 20 / 135      | 6        | 40 个矢量层                    | 通过 · 源图对照 |
| 148  | [release-notes · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=176-2)               | 主菜单展开、集合展开                                 | 31 / 173      | 16       | 46 个矢量层                    | 通过            |
| 149  | [release-notes · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=177-2)               | 主菜单展开、集合折叠                                 | 24 / 146      | 11       | 40 个矢量层                    | 通过            |
| 150  | [release-notes · 手机 · 目录仅展开 workflow](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=178-2)                    | 主菜单关闭，320 px 抽屉，目录展开 workflow           | 20 / 129      | 6        | 40 个矢量层                    | 通过            |
| 151  | [release-notes · 手机 · 目录两组折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=179-2)                           | 主菜单关闭，320 px 抽屉，目录折叠                    | 17 / 98       | 6        | 25 个矢量层                    | 通过            |
| 152  | [release-notes · 手机 · 目录仅展开 frontend](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=180-2)                    | 主菜单关闭，320 px 抽屉，目录展开 frontend           | 20 / 129      | 6        | 40 个矢量层                    | 通过            |
| 153  | [release-notes · 手机 · 目录两组展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=181-2)                           | 主菜单关闭，320 px 抽屉，目录展开 frontend、workflow | 23 / 160      | 6        | 55 个矢量层                    | 通过            |
| 154  | [MCP 文档 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=182-2)                                        | 主菜单关闭                                           | 9 / 38        | 9        | 7 个矢量层                     | 通过 · 源图对照 |
| 155  | [MCP 文档 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=183-2)                    | 主菜单展开、集合展开                                 | 20 / 75       | 19       | 13 个矢量层                    | 通过            |
| 156  | [MCP 文档 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=184-2)                    | 主菜单展开、集合折叠                                 | 13 / 48       | 14       | 7 个矢量层                     | 通过            |
| 157  | [栏目 A · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=185-2)                                          | 主菜单关闭，栏目 A选中                               | 16 / 48       | 18       | 8 个矢量层                     | 通过 · 源图对照 |
| 158  | [栏目 A · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=186-2)                      | 主菜单展开、集合展开，栏目 A选中                     | 27 / 87       | 28       | 14 个矢量层                    | 通过            |
| 159  | [栏目 A · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=187-2)                      | 主菜单展开、集合折叠，栏目 A选中                     | 20 / 60       | 23       | 8 个矢量层                     | 通过            |
| 160  | [栏目 B · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=188-2)                                          | 主菜单关闭，栏目 B选中                               | 14 / 45       | 17       | 8 个矢量层                     | 通过 · 源图对照 |
| 161  | [栏目 B · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=189-2)                      | 主菜单展开、集合展开，栏目 B选中                     | 25 / 84       | 27       | 14 个矢量层                    | 通过            |
| 162  | [栏目 B · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=191-2)                      | 主菜单展开、集合折叠，栏目 B选中                     | 18 / 57       | 22       | 8 个矢量层                     | 通过            |
| 163  | [项目开发文档 · 手机 · 默认](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=192-2)                                    | 主菜单关闭                                           | 9 / 38        | 8        | 7 个矢量层                     | 通过 · 源图对照 |
| 164  | [项目开发文档 · 手机 · 主菜单展开、技能集合展开](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=193-2)                | 主菜单展开、集合展开                                 | 20 / 75       | 18       | 13 个矢量层                    | 通过            |
| 165  | [项目开发文档 · 手机 · 主菜单展开、技能集合折叠](https://www.figma.com/design/xd4v3YLbHr6MFrshieoSPs/Untitled?node-id=194-2)                | 主菜单展开、集合折叠                                 | 13 / 48       | 13       | 7 个矢量层                     | 通过            |
