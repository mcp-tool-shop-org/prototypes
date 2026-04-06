<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## 为什么？

大型语言模型（LLMs）容易遗忘信息。一些零星的想法、未完成的顾虑，以及那些“我们应该回头再讨论”但最终被忽略的话题。**mcp-aside** 为模型提供一个专门的收件箱，用于存放这些被暂时搁置的信息。该收件箱具有速率限制、去重和自动过期等功能，以防止其自身成为一个问题。

把它想象成一个放在对话旁边的便签纸。模型会写下一些笔记。您（或模型）可以在适当的时候阅读这些笔记。

## 工作原理

1. 模型会使用一个想法，并将其通过 `aside.push` 方法发送出去，该想法会根据优先级进行标记。
2. 保护机制会检查是否存在重复项、速率限制以及时间限制。
3. 如果通过检查，该信息会存储在内存中的收件箱中。
4. 客户端会通过 `notifications/resources/updated` 接口收到通知。
5. 任何人都可以通过 `interject://inbox` 资源访问收件箱。

没有数据库。没有数据持久化。如果服务器停止运行，收件箱中的内容将会丢失——这是设计上的一个特点。

## 快速入门指南

```bash
npm install
npm run build
node build/index.js
```

服务器使用 MCP 协议通过标准输入/输出 (stdio) 进行通信。可以将任何兼容 MCP 协议的客户端连接到该服务器：

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## 工具

| 工具。 | 它的作用/功能。 |
| Please provide the English text you would like me to translate. I am ready to assist you. | Please provide the English text you would like me to translate. I am ready to assist you. |
| `aside.push` | 将一条消息插入收件箱。支持以下参数：`text`（消息内容），`priority`（优先级，可选项：低、中、高），`reason`（原因），`tags`（标签），`expiresAt`（过期时间），`source`（来源）以及 `meta`（元数据）。 |
| `aside.configure` | 在运行时调整安全防护机制，包括：TTL（生存时间）限制、速率限制、去重窗口以及通知阈值。 |
| `aside.clear` | 清理收件箱。 |
| `aside.status` | 仅供读取的收件箱大小和当前安全策略配置快照。 |

## 资源

| URI (统一资源标识符) | 描述。 |
| Please provide the English text you would like me to translate. I am ready to assist you. | Please provide the English text you would like me to translate. I am ready to assist you. |
| `interject://inbox` | JSON 数组，包含待处理的插入内容，按最新排序。已过期的条目在读取时会被过滤掉。 |

## 护栏

所有配置项都可以通过 `aside.configure` 函数进行设置。默认设置如下：

| 场景设置。 | 默认设置。 | 它控制的内容。 |
| Please provide the English text you would like me to translate. I am ready to assist you. | Please provide the English text you would like me to translate. I am ready to assist you. | Please provide the English text you would like me to translate. I am ready to assist you. |
| `defaultTtlSeconds` | 600 (10分钟) | 如果未设置明确的过期时间，一个临时数据的有效时长是多久？ |
| `maxTtlSeconds` | 3600分钟（1小时） | 即使调用者请求更高的值，TTL（传输时间限制）也存在上限。 |
| `dedupeWindowSeconds` | 300 (5分钟) | 相同优先级、文本内容和原因组合会导致信息在当前窗口中被屏蔽。 |
| `rateLimitWindowSeconds` | 60 | 滑动窗口限流机制。 |
| `rateLimitMax` | 低：6，中：3，高：1。 | 每个优先级，每个窗口允许的最大推送数量。 |
| `notifyAtOrAbove` | 高。 | 仅为优先级等于或高于此级别的项目发送日志通知。 |

## 配置

### 定时触发

内置定时器每5分钟触发一次，执行一个低优先级的“是否存在任何阻塞？”的检查。它遵循与手动触发相同的规则（因此，它会像其他操作一样被去重或限速）。要禁用它，请在 `index.ts` 文件中注释掉 `startTimerTrigger` 的调用。

### MCP 检查员

用于本地测试：

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## 注释

- 日志信息输出到标准错误流（stderr），标准输出流（stdout）则保留用于 MCP JSON-RPC 通信。
- 收件箱是临时的。重启系统会清除所有内容。
- 消息按最新时间排序存储。过期消息会在每次读取和推送时被清理。

## 许可

[麻省理工学院] (LICENSE)

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 制作。
