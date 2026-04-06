<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Attestia-Desktop/readme.png" alt="Attestia Desktop" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/Attestia.Core"><img src="https://img.shields.io/nuget/v/Attestia.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Attestia-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Windows向け金融取引意図検証システム -- ブロックチェーンの認証と照合のためのWinUI 3デスクトップアプリと.NET SDK**

---

## Attestiaを選ぶ理由

多くのブロックチェーン関連ツールは、取引が**完了した後**に監査を行います。Attestiaは、このモデルを逆転させ、取引がブロックチェーンに記録される**前に**意図を検証します。

- **構造化された金融取引意図**：生のデータではなく、構造化されたレコードを使用して、取引の宣言、承認、実行、検証を行います。
- **暗号学的証明**：Merkleツリーの包含証明と認証パッケージにより、改ざんを検知できる監査証跡を提供します。
- **確定的照合**：意図、台帳、ブロックチェーンの3つの要素を比較することで、不整合を早期に発見し、問題の深刻化を防ぎます。
- **コンプライアンスマッピング**：認証制御を規制フレームワークにマッピングし、コンプライアンスレポートを自動生成します。
- **イベントソーシング**：すべての状態変化は、完全な因果関係を追跡できる不変のハッシュチェーン化されたドメインイベントとして記録されます。
- **デスクトップ優先のUI/UX**：ネイティブなWinUI 3アプリにより、Windows環境から離れることなく、リアルタイムのダッシュボード、意図管理、証明の閲覧、照合ビューを提供します。

---

## NuGetパッケージ

| パッケージ | ターゲット | 説明 |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | ドメインモデル、列挙型、および共有型（`Intent`、`MerkleProof`、`ReconciliationReport`、`Money`、`ComplianceFramework`、`DomainEvent`など） |
| **Attestia.Client** | `net9.0` | HTTPクライアントSDK。意図、証明、照合、コンプライアンス、イベント、検証、エクスポートのための型付きサブクライアントを提供します。リトライロジック、エンベロープの展開、および`CancellationToken`のサポートを内蔵しています。 |
| **Attestia.Sidecar** | `net9.0` | Node.jsプロセスマネージャー。Attestiaのバックエンドを起動し、利用可能なポートを検出し、`/health`をポーリングし、クラッシュ時に自動的に再起動し、プロセス終了時にプロセスツリーを停止します。 |

これらのパッケージはすべて`net9.0`をターゲットとしており、デスクトップアプリとは独立して動作します。コンソールアプリケーション、ASP.NETサービス、または.NET 9以降が動作する環境で利用できます。

---

## クイックスタート

### 意図の宣言と検証

```csharp
using Attestia.Client;

var config = new AttestiaClientConfig { BaseUrl = "http://localhost:3100" };
var http   = new AttestiaHttpClient(httpClient, config, logger);
var client = new AttestiaClient(http);

// Declare a financial intent
var intent = await client.Intents.DeclareAsync(new DeclareIntentRequest
{
    Id          = Guid.NewGuid().ToString(),
    Kind        = "transfer",
    Description = "Send 1,000 USDC to treasury",
    Params      = new() { ["amount"] = "1000", ["currency"] = "USDC" },
});

// Approve, execute on-chain, then verify
await client.Intents.ApproveAsync(intent.Id);
await client.Intents.ExecuteAsync(intent.Id, chainId: "eip155:1", txHash: "0xabc...");
await client.Intents.VerifyAsync(intent.Id, matched: true);
```

### 意図と台帳、ブロックチェーンの照合

```csharp
var report = await client.Reconciliation.ReconcileAsync(new ReconcileRequest
{
    Intents       = intents,
    LedgerEntries = ledgerEntries,
    ChainEvents   = chainEvents,
});

Console.WriteLine(report.Summary.AllReconciled
    ? "All matched"
    : $"{report.Summary.MismatchCount} mismatches found");
```

### Node.jsサイドカーの管理

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### Merkle包含証明の検証

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## アーキテクチャ

```text
+---------------------------------------------------------+
|  Attestia.App  (WinUI 3)                               |
|  Dashboard - Intents - Proofs - Reconciliation          |
|  Compliance - Events - Settings                         |
+---------------------------------------------------------+
|  Attestia.ViewModels  (CommunityToolkit.Mvvm)           |
+----------------------------+----------------------------+
|  Attestia.Client           |  Attestia.Sidecar          |
|  HTTP SDK                  |  Node.js process manager   |
|  Typed sub-clients         |  Health checks, auto-restart|
|  Retry + envelope          |  Port discovery, teardown  |
+----------------------------+----------------------------+
|  Attestia.Core                                          |
|  Domain models - Enums - Shared types                   |
+---------------------------------------------------------+
         |                          |
         v                          v
   Attestia Node.js            Blockchain
   backend (sidecar)           (EVM, etc.)
```

