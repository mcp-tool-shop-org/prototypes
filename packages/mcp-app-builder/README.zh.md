<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

> 使用带有交互式 UI 组件的 MCP 服务器构建工具，直接在 VS Code 中进行操作。

## 概述

**MCP 应用构建工具** 帮助开发人员快速创建、测试和部署 MCP（模型上下文协议）服务器。它支持新的 **MCP 应用** 标准（2026 年 1 月），从而可以直接在 AI 对话中集成交互式 UI 组件。

## 功能

### 脚手架
- **新建服务器向导**：使用引导式设置创建 MCP 服务器
- **模板**：基本、带 UI 和完整服务器配置
- **自动配置**：TypeScript、MCP SDK 和项目结构

### 开发
- **模式验证**：实时验证 `mcp.json` 和 `mcp-tools.json` 文件
- **保存时自动验证**：保存时自动检查模式（可配置）
- **类型生成**：从工具定义生成 TypeScript 类型
- **智能提示**：为配置文件提供 JSON 模式支持

### 测试
- **测试框架**：针对您的 MCP 工具运行测试
- **自动生成的测试**：根据工具定义和示例创建测试
- **输出通道**：格式化的测试结果，显示通过/失败状态

### 仪表盘
- **可视化界面**：快速访问所有命令
- **工作区集成**：自动检测 MCP 项目
- **状态栏**：在 MCP 项目中显示 MCP 指示器

## 快速开始

1. **从 VS Code Marketplace 安装扩展**（即将推出）
2. **创建新的服务器**：`Cmd+Shift+P` → "MCP: 新建服务器"
3. **选择一个模板**：
- `basic` - 简单的 "Hello World" 服务器
- `with-ui` - 带有表格和图表 UI 组件的服务器
- `full` - 完整的服务器，包含工具、资源和提示

## 键盘快捷键

| 快捷键 | 命令 |
|----------|---------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` on Mac) | 新建服务器 |
| `Ctrl+Alt+V` (`Cmd+Alt+V` on Mac) | 验证模式 |

## 命令

| 命令 | 描述 |
|---------|-------------|
| `MCP: New Server` | 创建新的 MCP 服务器项目 |
| `MCP: Validate Schema` | 验证当前的 `mcp.json` 或 `mcp-tools.json` 文件 |
| `MCP: Generate Types` | 从工具定义生成 TypeScript 类型 |
| `MCP: Test Server` | 针对您的 MCP 工具运行测试 |
| `MCP: Open Dashboard` | 打开可视化仪表盘 |

## 设置

| 设置 | 默认 | 描述 |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | 新建服务器的默认模板（基本/带 UI/完整） |
| `mcp-app-builder.autoValidate` | `true` | 保存时自动验证模式 |
| `mcp-app-builder.testPort` | `3000` | MCP 测试服务器的端口 |

## MCP 应用 UI 组件

该扩展程序提供了 MCP 应用 UI 组件的构建工具：

```typescript
import { table, chart, form, card } from '@mcp-app-builder/ui-components';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a dashboard with metrics
const dashboard = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: lineChart,
});
```

## 文件结构

生成的 MCP 服务器项目遵循以下结构：

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## 开发

### 先决条件

- Node.js 18+
- VS Code 1.85+

### 设置

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### 运行

在 VS Code 中按下 `F5` 键以启动扩展开发主机。

### 测试

```bash
npm test
```

## 路线图

### 第一阶段（当前） - 确定性基础
- [x] 使用模板进行项目脚手架
- [x] 模式验证系统
- [x] 从模式生成类型
- [x] UI 组件基础
- [x] 测试框架基础
- [x] 仪表盘 Web 视图

### 第二阶段 - AI 辅助开发
- [ ] 从自然语言生成 AI 工具
- [ ] 为工具处理程序提供智能代码补全
- [ ] 自动生成文档

### 第三阶段 - 发布与分发
- [ ] 一键发布到 MCP 注册中心
- [ ] 版本管理
- [ ] 依赖项解析

### 第四阶段 - 视觉构建器
- [ ] 拖放式 UI 组件构建器
- [ ] MCP 应用的实时预览
- [ ] 视觉流程编辑器

## 贡献

欢迎贡献！请阅读我们的贡献指南（即将发布）。

## 安全与隐私

**访问的数据：** 工作区文件（mcp.json、mcp-tools.json、生成的 TypeScript 文件）、VS Code 设置、扩展输出通道。

**未访问的数据：** 除了 MCP 配置文件之外的源代码、Git 历史记录、网络（除了本地测试环境）、凭据、环境变量。 不会收集或发送任何遥测数据。

**权限：** 针对代码生成和类型生成，需要工作区的文件系统读写权限；针对测试环境，需要本地网络访问权限。 详细权限策略请参见 [SECURITY.md](SECURITY.md)。

## 许可证

MIT

## 链接

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [GitHub 组织](https://github.com/mcp-tool-shop-org)

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
