<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## 它所做的事情

Polyglot 在您的本地 GPU 上运行 [TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma)，并通过 [Ollama](https://ollama.com) 实现。它不需要 API 密钥，也不使用云服务，您的数据不会离开您的机器。

- **翻译选定文本** — 选中文本，按下 `Ctrl+Alt+T`，选择目标语言。完成。
- **翻译文件** — 将整个文件翻译成一个新的 `file.ja.ext` 文件，与原始文件并存。
- **翻译 README** — 批量将您的 README.md 文件翻译成 7 种语言，同时保留代码块、表格和徽章。
- **侧边栏面板** — 在活动栏中显示地球图标，带有操作按钮和 Ollama 的实时状态。

## 要求

- 已安装并正在运行 [Ollama](https://ollama.com)
- 具有足够 VRAM 的 GPU（用于 `translategemma:12b` 需要 12GB，用于 `translategemma:2b` 需要 2GB）
- 模型将在首次使用时自动下载

## 入门

1. 安装扩展程序
2. 点击活动栏（左侧边栏）中的地球图标
3. 点击 **检查状态** — Polyglot 将启动 Ollama，并在需要时下载模型
4. 选中一些文本，然后按下 `Ctrl+Alt+T`（在 macOS 上为 `Cmd+Alt+T`）

## 命令

| 命令 | 快捷键 | 描述 |
|---------|----------|-------------|
| **Polyglot: 翻译选定文本** | `Ctrl+Alt+T` | 原地翻译选中的文本 |
| **Polyglot: Translate File** | — | 将当前文件翻译成一个新的文件 |
| **Polyglot: 翻译 README** | — | 批量将 README.md 文件翻译成多种语言 |
| **Polyglot: Check Status** | — | 验证 Ollama 连接和模型可用性 |
| **Polyglot: Help** | — | 快速访问设置、教程和链接 |

## 访问点

- **侧边栏面板** — 活动栏中的地球图标，带有美观的操作按钮
- **编辑器标题栏** — 当选中文本时，会显示地球图标
- **右键菜单** — 编辑器上下文菜单中的“翻译选定文本”
- **命令面板** — `Ctrl+Shift+P` → 输入“Polyglot”
- **键盘快捷键** — 选中文本后，按下 `Ctrl+Alt+T`

## 设置

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | Ollama 服务器 URL |
| `polyglot.model` | `translategemma:12b` | 翻译模型（尝试 `2b` 以减少 VRAM 占用） |
| `polyglot.defaultSourceLanguage` | `en` | 翻译的源语言 |
| `polyglot.defaultLanguages` | 7 种语言 | README 翻译的目标语言 |

## 支持的语言

阿拉伯语、孟加拉语、保加利亚语、加泰罗尼亚语、中文（简体和繁体）、克罗地亚语、捷克语、丹麦语、荷兰语、英语、爱沙尼亚语、芬兰语、法语、德语、希腊语、古吉拉特语、希伯来语、印地语、匈牙利语、印度尼西亚语、意大利语、日语、卡纳达语、韩语、拉脱维亚语、立陶宛语、马其顿语、马来语、马拉雅拉姆语、马拉地语、挪威语、波斯语、波兰语、葡萄牙语、罗马尼亚语、俄语、塞尔维亚语、斯洛伐克语、斯洛文尼亚语、西班牙语、斯瓦希里语、瑞典语、泰米尔语、泰卢固语、泰语、土耳其语、乌克兰语、乌尔都语、越南语和威尔士语。

## 工作原理

Polyglot 包装了 [@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp)，这是一个本地翻译引擎，它：

1. 如果 Ollama 未运行，则自动启动它
2. 首次使用时自动下载 TranslateGemma 模型
3. 将长文本在段落/句子边界处分割成小块
4. 应用软件词汇表以提高技术术语的翻译准确性
5. 清理常见的模型问题（重复的替代方案、尾随的句点）

对于 README 翻译，它使用智能分段——代码块、HTML 徽章和 URL 不会被修改，而标题、段落和表格内容会被翻译。

## 安全性和数据范围

**涉及的数据：** 正在使用的编辑器中的文本（仅读，用于选择；可写，用于替换），以及工作区中的文件（用于“翻译文件”/“翻译 README”，会创建新的文件，与原始文件并存）。
**未涉及的数据：** 工作区之外的文件，操作系统凭据，浏览器数据。
**网络：** 仅连接到本地的 Ollama 服务器（默认地址为 `localhost:11434`）——**不涉及任何云端数据传输**。
**不收集或发送任何遥测数据。**

## 许可证

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