デスクトップアプリはすべてのレイヤーを統合しますが、各ライブラリは独立して動作します。`Attestia.Client`は、.NET 9以降のプロジェクト（コンソールアプリケーション、ASP.NET API、バックグラウンドサービス、テスト環境など）で利用できます。

**Sidecar**は、Node.jsバックエンドを子プロセスとして管理します。利用可能なポートを見つけ、`PORT`と`NODE_ENV=production`を設定し、`/health`をポーリングし、プロセスが停止した場合に自動的に再起動します。`DisposeAsync`メソッドで呼び出されると、プロセスツリー全体を安全に停止します。

---

## 前提条件

| 要件 | バージョン | 備考 |
|-------------|---------|-------|
| .NET SDK | 9.0+ | `global.json`で9.0をピン止めし、`latestFeature`によるバージョンアップを許可 |
| Node.js | 20+ | Attestiaのバックエンドサイドカーに必要 |
| Windows | 10 1809+ | WinUI 3以上; Windows 11推奨 |
| Visual Studio | 2022 17.10+ | **Windows App SDK**のワークロード（デスクトップアプリ用） |

> **注意:** 3つのNuGetパッケージ（`Attestia.Core`、`Attestia.Client`、`Attestia.Sidecar`）は、プレーンな`net9.0`をターゲットとしており、Windowsを必要としません。`Attestia.App`のみが`net9.0-windows10.0.22621.0`をターゲットとしています。

---

## ソースからのインストール

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/Attestia-Desktop.git
cd Attestia-Desktop

# Restore and build (libraries)
dotnet restore
dotnet build

# Run tests
dotnet test

