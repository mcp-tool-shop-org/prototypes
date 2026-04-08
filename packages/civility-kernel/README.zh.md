<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

一个策略层，它使得智能体的行为**受偏好驱动**，而不是单纯地追求效率最大化。

您的智能体会生成候选方案。核心组件决定下一步的操作：

**生成 → 过滤（硬性约束）→ 评分（权重）→ 选择 或 询问**

硬性约束是不可谈判的。软性偏好用于权衡取舍。不确定性可能会导致“询问人类”。

---

## 安装

```bash
npm i @mcptoolshop/civility-kernel
```

## 快速开始

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

核心组件通过一个调用，将约束、评分器和决策引擎连接在一起。使用 `decideAsync()` 进行与 I/O 相关的约束检查。

## 人类干预机制

您可以始终查看您的策略所执行的操作。
智能体必须在应用更改之前显示更改。
您可以回滚。
没有任何更改会静默进行。

预览策略文件：
```bash
npm run policy:explain
```

提出更新（显示差异，提示确认）：
```bash
npm run policy:propose
```

规范化当前策略文件（仅进行格式化）：
```bash
npm run policy:canonicalize
```

### 自动回滚安全机制

在应用更改时，`policy-check` 可以首先备份旧策略：

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## 策略文件

推荐的命名规范：

- `policies/default.json` — 默认策略
- `policies/previous.json` — 自动回滚目标
- `policies/profiles/*.json` — 命名配置文件（工作模式 / 低摩擦模式 / 安全模式）

## 命令行选项 (policy-check)

- `--explain` — 打印可读的策略摘要
- `--propose <file>` — 检查语法 + 显示规范化差异 + 提示确认
- `--apply` — 以规范形式重写策略文件
- `--write-prev <file>` — 在覆盖之前备份旧的规范化策略
- `--diff short|full` — `short` 显示“概要”更改；`full` 显示所有更改
- `--prev <file>` — 确定性的 CI 差异模式

## 公共 API

**核心组件（推荐的入口点）：**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — 预配置的接口，包含 `decide`、`lint`、`explain`、`diff` 和学习功能
- `PolicyBuilder` — 流畅的链式 API，用于构建经过验证的策略

**策略操作：**

- `lintPolicy(policy, { registry, scorers })` — 验证策略是否存在错误和警告
- `canonicalizePolicy(policy, registry)` — 将策略规范化为标准形式
- `diffPolicy(a, b, registry?)` — 两个策略之间的结构化差异
- `explainPolicy(policy, registry, opts?)` — 可读的策略摘要

**持久化：**

- `loadPolicy(json)` — 从未知输入加载经过 Zod 验证的策略
- `dumpPolicy(policy)` — 确定性的 JSON 序列化（排序后的键）
- `PreferencePolicySchema` — 导出的 Zod 模式，用于运行时验证

**决策引擎：**

- `DecisionEngine` — 根据策略评估候选方案（过滤 → 评分 → 选择或询问）
- `decideAsync()` — 用于与 I/O 相关的约束检查的异步版本
- `compileEffectivePolicy(base, context, plans)` — 应用上下文规则（支持 glob 模式，如 `tool:*`）
- `onDecision` 回调 — 可选的回调函数，用于在每次决策时进行日志记录/指标收集

**注册表：**

- `ConstraintRegistry` — 注册和评估硬性约束（带有可选的 Zod 参数模式 + 异步支持）
- `ScorerRegistry` — 注册用于权重键的评分函数
- `registerDefaultConstraints(registry)` — 加载内置约束（`no_irreversible_changes`、`max_spend_without_confirm`、`require_confirm_if`）
- `registerDefaultScorers(registry)` — 加载内置评分器（`efficiency`、`low_risk`、`concise`）

**学习循环：**

- `proposePolicyUpdates(policy, events)` — 根据用户反馈事件，建议调整策略。
- `applyPolicyProposal(policy, proposal)` — 将提案合并回策略（完成反馈循环）。
- 扩展的反馈类型：`CONSTRAINT_RELAXED`（约束已放宽）、`PLAN_EDITED`（计划已编辑）、`TIMEOUT`（超时）、`ABORT`（中止）。

**MCP 集成：**

- `planFromMcpToolCall(call, meta?)` — 将 MCP 工具调用转换为计划。
- `feedbackFromMcpResult(result, planId)` — 将 MCP 结果转换为反馈事件。

**实用工具：**

- `extractTags(plan)` / `annotatePlanWithTags(plan)` — 根据步骤内容自动为计划添加标签。
- `matchesContext(pattern, context)` — 支持通配符的上下文模式匹配。

## CI

CI 运行：
- 测试（17 个文件中的 143 个测试）
- 构建
- `policy-check --strict` 对比示例文件（`policies/default.json` 与 `policies/previous.json`）

这可以防止发布有问题的策略或误导性的差异。

## 开发

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## 安全与数据范围

Civility Kernel 是一个**纯粹的库**，不涉及任何网络请求、遥测或副作用。

- **访问的数据：** 从本地文件系统读取 JSON 策略文件。 在进程中验证、规范化和比较策略文档。 所有操作都是确定性的。
- **未访问的数据：** 不涉及任何网络请求。 不进行任何遥测。 不存储任何凭据。 核心评估策略约束，但不观察或记录代理的操作。
- **所需权限：** 访问本地文件系统以读取策略 JSON 文件。 仅在明确通过 `--apply` 参数请求时才进行写入。

请参阅 [SECURITY.md](SECURITY.md) 以报告漏洞。

---

## 评分卡

| 类别 | 评分 |
|----------|-------|
| 安全性 | 10/10 |
| 错误处理 | 10/10 |
| 操作员文档 | 10/10 |
| 发布质量 | 10/10 |
| 身份验证 | 10/10 |
| **Overall** | **50/50** |

---

## 许可证

MIT（参见 LICENSE）

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
