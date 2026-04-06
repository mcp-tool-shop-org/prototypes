<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[MCP Tool Shop](https://github.com/mcp-tool-shop) 的示例工作空间。

## MCP Tool Shop 的组成部分

- **注册表** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → 现有工具的列表
- **命令行界面 (CLI)** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → 如何使用这些工具
- **示例** → 如何学习使用方法（此仓库）
- **标签** (v0.1.0, v0.2.0) → 稳定性、可重复性
- **main 分支** → 仅用于开发；可能会在未事先通知的情况下更改；构建可能出现问题
- **工具默认采用最小权限原则** → 不涉及网络连接、不进行写入操作、不产生副作用
- **功能始终显式且需要手动启用** → 您决定何时启用

## 示例

| 示例 | 描述 |
| --------- | ------------- |
| [hello-tools](./hello-tools/) | 2 分钟内创建您的第一个 MCP 工作空间 |
| [hello-filesystem](./hello-filesystem/) | 安全地处理不可逆的副作用 |

## 快速入门

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## 相关内容

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - 用于发现和运行工具的命令行界面
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - 工具元数据注册表
