<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**仅包含元数据的注册表——所有 MCP Tool Shop 工具的唯一权威来源。**

每次提交都会进行模式验证。工具按照规则构建成预定义的集合。预构建的搜索索引包含在软件包中。固定一个版本，每次都能获得确定的元数据。

## 快速入门

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## 概述

- **仅包含数据**——不包含任何可执行代码，仅包含生态系统中每个工具的 JSON 元数据。
- **模式验证**——每个条目在提交和 CI 过程中都会根据 JSON Schema 进行检查。
- **集合系统**——工具按照规则划分为预定义的集合（`core`、`agents`、`ops`、`evaluation`），而不是手动进行整理。
- **快速发现**——预构建的搜索索引，包含关键词和筛选条件，包含在软件包中。
- **最小权限**——工具默认情况下没有任何权限；副作用是可选的，并且必须明确声明。
- **可重现性**——固定一个注册表版本，每次都能获得确定的元数据。

## 用户

### 完整注册表

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### 集合

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

可用的集合：`core`、`agents`、`ops`、`evaluation`。

### 搜索索引

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### LLM 上下文

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## 集合

| 集合           | 描述                   | 选择逻辑                                   |
| -------------- | ---------------------- | ------------------------------------------ |
| **core**       | 基本实用工具           | 显式 ID 列表                               |
| **agents**     | 代理编排、导航、上下文 | 显式 ID + `agents` 标签                    |
| **ops**        | DevOps、基础设施、部署 | 标签：`automation`、`packaging`、`release` |
| **evaluation** | 测试、基准测试、覆盖率 | 标签：`testing`、`evaluation`、`benchmark` |

## 结构

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## 添加工具

1. 阅读 [docs/registry-guidelines.md](docs/registry-guidelines.md)
2. 在 `registry.json` 中添加一个条目（按 `id` 排序）。
3. 运行 `npm run validate` 和 `npm run policy`。
4. 提交一个 Pull Request。

## 版本控制

v1 版本的规范是稳定的。在次版本中可能会添加新的可选字段；在主版本中，必需字段和现有字段的结构不会发生变化。

## 生态系统

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)** —— 发现、安装和运行工具。
- **[提交工具](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)** —— 将您的工具添加到生态系统中。

## 许可证

MIT —— 详情请参见 [LICENSE](LICENSE)。
