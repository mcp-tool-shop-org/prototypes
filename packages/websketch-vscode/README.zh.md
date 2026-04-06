<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## 问题

您希望一个大型语言模型（LLM）能够理解网页的布局、导航、交互元素以及内容层级结构。目前可用的方法都存在不足：

| 方法 | 令牌（Token） | 您将失去的内容 |
|----------|--------|---------------|
| **Screenshot** | 1000+（视觉信息） | 无法识别小文本，只能猜测布局，无法获取任何交互信息。 |
| **Raw HTML** | 50,000 - 500,000 | 被大量的 `div` 标签、内联样式、脚本和 SVG 噪音淹没。 |
| **Readability extract** | 2,000 - 10,000 | 剥离所有结构，没有导航、按钮或表单。 |
| **DOM dump** | 10,000 - 100,000 | 到处都是类名、数据属性和框架相关的代码。 |

核心问题：**这些方法都无法理解用户界面的语言**。大型语言模型不需要 `<div class="sc-bdnxRM jJFqsI">`，它们需要 `NAV`、`BUTTON`、`CARD`、`LIST`。

## 解决方案

WebSketch 将网页转换为一个**语义树**，使用了 23 种用户界面基本元素。只需在 VS Code 中单击一次，然后将结果复制到任何大型语言模型中：

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200 - 800 个令牌**。而不是 50,000 个。也不是像素网格。这是一个清晰的树状结构，任何文本模型都可以理解。

### 对比

| 指标 | WebSketch | 原始 HTML | 屏幕截图 |
|--------|-----------|----------|------------|
| **Tokens** | 200 - 800 | 50,000+ | 1000+（视觉信息） |
| **Structure** | 完整的语义树 | 嵌套的 `div` 混乱 | 像素网格 |
| **Text content** | 带引号，带标签 | 隐藏在标记中 | 依赖于 OCR 技术 |
| **Interactive elements** | 用 `*` 标记 | 隐藏在属性中 | 不可见 |
| **Heading hierarchy** | `<h1>` 到 `<h6>` | 隐藏在类名中 | 根据大小猜测 |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | 需要 DOM 知识 | 不可用 |
| **Works with** | 任何文本大型语言模型 | 没有任何有用的信息 | 仅限视觉模型 |

## 快速开始

1. 从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) 安装，或者运行：
```
ext install mcp-tool-shop.websketch-vscode
```
2. 打开命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. 运行 **WebSketch: Capture URL**
4. 粘贴一个 URL 并按 Enter 键
5. 单击 **Copy for LLM** 并将结果粘贴到您的提示中

LLM 选项卡是默认视图。单击一次即可将树状结构复制到剪贴板，以便用于任何模型。

## 工作原理

树状结构中的每一行都包含丰富的信息，并且易于机器解析：

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### 语法

| 符号 | 含义 | 示例 |
|--------|---------|---------|
| `*` 前缀 | 用户可以与之交互 | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | 保留 HTML5/ARIA 的含义 | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | 布局行为 | `{sticky}`, `{scrollable}` |
| `"label"` | 可见的文本内容 | `"Sign up free"`, `"Search..."` |
| `(N items)` | 列表项数量 | `LIST (12 items)` |
| 缩进 | 父子层级关系 | `HEADER > NAV > LIST > LINK` |

### 23 种角色

| 类别 | 角色 |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

这 23 种角色是一个固定的词汇表，适用于每个网站。大型语言模型只需学习一次，即可理解任何页面。

## 捕获的内容

WebSketch 不仅仅是提取 DOM 树。它会对每个可见元素运行一个**五层分类器**：

| 层级 | 来源 | 示例 |
|------|--------|---------|
| 1. **ARIA 角色** | `role="navigation"` | &rarr; `NAV` |
| 2. **HTML 标签** | `<button>`, `<h1>` | &rarr; `BUTTON`、`TEXT <h1>` |
| 3. **类名启发式** | `.card`, `.modal`, `.toast` | &rarr; `CARD`、`MODAL`、`TOAST` |
| 4. **结构分析** | 3+ 个具有相同角色的兄弟元素 | &rarr; `LIST` |
| 5. **备用方案** | 仅包含文本的元素 | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

然后进行清理：

- **透明表遍历**：`TR`/`TD`/`TH`/`LI` 元素会被跳过，子元素会被提升到顶层。
- **零内容节点裁剪**：空、非交互式、不可见节点会被移除。
- **包装器折叠**：无意义的单子节点 `SECTION` 包装器会被移除。
- **级联裁剪**：没有内容的空包装器链会被完全消除。
- **标签提取**：从链接、按钮、标题、图像、输入框中提取可见文本。

结果：一个干净的树结构，只包含理解页面所需的最小节点。

## 使用场景

### 面向提示工程师

