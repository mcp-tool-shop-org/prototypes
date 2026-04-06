<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**重新掌握您的代码。**

Code Bearings 是一个基于源代码的控制界面，适用于现代代码库。它将您的 TypeScript 项目索引为一个包含文件、符号、模块和依赖关系的图表，然后将这些信息映射到您需要的各个方面：命令行界面、VS Code、CI/CD。

信息始终保持一致。人工智能用于解释、教学和呈现。人类始终掌握控制权。

## 它能做什么

| 界面 | 您将获得什么 |
|---------|-------------|
| **CLI** | `code-bearings analyze` 命令用于索引您的项目。`code-bearings review` 命令可以根据任何 Git 差异生成变更摘要，并进行风险评估，提供证据支持，以及审查人员的指导。 |
| **VS Code** | 活动栏树状结构、交互式审查面板、悬停提示、CodeLens 注释、代码区装饰、状态栏上下文——所有这些都来自同一个一致的信息源。 |
| **CI** | `code-bearings ci` 命令生成审查报告（Markdown、JSON、HTML），并可以选择在风险阈值超出时失败。 |

## 安装

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## 快速开始

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## 架构

Code Bearings 是一个单仓库项目，包含三个软件包，它们遵循严格的分层协议：

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**核心模块负责提供信息。** 命令行界面非常简洁。扩展程序也非常简洁。没有衍生产品。

### 三个信息层级

| 层级 | 内容 | 示例 |
|-------|------|---------|
| **A. Extracted Truth** | 从源代码提取的事实 | “函数 X 调用函数 Y” |
| **B. Derived Structure** | 由 A 层级计算得出 | “模块 M 的扇入数为 7，风险评分为 25” |
| **C. Human Narration** | 对 A+B 的解释 | “此更改从高流量路径中删除了错误处理” |

### 五种用途模式

通用审查模式提供真实信息。其他模式可以帮助人类利用这些信息进行思考。

| 模式 | 视角 |
|------|------|
| **General** | 规范的变更摘要——发生了什么变化，风险，证据 |
| **Bug Hunter** | 失败假设、盲点、检查提示 |
| **Learning** | 语法翻译、变更前后解释 |
| **Architecture** | 模块角色、边界健康状况、系统位置 |
| **Exploration** | 针对不熟悉的代码库的引导性问题 |

## 软件包

| 软件包 | 描述 | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | 共享提取、图表、审查和渲染逻辑 | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | 命令行界面 | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | VS Code 扩展 | — |

## 要求

- Node.js >= 20
- 具有 `tsconfig.json` 文件的 TypeScript 项目
- Git（用于审查/比较命令）

## 安全与信任

- **无网络访问。** 没有遥测。没有分析。没有数据传输。
- **只读源代码访问。** Code Bearings 通过 AST 解析读取您的源代码文件。它永远不会修改它们。
- **仅本地数据库。** `.code-bearings/bearings.db` SQLite 文件始终位于您的项目中。
- **无代码执行。** 仅进行静态分析。

请参阅 [SECURITY.md](SECURITY.md) 以获取完整的威胁模型。

## 许可证

[MIT](LICENSE)

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
