<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ThrottleAI/main/logo.jpg" alt="ThrottleAI" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ThrottleAI/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ThrottleAI/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/throttleai"><img src="https://img.shields.io/npm/v/throttleai" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ThrottleAI/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <em>A token-based lease governor for AI calls — small enough to embed anywhere, strict enough to prevent stampedes.</em>
</p>

**ThrottleAI 是一款零依赖的速率控制工具，用于管理并发、速率和令牌预算，并提供适用于 fetch、OpenAI、工具、Express 和 Hono 的适配器。**

---

## 60 秒快速入门

```bash
pnpm add throttleai
```

```ts
import { createGovernor, withLease, presets } from "throttleai";

const gov = createGovernor(presets.balanced());

const result = await withLease(
  gov,
  { actorId: "user-1", action: "chat" },
  async () => await callMyModel(),
);

if (result.granted) {
  console.log(result.result);
} else {
  console.log("Throttled:", result.decision.recommendation);
}
```

就是这样。该工具强制执行并发、速率限制和公平性。 如果您忘记释放，租约将自动过期。

## 原因

AI 应用程序会超出速率限制，耗尽预算，并造成拥堵。 ThrottleAI 位于您的代码和模型调用之间，强制执行以下内容：

- **并发性**：使用加权槽和交互式预留来限制并发调用。
- **速率**：每分钟请求数和每分钟令牌数，并使用滑动窗口。
- **公平性**：防止任何单个参与者垄断资源。
- **租约**：在获取之前，在释放之后，并在超时时自动过期。
- **可观察性**：`snapshot()`、`onEvent` 和 `formatEvent()` 用于调试。

零依赖。Node.js 18+。可进行树摇优化。

## 选择您的速率限制器

| 速率限制器 | 它限制的内容 | 使用场景 |
| --------- | ------------- | ------------- |
| **Concurrency** | 并发调用数 | 始终 - 这是最重要的参数。 |
| **Rate** | 每分钟请求数 | 当上游 API 具有已记录的速率限制时。 |
| **Token rate** | 每分钟令牌数 | 当您有每分钟的令牌预算时。 |
| **Fairness** | 每个参与者的资源份额 | 多租户应用程序，其中一个用户不应占用过多资源。 |
| **Adaptive** | 自动调整的并发上限 | 当上游延迟不可预测时。 |

首先设置并发性。 仅在需要时添加速率限制。 请参阅[调整指南](docs/tuning-cheatsheet.md)，其中包含基于场景的建议。

## 预设配置

```ts
import { presets } from "throttleai";

// Single user, CLI tools — 1 call at a time, 10 req/min
createGovernor(presets.quiet());

// SaaS backend — 5 concurrent (2 interactive reserve), 60 req/min, fairness
createGovernor(presets.balanced());

// Batch processing — 20 concurrent, 300 req/min, fairness + adaptive tuning
createGovernor(presets.aggressive());

// Override any field
createGovernor({ ...presets.balanced(), leaseTtlMs: 30_000 });
```

## 常见模式

### 服务器端点：429 错误 vs 队列

```ts
// Option A: immediate deny with 429
const result = await withLease(gov, request, fn);
// result.granted === false → respond with 429

// Option B: wait with bounded retries
const result = await withLease(gov, request, fn, {
  strategy: "wait-then-deny",
  maxAttempts: 3,
  maxWaitMs: 5_000,
});
```

### UI 交互 vs 后台任务

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

使用 `interactiveReserve: 2` 时，当仅剩 2 个槽时，后台任务将被阻止，这些槽保留用于交互式请求。

### 流式调用

```ts
const decision = gov.acquire({ actorId: "user", action: "stream" });
if (!decision.granted) return;

try {
  const stream = await openai.chat.completions.create({ stream: true, ... });
  for await (const chunk of stream) {
    // process chunk
  }
  gov.release(decision.leaseId, { outcome: "success" });
} catch (err) {
  gov.release(decision.leaseId, { outcome: "error" });
  throw err;
}
```

获取一次，释放一次——租约在整个流的持续时间内有效。

### 可观察性：查看其限制的原因

```ts
import { createGovernor, formatEvent, formatSnapshot } from "throttleai";

const gov = createGovernor({
  ...presets.balanced(),
  onEvent: (e) => console.log(formatEvent(e)),
  // [deny] actor=user-1 action=chat reason=concurrency retryAfterMs=500 — All 5 slots in use...
});

// Point-in-time view
console.log(formatSnapshot(gov.snapshot()));
// concurrency=3/5 rate=12/60 leases=3
```

## 配置

```ts
createGovernor({
  // Concurrency (optional)
  concurrency: {
    maxInFlight: 5,          // max simultaneous weight
    interactiveReserve: 1,   // slots reserved for interactive priority
  },

  // Rate limiting (optional)
  rate: {
    requestsPerMinute: 60,   // request-rate cap
    tokensPerMinute: 100_000, // token-rate cap
    windowMs: 60_000,         // rolling window (default 60s)
  },

  // Advanced (optional)
  fairness: true,             // prevent actor monopolization
  adaptive: true,             // auto-tune concurrency from deny rate + latency
  strict: true,               // throw on double release / unknown ID (dev mode)

  // Lease settings
  leaseTtlMs: 60_000,         // auto-expire (default 60s)
  reaperIntervalMs: 5_000,    // sweep interval (default 5s)

  // Observability
  onEvent: (e) => { /* acquire, deny, release, expire, warn */ },
});
```

