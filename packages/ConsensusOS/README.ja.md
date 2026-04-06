<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> [MCP Tool Shop](https://mcptoolshop.com) の一部

**マルチチェーンのコンセンサスガバナンスのための、モジュール式で依存関係のない制御プレーン。**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## ConsensusOSを選ぶ理由

マルチチェーンのインフラストラクチャを運用するとは、完全に制御できないノードを信頼し、逸脱してはならないリリースを配布し、常に稼働しているネットワーク全体にわたって構成変更を管理することを意味します。 多くのチームは、これらをアドホックなスクリプトでまとめ、最善を祈るだけです。

ConsensusOS は、その希望を、**プラグインベースの制御プレーン**に置き換えます。 各モジュールは共有イベントバスを通じて通信し、すべての状態遷移はフェイルセーフな制約によって制御され、システム全体の履歴は決定論的に再現可能です。

- **ゼロプロダクション依存性**：サプライチェーンに、自身で書いたもの以外は一切存在しません。
- **固定されたプラグインAPI v1**：統合を壊すことのない、安定した契約です。
- **フェイルセーフな制約**：無効な遷移は常に拒否され、部分的に適用されることはありません。
- **決定論的な再現**：イベント履歴から、任意のシステムの状態を再現できます。
- **リソース制限付き実行**：CPU、メモリ、時間制限は、トークンによって強制されます。
- **マルチチェーンアダプター**：XRPL、Ethereum、Cosmos は、すぐに利用可能です。

---

## インストール

```bash
npm install @mcptoolshop/consensus-os
```

**Node.js 18+** が必要です。 実行時の依存関係はゼロです。

---

## クイックスタート

### プログラムによる利用

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

### カスタムプラグインのビルド

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

### CLI (コマンドラインインターフェース)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## アーキテクチャ

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

詳細な仕様については、[ARCHITECTURE.md](ARCHITECTURE.md) を参照してください。

---

## API

### コア

| エクスポート | 説明 |
| -------- | ------------- |
| `CoreLoader` | プラグインライフサイクルオーケストレーター：登録、起動、シャットダウン |
| `CoreEventBus` | ワイルドカードサブスクリプションに対応した、順序付けされた型付きイベントバス |
| `CoreInvariantEngine` | 追記専用登録によるフェイルセーフな制約エンジン |
| `createLogger(scope)` | モジュールごとにスコープされた構造化ロガー |

### モジュール

| ファクトリ | 目的 |
| --------- | --------- |
| `createHealthSentinel()` | ハートビートによるノードのヘルスチェック |
| `createReleaseVerifier()` | ソフトウェアリリースハッシュの検証 |
| `createConfigGuardian()` | 構成スキーマの検証と移行 |
| `createSandboxPlugin()` | 隔離されたシミュレーション、再現、および修正エンジン |
| `createGovernorPlugin()` | トークンベースの実行、ポリシー適用、ビルドキュー |

### アダプター

| ファクトリ | Chain | ステータス |
| --------- | ------- | -------- |
| `createXrplAdapter()` | XRPL | 実装済み |
| `createEthereumAdapter()` | Ethereum | 実装済み |
| `createCosmosAdapter()` | Cosmos | 実装済み |

### プラグインSDK

| エクスポート | 説明 |
| -------- | ------------- |
| `BasePlugin` | ライフサイクルデフォルトと便利なメソッドを備えた抽象基本クラス |
| `ManifestBuilder` | 型安全なプラグインマニフェストのためのFluent Builder |
| `validatePlugin()` | エラーと警告を含む、プリ登録の検証 |
| `AttestationPipeline` | リリース認証とビルドのトレーサビリティ |

### サブパスエクスポート

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## テスト

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

テストカテゴリ：
- **アーキテクチャ** (16テスト)：構造的な制約の適用
- **セキュリティ** (27テスト)：悪用に対する耐性および決定論
- **ストレステスト** (22テスト)：エッジケースおよびスループット
- **ユニットテスト** (230テスト)：コンポーネントレベルのカバレッジ

---

## ドキュメント

| ドキュメント | 目的 |
| ---------- | --------- |
| [QUICKSTART.md](QUICKSTART.md) | 3分で開始 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 固定されたv1.0アーキテクチャ仕様 |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | プラグインの書き方 |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | チェーンアダプターの作成方法 |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | サンドボックス、リプレイ、および修正に関する手順 |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | トークン実行、ポリシー、ビルドキュー |
| [SECURITY.md](SECURITY.md) | セキュリティポリシーと脆弱性報告 |
| [THREAT_MODEL.md](THREAT_MODEL.md) | STRIDE脅威分析 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 開発ワークフローとプルリクエストチェックリスト |
| [BUILD.md](BUILD.md) | 再現可能なビルドと検証 |

---

## サポート

- **質問 / ヘルプ:** [ディスカッション](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **バグ報告:** [イシュー](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## ライセンス

[MIT](LICENSE)
