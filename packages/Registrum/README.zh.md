<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/registrum"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>一个受控、双重验证、确定性的注册器，具有可重放的历史记录，并提供可选的外部验证功能。</strong></p>

---

## 什么是 Registrum

Registrum 是一个**结构化注册器**，它是一个库，用于记录、验证和排序状态转换，并在明确的约束条件下进行操作，以确保结构在熵积累的情况下仍然可理解。

| 属性 | 含义 |
|----------|---------|
| **Structural** | 关注形式，而非含义 |
| **Deterministic** | 相同的输入始终产生相同的输出 |
| **Fail-closed** | 无效的输入会导致彻底的失败，而不是部分恢复 |
| **Replayable** | 历史决策可以以完全相同的结果重新执行 |
| **Non-agentic** | 从不采取行动、做出决策或进行优化 |

**Registrum 确保变更始终保持可读性。**

---

## 为什么选择 Registrum？

系统会不断演进。熵会不断积累。结构会逐渐衰退。

大多数工具通过添加智能来应对这种情况，例如优化器、代理和自修复层。Registrum 采取相反的方法：**它添加约束条件**。

- **对于库的作者**：将结构保证嵌入到状态管理中，以便消费者可以免费获得可读性。
- **对于需要审计的系统**：每个状态转换都是确定性的、可重放的，并且可以独立验证。
- **对于抵制复杂性的团队**：Registrum 会以结构化的方式拒绝无效的转换，而不是默默地降低质量。

结果是：无论发生了多少次更改，系统中的身份、血统和顺序都始终可以检查。

---

## 核心原则

> **允许存在熵，但不允许不可读性。**

Registrum 不会全局地减少熵。
它限制了熵可能存在的范围，以便在一段时间内，身份、血统和结构始终可以被检查。

---

## Registrum 的局限性

Registrum 明确**不属于以下类别**：

- 优化器、代理或决策者
- 控制器、推荐器或智能系统
- 自适应、学习或自修复系统

它永远不会回答“什么重要”。
它只保留使该问题仍然可以回答的条件。

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Registrum 的工作原理

### 结构化注册器

注册器是唯一的宪法权威：

- 验证所有状态转换，以确保符合**11 个结构性不变性**
- 强制执行身份、血统和顺序约束
- 保证确定性和可追溯性
- 报告违反情况，但不进行修复（失败即停止）

所有内容都通过它进行注册。没有任何内容可以绕过它。

### 11 个不变性

| 类别 | 计数 | 目的 |
|-------|-------|---------|
| **Identity** | 3 | 唯一、不可变、基于内容的地址 |
| **Lineage** | 4 | 有效的父子关系、无循环、可追溯 |
| **Ordering** | 4 | 单调递增、无间隙、确定性 |

这些不变性是宪法的。更改它们需要正式的治理。

---

## 双重宪法验证器

Registrum 维护**两个独立的不变性引擎**：

| 验证器 | 角色 | 实现 |
|---------|------|----------------|
| **Registry** | 主要权威 | 编译的 DSL (RPEG v1) |
| **Legacy** | 次要验证器 | TypeScript 谓词 |

在 Phase H 阶段，**registry 是默认的宪法引擎**。
Legacy 仍然作为独立的次要验证器存在。

### 为什么需要两个验证器？

- **需要达成一致**：只有当两个验证器都接受时，状态转换才有效。
- **出现分歧时停止**：如果出现差异，系统将停止运行（失败即停止）。
- **独立性是故意的**：任何一个验证器都不能覆盖另一个验证器。

这是一个安全性和可读性方面的特性，而不是技术债务。
双模式是不可更改的。 没有计划移除任何一个验证节点。

### Parity 证据

274 个测试证明了行为上的等价性：
- 58 个针对所有不变类的 parity 测试
- 12 个持久性 parity 测试（时间稳定性）
- 重放 parity：实时执行 ≡ 重放执行

---

## 历史、重放和可审计性

| 能力 | 描述 |
|------------|-------------|
| **Snapshot** | 版本化的 schema (`RegistrarSnapshotV1`)，基于内容寻址的哈希值，确定性的序列化 |
| **Replay** | 针对全新注册器的只读重放执行——证明了时间上的确定性 |
| **Audit** | 每个结构性判断都是可重现的，与上下文无关，并且可以由任何拥有快照的方进行验证 |

---

## 外部证明（可选）

Registrum 可以选择性地向外部不可篡改的账本（例如 XRPL）发出加密证明，以便进行公开验证。