# Run the desktop app (requires x64 + Windows App SDK workload)
dotnet run --project src/Attestia.App -c Debug
```

### MSIXパッケージのビルド（リリース）

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

出力は`AppPackages/`に配置されます。

### Node.jsのバンドル

Attestia Node.jsサーバーを`assets/node/`に配置します。

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

ビルドプロセスは、これらのファイルを自動的に出力ディレクトリにコピーします。`assets/node/node.exe`が存在しない場合、サイドカーは`PATH`にある`node`を使用します。

---

## プロジェクト構造

```text
Attestia-Desktop/
|-- src/
|   |-- Attestia.Core/           # Domain models and shared types (NuGet)
|   |   +-- Models/
|   |       |-- Intent.cs        # IntentStatus, Intent, IntentDeclaration, IntentApproval
|   |       |-- Proof.cs         # MerkleProof, MerkleProofStep, AttestationProofPackage
|   |       |-- Reconciliation.cs# ReconciliationReport, MatchStatus, AttestationRecord
|   |       |-- Financial.cs     # Money, AccountRef, LedgerEntry
|   |       |-- Compliance.cs    # ComplianceFramework, ControlMapping, ComplianceReport
|   |       |-- Chain.cs         # ChainRef, BlockRef, TokenRef, OnChainEvent
|   |       |-- Event.cs         # DomainEvent, StoredEvent, EventMetadata
|   |       |-- Verification.cs  # VerificationResult, ReplayResult, ConsensusResult
|   |       +-- Api.cs           # AttestiaResponse<T>, PaginatedList<T>, AttestiaException
|   |
|   |-- Attestia.Client/         # HTTP client SDK (NuGet)
|   |   |-- AttestiaClient.cs    # Facade composing all sub-clients
|   |   |-- AttestiaHttpClient.cs# HTTP transport with retry, envelope unwrapping
|   |   |-- IntentsClient.cs     # Declare, approve, reject, execute, verify
|   |   |-- ProofsClient.cs      # Merkle root, attestation packages, proof verification
|   |   |-- ReconciliationClient.cs # Reconcile, attest, list attestations
|   |   |-- ComplianceClient.cs  # Frameworks, compliance reports
|   |   |-- EventsClient.cs     # Event streams, pagination
|   |   |-- VerifyClient.cs     # State hash, replay verification
|   |   |-- ExportClient.cs     # NDJSON events export, state export
|   |   +-- PublicClient.cs     # Public verification endpoints, consensus
|   |
|   |-- Attestia.Sidecar/        # Node.js process manager (NuGet)
|   |   |-- NodeSidecar.cs       # Lifecycle: start, health check, auto-restart, stop
|   |   |-- SidecarConfig.cs     # Port, timeouts, auto-restart toggle
|   |   +-- NodeBundleLocator.cs # Finds node.exe and server entry point
|   |
|   |-- Attestia.ViewModels/     # MVVM presentation layer
|   |   |-- DashboardViewModel.cs
|   |   |-- IntentsViewModel.cs
|   |   |-- ReconciliationViewModel.cs
|   |   +-- ...
|   |
|   +-- Attestia.App/            # WinUI 3 desktop application
|       |-- Pages/               # Dashboard, Intents, Proofs, Reconciliation, ...
|       |-- Themes/              # AttestiaTheme.xaml
|       +-- Startup.cs           # DI composition root
|
|-- assets/node/                  # Bundled Node.js runtime (gitkeep)
|-- scripts/
|   |-- build-governed.ps1        # Governed build script
|   +-- bundle-node.ps1           # Node.js bundling script
|-- .github/workflows/
|   +-- publish.yml               # NuGet publish on release
|-- Attestia.Desktop.sln
|-- Directory.Build.props         # Shared MSBuild properties
|-- Directory.Packages.props      # Central package management
|-- global.json                   # .NET SDK version pin
|-- CHANGELOG.md
|-- llms.txt                      # AI agent context
+-- LICENSE                       # MIT
```

---

## 設定

デスクトップアプリケーションは、サイドカーおよびクライアントの設定情報を `appsettings.json` ファイルから読み込みます。

```json
{
  "Attestia": {
    "Port": 0,
    "NodePath": null,
    "ServerEntryPoint": null,
    "ApiKey": null
  }
}
```

| キー | デフォルト値 | 説明 |
|-----|---------|-------------|
| `Port` | `0` (自動) | サイドカーで使用する固定ポート。未使用のポートを自動的に検出する場合は `0` を指定します。 |
| `NodePath` | `null` | `node.exe` への絶対パス。指定がない場合は、バンドルされたものを使用し、次に `PATH` 環境変数を確認します。 |
| `ServerEntryPoint` | `null` | `main.js` への絶対パス。指定がない場合は、バンドルされた場所を使用します。 |
| `ApiKey` | `null` | オプションのAPIキー。`X-Api-Key` ヘッダーとして送信されます。 |

---

## セキュリティとデータ範囲

Attestia Desktop は、ローカルの Node.js サイドカーバックエンドを持つ、**ローカルのデスクトップアプリケーション**として動作します。

- **アクセスされるデータ:** ローカルの Node.js サイドカーを介して、インテント宣言、Merkle 証明、リコンシリエーションレポート、およびコンプライアンスデータを読み書きします。設定情報は `appsettings.json` に保存されます。NuGet SDK パッケージは、設定されたバックエンド URL に対してのみ HTTP リクエストを行います。
- **アクセスされないデータ:** テレメトリーデータは収集されません。クラウド分析も行いません。ユーザーデータの収集もありません。認証情報の保存もありません。ブロックチェーンへの直接的な書き込みもありません。
- **必要な権限:** ローカルのサイドカー (localhost) へのネットワークアクセス。バンドルされた Node.js ランタイムおよび設定ファイルへのファイルシステムアクセス。デスクトップUI 用の Windows App SDK ランタイム。

脆弱性に関する報告は、[SECURITY.md](SECURITY.md) を参照してください。

---

## 評価項目

| カテゴリ | 評価 |
|----------|-------|
| セキュリティ | 10/10 |
| エラー処理 | 10/10 |
| オペレーター向けドキュメント | 10/10 |
| リリース時の品質管理 | 10/10 |
| 認証 | 10/10 |
| **Overall** | **50/50** |

---

## 貢献

1. リポジトリをフォークします。
2. 機能ブランチを作成します (`git checkout -b feat/my-feature`)。
3. 変更をコミットします。
4. `main` ブランチに対してプルリクエストを送信します。

ご提出前に、ビルドが成功し、すべてのテストがパスすることを確認してください。

---

## サポート

- **質問 / ヘルプ:** [ディスカッション](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **バグ報告:** [イシュー](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## ライセンス

[MIT](LICENSE) -- Copyright (c) 2026 Mikey Frilot

---

構築: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