**“描述此页面的布局”**：粘贴树结构。大型语言模型（LLM）可以清晰地看到结构、标题和导航，而不会被 HTML 代码淹没。适用于 ChatGPT、Claude、Gemini、Llama 等任何文本模型。

**“用户可以在此页面上做什么？”**：每个交互式元素都用 `*` 标记。链接、按钮、输入框、复选框等，所有元素都带有其可见文本标签。大型语言模型可以枚举所有可能的用户操作。

**“比较这两个页面”**：两个树结构并排显示。大型语言模型可以比较结构、发现缺失的元素、比较导航模式，所有这些只需要几百个令牌。

### 面向开发人员

**“为此 UI 生成测试计划”**：树结构直接映射到测试目标。`*BUTTON "Submit"`、`*INPUT <email> "Enter email"`、`*LINK "Terms"`，每个元素都是一个可测试的交互，并带有其可见标签。

**“构建一个看起来像这样的东西”**：语义树结构接近组件层次结构。`HEADER > NAV > LIST > LINK` 直接映射到 React/Vue/Svelte 组件。大型语言模型可以生成匹配的布局。

**“审计此页面以检查可访问性”**：缺失的标记、未标记的输入框、标题层级结构不完整等问题，都可以在树结构中看到。语义提示，如 `<main>`、`<nav>`、`<search>`，显示了哪些 ARIA 角色存在（或缺失）。

### 面向 AI 代理

**MCP 集成**：使用 [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) 为您的 AI 代理提供捕获和推理任何网页的能力，使其成为工具链的一部分。

**自动化监控**：使用 [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) 定期捕获页面，比较树结构，并检测结构性变化。

## 四种视图

| 标签 | 显示内容 | 最适合 |
|-----|---------------|----------|
| **LLM** (default) | 带有标签、语义、标志的缩进语义树 | 粘贴到大型语言模型提示中 |
| **ASCII** | 带有空间布局的盒线图 | 视觉布局理解 |
| **Tree** | 带有颜色编码角色的可折叠节点树 | 调试捕获 |
| **JSON** | 完整的 `WebSketchCapture` 中间表示 (IR)，带有语法高亮 | 程序化使用和流水线 |

## 命令

| 命令 | 描述 |
|---------|-------------|
| `WebSketch: Capture URL` | 提示 URL、捕获和显示 |
| `WebSketch: Capture URL from Clipboard` | 捕获剪贴板中的任何 URL |
| `WebSketch: Copy LLM Tree to Clipboard` | 复制树结构，直接粘贴到 ChatGPT、Claude 等中。 |
| `WebSketch: Export LLM Tree` | 保存为 `.md` 文件，用于提示库或文档。 |
| `WebSketch: Export Capture as JSON` | 完整 IR 捕获，包含边框、哈希值、元数据。 |
| `WebSketch: Export ASCII Wireframe` | 盒线图布局视图 |

## 设置

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `websketch.chromePath` | 自动检测 | Chrome 或 Edge 可执行文件路径 |
| `websketch.viewportWidth` | `1280` | 视口宽度（像素） |
| `websketch.viewportHeight` | `800` | 视口高度（像素） |
| `websketch.timeout` | `30000` | 导航超时时间（毫秒） |
| `websketch.waitAfterLoad` | `1000` | JavaScript 渲染的额外等待时间（毫秒） |

## 生态系统

WebSketch 是一系列工具，它们基于共享的语法。

| 软件包 | 功能 |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | 核心 IR（中间表示）—— 语法、验证、渲染、差异比较、指纹识别。 |
| **websketch-vscode** | VS Code 扩展程序——从您的编辑器捕获页面（此仓库）。 |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | 命令行捕获和渲染。 |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Chrome 扩展程序，用于在浏览器中捕获。 |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | MCP 服务器，用于 LLM 代理集成。 |

所有工具都生成相同的 `WebSketchCapture` IR，因此不同流水线的输出可以互相替换。

## 需求

- VS Code 1.85 或更高版本
- 您的系统上已安装 Chrome 或 Edge 浏览器

不包含任何捆绑的浏览器。没有 200MB 的下载。WebSketch 使用 `puppeteer-core`，并使用您已有的浏览器。

## 安全性和数据范围

**涉及的数据：** 用户输入的 URL（通过 `puppeteer-core` 使用本地 Chrome/Edge 浏览器以无头模式访问），捕获的页面内容转换为 IR 树，导出的文件写入工作区文件或剪贴板。 **未涉及的数据：** 不涉及工作区以外的文件，不涉及操作系统凭据，不涉及浏览器登录会话（无头模式，无用户配置文件）。 **网络：** 仅导航到用户指定的 URL，不进行其他外部请求。 **不收集或发送任何遥测数据。**

## 许可证

MIT 许可证——详情请参见 [LICENSE](LICENSE)。

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