## API

### `createGovernor(config): Governor`

工厂函数。 返回一个 `Governor` 实例。

### `governor.acquire(request): AcquireDecision`

请求租约。 返回：

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

拒绝原因：`"concurrency"` | `"rate"` | `"budget"` | `"policy"`

### `governor.release(leaseId, report?): void`

释放租约。 始终调用此方法——即使在发生错误时。

### `withLease(governor, request, fn, options?)`

在租约下执行 `fn`，并在完成后自动释放。

```ts
withLease(gov, request, fn, {
  strategy: "deny",           // default — fail immediately
  strategy: "wait",           // retry with backoff until maxWaitMs
  strategy: "wait-then-deny", // retry up to maxAttempts
  maxWaitMs: 10_000,          // max total wait (default 10s)
  maxAttempts: 3,             // for "wait-then-deny" (default 3)
  initialBackoffMs: 250,      // starting backoff (default 250ms)
});
```

### `governor.snapshot(): GovernorSnapshot`

当前状态：并发性、速率、令牌数、上次拒绝。

### `formatEvent(event): string` / `formatSnapshot(snap): string`

单行、易于阅读的格式化器。

### 状态获取器

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

停止 TTL 清理器。 在关闭时调用。

## 适配器

可进行树摇优化的包装器——仅导入您使用的内容。 没有运行时依赖。

| 适配器 | 导入 | 自动报告 |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | 结果（来自 HTTP 状态码）+ 延迟 |
| **OpenAI** | `throttleai/adapters/openai` | 结果 + 延迟 + 令牌使用量 |
| **Tool** | `throttleai/adapters/tools` | 结果 + 延迟 + 自定义权重 |
| **Express** | `throttleai/adapters/express` | 结果（来自 `res.statusCode`）+ 延迟 |
| **Hono** | `throttleai/adapters/hono` | 结果 + 延迟 |

所有适配器在授权时返回 `{ ok: true, result, latencyMs }`，在拒绝时返回 `{ ok: false, decision }`。

### fetch

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### 与 OpenAI 兼容

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### 工具调用

```ts
import { wrapTool } from "throttleai/adapters/tools";
const embed = wrapTool(myEmbedFn, { governor: gov, toolId: "embed", costWeight: 2 });
const r = await embed("hello");
if (r.ok) console.log(r.result);
```

### Express

```ts
import { throttleMiddleware } from "throttleai/adapters/express";
app.use("/ai", throttleMiddleware({ governor: gov }));
// 429 + Retry-After header + JSON body on deny
```

请参考 [`examples/express-adaptive/`](examples/express-adaptive/) 目录，了解一个完整的可运行服务器，该服务器具有自适应调整功能。

### Hono

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## 文档

| 文档 | 内容概要 |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | 基于场景的配置指南、决策树、参数参考 |
| [Troubleshooting](docs/troubleshooting.md) | 常见问题：始终被拒绝、系统卡顿、自适应震荡 |
| [Release manifest](docs/release-manifest.md) | 发布流程和构建包详情 |
| [Repo hygiene](docs/repo-hygiene.md) | 资源策略和历史重写日志 |

## 参数快速参考

| 您会看到这个 | 调整这个 |
|---|---|
| `reason: "concurrency"` | 增加 `maxInFlight` 或减少调用时长 |
| `reason: "rate"` | 增加 `requestsPerMinute` / `tokensPerMinute` |
| `reason: "policy"` (公平性) | 降低 `softCapRatio` 或增加 `maxInFlight` |
| `retryAfterMs` 值过高 | 减少 `leaseTtlMs`，以便过期的租约更快释放 |
| 后台任务被阻塞 | 增加 `maxInFlight` 或减少 `interactiveReserve` |
| 交互式延迟过高 | 增加 `interactiveReserve` |
| 自适应调整速度过快 | 降低 `alpha` 或提高 `targetDenyRate` |

如需更详细的指导，请参阅 [参数优化技巧](docs/tuning-cheatsheet.md)。

## 示例

请参考 [`examples/`](examples/) 目录，了解可运行的演示示例：

- **[express-adaptive/](examples/express-adaptive/)** — 完整的 Express 服务器，具有自适应调整功能 + 负载生成器
- **[node-basic.ts](examples/node-basic.ts)** — 带有快照打印的突发模拟
- **[express-middleware.ts](examples/express-middleware.ts)** — 429 + retry-after 接口
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — 所有五个适配器的实际应用
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — 带有治理快照的突发负载
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — 交互式与后台优先级
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 与队列重试模式

```bash
npx tsx examples/node-basic.ts
```

## 稳定性

ThrottleAI 遵循 [语义版本控制](https://semver.org/)。公共 API — 从 `throttleai` 和 `throttleai/adapters/*` 导出的所有内容 — 从 v1.0.0 开始，**稳定**。 破坏性更改需要进行主版本升级。

有关公共 API 与内部 API 的详细信息，请参阅 [API 稳定性](docs/api-stability.md)。 如有安全漏洞报告，请参阅 [SECURITY.md](.github/SECURITY.md)。

## 许可证

MIT
