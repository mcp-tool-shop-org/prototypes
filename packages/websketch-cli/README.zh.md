<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## 概述

- **ASCII 渲染**：将任何 WebSketch 截图转换为适合终端或 LLM 上下文窗口的盒图布局。
- **结构指纹**：对页面的布局进行哈希处理，以便在不进行像素差异比较的情况下检测更改。
- **语义差异**：比较两个截图，并生成一个排序的变更报告（添加、移动、调整大小、文本更改）。
- **捆绑打包**：将截图（以及可选的差异）合并到单个可共享的 `.ws.json` 文件中。
- **流水线优先**：每个命令都支持 `--json` 输出以及用于 CI 脚本的确定性退出码。
- **LLM 优化模式**：`--llm` 标志生成包含丰富元数据的输出，专为代理程序使用而设计。

## 安装

```bash
pnpm add -g @mcptoolshop/websketch
```

或者，无需安装即可运行：

```bash
npx @mcptoolshop/websketch render capture.json
```

## 命令

### validate

检查截图文件是否符合 WebSketch IR 模式。

```bash
websketch validate capture.json
```

### render-ascii

将截图渲染为 ASCII 艺术（LLM 可读）。

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**示例输出：**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

计算结构指纹以进行比较。

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

比较两个截图并报告更改。

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

将一个或多个截图打包到可共享的 `.ws.json` 文件中。当提供两个截图时，该捆绑包会自动包含差异摘要。

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## 流水线模式

在任何命令之前添加 `--json` 以获得机器可读的输出：

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**成功：** `{ "ok": true, ... }`

**错误：** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

即使在 JSON 模式下，退出码仍然有效。在脚本中使用 `$?` 或 `set -e`。

## 退出码

| Code | 含义 |
| ------ | --------- |
| 0 | 成功 |
| 1 | 验证/数据错误（无效 JSON、无效截图、未知命令） |
| 2 | 文件系统错误（文件未找到、权限被拒绝、I/O 错误） |

## 截图格式

此 CLI 适用于 WebSketch IR 截图文件（JSON）。使用以下方法创建截图：

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension)：Chrome 扩展程序，用于一键页面截图。
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)：用于以编程方式创建截图。

## 文档

| 文档 | 描述 |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | 深入指南：架构、命令、流水线模式、集成。 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 如何贡献、开发环境设置、PR 指南。 |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | 社区标准。 |
| [CHANGELOG.md](CHANGELOG.md) | 发布历史。 |

## 许可证

MIT
