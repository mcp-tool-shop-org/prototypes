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

**ThrottleAIは、並行処理、レート、およびトークン制限を管理するための、依存関係のないツールです。fetch、OpenAI、ツール、Express、Honoなどのアダプターが用意されています。**

---

## 60秒で始める

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

これで完了です。このツールは、並行処理、レート制限、および公平性を強制します。リースは、解放することを忘れると自動的に期限切れになります。

## なぜ使うのか

AIアプリケーションは、レート制限に引っかかる、予算を超過する、または過剰なリクエストを引き起こすことがあります。ThrottleAIは、コードとモデルの呼び出しの間に位置し、以下の機能を強制します。

- **並行処理:** 重み付きのスロットとインタラクティブなリザーブによる同時実行リクエスト数の制限
- **レート:** 分あたりのリクエスト数とトークン数（ローリングウィンドウ）
- **公平性:** 単一のエンティティがリソースを独占しないようにする
- **リース:** 取得後、解放する。タイムアウト時には自動的に期限切れ
- **可観測性:** デバッグ用の`snapshot()`、`onEvent`、および`formatEvent()`

依存関係はゼロ。Node.js 18以上。ツリーシェイクが可能。

## 制限方法を選択

| 制限方法 | 制限対象 | 使用場面 |
| --------- | ------------- | ------------- |
| **Concurrency** | 同時実行リクエスト数 | 常に - これが最も重要な設定項目です |
| **Rate** | 1分あたりのリクエスト数 | アップストリームAPIにレート制限が明示的に定義されている場合 |
| **Token rate** | 1分あたりのトークン数 | 1分あたりのトークン予算がある場合 |
| **Fairness** | 各エンティティのリソース使用量 | マルチテナント環境で、特定のユーザーがリソースを独占しないようにする場合 |
| **Adaptive** | 自動調整された並行処理の上限 | アップストリームのレイテンシが予測できない場合 |

まず並行処理を設定し、必要に応じてレート制限を追加します。シナリオ別のガイダンスについては、[チューニングのヒント](docs/tuning-cheatsheet.md)を参照してください。

## プリセット

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

## 一般的なパターン

### サーバーエンドポイント: 429エラー vs キュー

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

### UIインタラクション vs バックグラウンド処理

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

`interactiveReserve: 2`を設定すると、バックグラウンドタスクは残りの2つのスロットがインタラクティブなリクエストのために確保されている場合にのみブロックされます。

### ストリーミング処理

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

一度取得し、一度解放します。リースは、ストリームの期間中、有効なままです。

### 可観測性: なぜスロットリングが発生しているかを確認

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

## 設定

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

ファクトリ関数。`Governor`インスタンスを返します。

### `governor.acquire(request): AcquireDecision`

リースの取得を要求します。戻り値:

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

拒否理由: `"concurrency"` | `"rate"` | `"budget"` | `"policy"`

### `governor.release(leaseId, report?): void`

リースの解放。常にこの関数を呼び出すこと - エラーが発生した場合でも。

### `withLease(governor, request, fn, options?)`

自動的に解放されるリースの下で`fn`を実行します。

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

特定時点の状態: 並行処理、レート、トークン数、最後の拒否理由。

### `formatEvent(event): string` / `formatSnapshot(snap): string`

人間が読みやすい形式に変換する関数。

### ステータス取得関数

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

TTLリパーを停止します。シャットダウン時に呼び出します。

## アダプター

ツリーシェイク可能なラッパー。必要なものだけをインポートします。実行時の依存関係はありません。

| アダプター | インポート | 自動レポート |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | HTTPステータスからの結果 + レイテンシ |
| **OpenAI** | `throttleai/adapters/openai` | 結果 + レイテンシ + トークン使用量 |
| **Tool** | `throttleai/adapters/tools` | 結果 + レイテンシ + カスタムの重み |
| **Express** | `throttleai/adapters/express` | `res.statusCode`からの結果 + レイテンシ |
| **Hono** | `throttleai/adapters/hono` | 結果 + レイテンシ |

すべてのアダプターは、許可された場合に `{ ok: true, result, latencyMs }` を、拒否された場合に `{ ok: false, decision }` を返します。

### 取得

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### OpenAI互換

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### ツール呼び出し

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

アダプティブなチューニング機能を備えた、完全な動作可能なサーバーの例については、[`examples/express-adaptive/`](examples/express-adaptive/) を参照してください。

### Hono

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## ドキュメント

| ドキュメント | 内容 |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | シナリオベースの構成ガイド、決定木、パラメータ参照 |
| [Troubleshooting](docs/troubleshooting.md) | よくある問題: 常に拒否される、処理の遅延、アダプティブな発振 |
| [Release manifest](docs/release-manifest.md) | リリースプロセスとアーティファクトの詳細 |
| [Repo hygiene](docs/repo-hygiene.md) | アセットポリシーと履歴書き換えログ |

## チューニングのクイックリファレンス

| これは表示されます。 | これを調整します。 |
|---|---|
| `reason: "concurrency"` | `maxInFlight` を増やしたり、呼び出し時間を短くしたりします。 |
| `reason: "rate"` | `requestsPerMinute` / `tokensPerMinute` を増やします。 |
| `reason: "policy"` (公平性) | `softCapRatio` を下げたり、`maxInFlight` を増やしたりします。 |
| `retryAfterMs` が高い。 | `leaseTtlMs` を短くして、期限切れのリースがより早く解放されるようにします。 |
| バックグラウンドタスクが処理されなくなる。 | `maxInFlight` を増やしたり、`interactiveReserve` を減らしたりします。 |
| インタラクティブな遅延が大きい。 | `interactiveReserve` を増やします。 |
| アダプティブな調整が速すぎる。 | `alpha` を下げたり、`targetDenyRate` を上げたりします。 |

より詳細なガイダンスについては、[チューニングのチートシート](docs/tuning-cheatsheet.md) を参照してください。

## 例

動作するデモについては、[`examples/`](examples/) を参照してください。

- **[express-adaptive/](examples/express-adaptive/)** — アダプティブなチューニング機能とロードジェネレーターを備えた、完全な Express サーバー
- **[node-basic.ts](examples/node-basic.ts)** — スナップショットの印刷機能付きのバーストシミュレーション
- **[express-middleware.ts](examples/express-middleware.ts)** — 429 エラーと retry-after エンドポイント
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — すべての 5 つのアダプターの動作例
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — ガバナーのスナップショット付きのバースト負荷
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — インタラクティブとバックグラウンドの優先順位
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 エラーとキューリトライのパターン

```bash
npx tsx examples/node-basic.ts
```

## 安定性

ThrottleAI は、[Semantic Versioning](https://semver.org/) に準拠しています。パブリックAPI（`throttleai` および `throttleai/adapters/*` からエクスポートされるものすべて）は、v1.0.0 以降、**安定**しています。メジャーバージョンが変更された場合、互換性のない変更が行われます。

パブリックと内部の違いについては、[APIの安定性](docs/api-stability.md) を参照してください。セキュリティに関する報告については、[SECURITY.md](.github/SECURITY.md) を参照してください。

## ライセンス

MIT