| 属性 | 价值 |
|----------|-------|
| 默认 | 禁用 |
| 权限 | 非权威（仅验证节点） |
| 对行为的影响 | 无 |

证明记录了 Registrum 做出*什么*决定。
Registrum 决定*什么*是有效的。

**权限向内流动。 验证节点向外流动。**

参见：
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — 理由
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — 规范

---

## 入门

### 安装

```bash
npm install @mcp-tool-shop/registrum
```

### 快速开始

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — the violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

### 模式

| 模式 | 引擎 | 使用场景 |
|------|--------|-------------|
| `"legacy"` | TypeScript 谓词 | 快速原型设计，无外部依赖 |
| `"registry"` (默认) | 编译后的 RPEG v1 DSL | 生产环境，使用完整的双验证节点 |

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";
import { loadCompiledRegistry } from "@mcp-tool-shop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const compiledRegistry = loadCompiledRegistry();
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### 运行示例

`examples/` 目录包含一些演示示例（非稳定 API）。
它们需要 [`tsx`](https://github.com/esbuild-kit/tsx)：

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## API 快速参考

### 核心导出

```typescript
// Implementation
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "refused", ... }
  Invariant,      // { id, scope, check }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcp-tool-shop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "identity" | "lineage" | "ordering"
  getInvariantById,       // Lookup by invariant ID
} from "@mcp-tool-shop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcp-tool-shop/registrum";
```

### `StructuralRegistrar`

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | 验证并记录状态转换 |
| `getState(id)` | `State \` | undefined | 通过 ID 检索已注册的状态 |
| `getHistory()` | `Transition[]` | 已接受转换的完整有序历史记录 |
| `snapshot()` | `RegistrarSnapshotV1` | 确定性的、基于内容寻址的快照 |

---

## 治理

Registrum 遵循**宪法模型**进行治理。

| 原则 | 含义 |
|-----------|---------|
| 行为保证 > 功能迭代速度 | 正确性优先 |
| 仅基于证据的更改 | 没有证明的更改 |
| 需要正式流程 | 提案、文档、决策 |

### 当前状态

- **Phase H**: 完成 (registry 默认，证明启用)
- **治理**: 活跃且执行
- **所有更改**: 需要正式的治理流程

所有未来的更改都是治理决策，而不是工程任务。

参见：
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — 治理存在的理由
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — 治理范围
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — 治理过渡

---

## 项目状态

**Registrum 已达到稳定的最终状态。**

| 阶段 | 状态 | 证据 |
|-------|--------|----------|
| A–C | 完成 | 核心注册器，parity 测试框架 |
| E | 完成 | 持久性、重放、时间稳定性 |
| G | 完成 | 治理框架 |
| H | 完成 | 默认注册，启用认证。 |

**测试覆盖率：** 14个测试套件中，共有279个测试通过。

开发已转为维护阶段。未来的更改需要遵循治理规范。

请参考：[`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md)

---

## 文档

| 文档 | 目的 |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | 身份定义 |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | 带有证据的正式声明 |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | 完整的不变性引用 |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | 严重故障条件 |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | 时间保证 |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | 双重验证架构教程 |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | 快照格式（宪法） |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | 双重验证策略 |

---

## 设计理念

- 强调**约束**，而非权力
- 强调**可读性**，而非性能
- 强调**限制**，而非启发式方法
- 强调**检查**，而非干预
- 强调**停止**，而非无限扩展

当Registrum变得平淡、可靠且不出意外时，它就取得了成功。

---

## 安全与数据范围

| 方面 | 细节 |
|--------|--------|
| **Data touched** | 内存状态转换，可选的JSON快照存储到本地文件系统。 |
| **Data NOT touched** | 无网络请求，无外部API，无数据库，无用户凭据。 |
| **Permissions** | 仅读/写用户指定的快照路径（当使用持久化时）。 |
| **Network** | 无 — 完全离线的库（XRPL认证默认禁用）。 |
| **Telemetry** | 无收集或发送。 |

请参考[SECURITY.md](SECURITY.md)以报告漏洞。

---

## 贡献

Registrum遵循以治理为先的贡献模式。所有更改都需要正式的提案和证据。

请参考[CONTRIBUTING.md](CONTRIBUTING.md)以了解完整的贡献理念和流程。

---

## 评估表

| 类别 | 分数 |
|----------|-------|
| A. 安全性 | 10 |
| B. 错误处理 | 10 |
| C. 运维文档 | 10 |
| D. 发布质量 | 10 |
| E. 身份验证（软） | 10 |
| **Overall** | **50/50** |

> 完整审计：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## 许可证

MIT

---

由<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>构建。
