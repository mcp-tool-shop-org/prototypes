<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> [MCP Tool Shop](https://mcptoolshop.com) 的一部分

**用于多链共识治理的模块化、无依赖的控制平面。**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## 为什么选择 ConsensusOS？

运行多链基础设施意味着您需要信任您无法完全控制的节点，发布必须保持一致的版本，并在永不停止的网络中管理配置更改。大多数团队使用临时脚本来完成这些任务，并寄希望于一切顺利。

ConsensusOS 用一个 **基于插件的控制平面** 替代了这种不确定性，其中每个模块通过共享事件总线进行通信，每个状态转换都受到失效保护机制的约束，并且整个系统的历史记录可以确定性地重放。

- **零生产依赖**：您的供应链中没有任何您没有编写的代码。
- **冻结的插件 API v1**：稳定的接口，不会破坏您的集成。
- **失效保护机制**：无效的转换始终会被拒绝，而不会部分应用。
- **确定性重放**：可以从事件历史记录中重现任何系统状态。
- **资源限制执行**：通过令牌强制执行 CPU、内存和时间限制。
- **多链适配器**：XRPL、以太坊和 Cosmos 平台开箱即用。

---

## 安装

```bash
npm install @mcptoolshop/consensus-os
```

需要 **Node.js 18+**。没有运行时依赖。

---

## 快速开始

### 编程用法

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

// Create the loader (orchestrates plugin lifecycle)
const loader = new CoreLoader({
  configs: {
    "health-sentinel": { intervalMs: 10_000 },
  },
});

// Register plugins
loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());
loader.register(createXrplAdapter());

// Boot resolves dependencies, inits, and starts all plugins
await loader.boot();

// Subscribe to events
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});

// Check invariants before a state transition
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);

// Graceful shutdown (reverse boot order)
await loader.shutdown();
```

### 构建自定义插件

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data as Record<string, unknown>);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### 命令行工具 (CLI)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## 架构

```
┌─────────────────────────────────────────────────┐
│                   CLI (entry)                   │
├─────────────────────────────────────────────────┤
│              Plugin SDK / Attestation           │
├──────────┬──────────┬──────────┬────────────────┤
│  Health  │ Verifier │  Config  │    Sandbox     │
│ Sentinel │ (Release)│ Guardian │ (Replay/Amend) │
├──────────┴──────────┴──────────┼────────────────┤
│           Governor Layer       │   Adapters     │
│  (Token · Policy · Queue)     │ (XRPL/ETH/ATOM)│
├────────────────────────────────┴────────────────┤
│                 Core Layer                      │
│    EventBus · InvariantEngine · Loader · Logger │
├─────────────────────────────────────────────────┤
│              Plugin API v1 (frozen)             │
└─────────────────────────────────────────────────┘
```

请参阅 [ARCHITECTURE.md](ARCHITECTURE.md) 以获取完整的规范。

---

## API 接口

### 核心

| 导出 | 描述 |
| -------- | ------------- |
| `CoreLoader` | 插件生命周期管理器：注册、启动、停止 |
| `CoreEventBus` | 有序、类型化、可重放的事件总线，支持通配符订阅 |
| `CoreInvariantEngine` | 失效保护机制引擎，采用仅追加注册方式 |
| `createLogger(scope)` | 模块范围的结构化日志记录器 |

### 模块

| 工厂 | 用途 |
| --------- | --------- |
| `createHealthSentinel()` | 通过心跳监控节点健康状况 |
| `createReleaseVerifier()` | 软件发布哈希验证 |
| `createConfigGuardian()` | 配置模式验证和迁移 |
| `createSandboxPlugin()` | 隔离的模拟、重放和修改引擎 |
| `createGovernorPlugin()` | 基于令牌的执行、策略执行、构建队列 |

### 适配器

| 工厂 | Chain | 状态 |
| --------- | ------- | -------- |
| `createXrplAdapter()` | XRPL | 已实现 |
| `createEthereumAdapter()` | 以太坊 | 已实现 |
| `createCosmosAdapter()` | Cosmos | 已实现 |

### 插件 SDK

| 导出 | 描述 |
| -------- | ------------- |
| `BasePlugin` | 具有默认生命周期和便捷方法的抽象基类 |
| `ManifestBuilder` | 用于类型安全插件清单的流畅构建器 |
| `validatePlugin()` | 预注册验证，包含错误和警告 |
| `AttestationPipeline` | 发布证明和构建溯源 |

### 子路径导出

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## 测试

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

测试类别：
- **架构** (16 个测试) — 结构性不变性强制
- **安全** (27 个测试) — 防滥用和确定性
- **压力** (22 个测试) — 边缘情况和吞吐量
- **单元** (230 个测试) — 组件级别覆盖

---

## 文档

| 文档 | 用途 |
| ---------- | --------- |
| [QUICKSTART.md](QUICKSTART.md) | 3 分钟内开始使用 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 冻结的 v1.0 架构规范 |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | 如何编写插件 |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | 如何创建链适配器 |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | 沙箱、回放和修改流程。 |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | 令牌执行、策略、构建队列。 |
| [SECURITY.md](SECURITY.md) | 安全策略和漏洞报告。 |
| [THREAT_MODEL.md](THREAT_MODEL.md) | STRIDE 威胁分析。 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 开发流程和代码审查清单。 |
| [BUILD.md](BUILD.md) | 可重现的构建和验证。 |

---

## 支持

- **问题/帮助：** [讨论](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **Bug 报告：** [问题](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## 许可证

[MIT](LICENSE)
