<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

# soundboard-maui

> [MCP Tool Shop](https://mcptoolshop.com) の一部

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Sound Board 音声エンジン用の、クロスプラットフォーム対応の .NET MAUI デスクトップクライアント。**

---

## Soundboard MAUI を使う理由

- **SDKファースト設計** — `Soundboard.Client` は、UI 依存性ゼロのスタンドアロンの .NET 8+ ライブラリです。コンソールアプリケーション、WPF、ASP.NET、MAUI、または .NET をターゲットとするあらゆる環境で使用できます。
- **リアルタイムストリーミング** — オーディオは、`IProgress<AudioChunk>` を介して WebSocket を通じてチャンクごとに受信されます。完全な音声合成が完了するまで待つ必要はありません。
- **エンジン非依存** — SDK は、ドキュメント化された [API 仕様](docs/api-contract.md) を使用します。コードを変更せずにエンジンを切り替えることができます。
- **マルチターゲット** — `net8.0`, `net9.0`, および `net10.0` 用に提供されており、最新の .NET プロジェクトから参照できます。
- **構造化されたロギング** — ロギングフレームワークを導入せずに、診断のための `ILogger` が組み込まれています。
- **参照クライアント同梱** — MAUI デスクトップアプリと CLI ツールが含まれており、実際の統合パターンを参考にできます。

---

## NuGet パッケージ

| パッケージ | 説明 | バージョン |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | ストリーミング TTS クライアント。Soundboard 互換の音声エンジン用フロントエンド SDK。純粋な C# で記述されており、UI 依存性はありません。 | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | Windows 用の、NAudio ベースの PCM16 ストリーミング再生アダプター。バッファリング、スレッドセーフな開始/停止/フラッシュ、および再生状態の追跡機能を持つ `IAudioPlayer` を提供します。 | 1.0.0 |

---

## クイックスタート

### SDK のインストール

```bash
dotnet add package Soundboard.Client
```

### 5 行で音声を出力

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

MAUI への依存はありません。コンソールアプリケーション、WPF、ASP.NET、または .NET 8+ をターゲットとする環境で動作します。

### 設定

クライアントは、環境変数 `SOUNDBOARD_BASE_URL` から設定を読み込みます。デフォルト値は `http://localhost:8765` です。コードでオーバーライドできます。

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### SDK の機能

| メソッド | 説明 |
|---|---|
| `GetHealthAsync()` | エンジンヘルスチェック — バージョン情報と稼働状況を返します。 |
| `GetPresetsAsync()` | 利用可能なプリセット識別子 (例: `narrator`, `conversational`) を一覧表示します。 |
| `GetVoicesAsync()` | 利用可能な音声識別子を一覧表示します。 |
| `SpeakAsync(request, progress)` | 合成された音声をストリーミングします。`IProgress<T>` を介して `AudioChunk` を報告します。 |
| `StopAsync()` | エンジンに停止コマンドを送信します。 |

すべてのメソッドは `CancellationToken` を受け入れます。クライアントは `IAsyncDisposable` を実装しています。

---

## アーキテクチャ

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**制御プレーン** (HTTP) — ヘルスチェック、プリセット、音声、停止。
**データプレーン** (WebSocket) — 双方向: 音声コマンドが上位に送信され、PCM16 音声チャンクが下位にストリーミングされます。

SDK は、接続ライフサイクル、JSON フレーム化、Base64 デコード、WebSocket の正常な終了、および API バージョン互換性チェックを自動的に処理します。

---

## ソースコードからのインストール

### 前提条件

- [.NET 10.0 SDK](https://dotnet.microsoft.com/) (MAUI ワークロードを含む) (デスクトップアプリ用)
- .NET 8.0 SDK (SDK と CLI のみの場合)
- Windows 10/11 (MAUI アプリと NAudio 再生用)
- 稼働中の [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) エンジン

### クローンと実行

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## プロジェクト構造

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         27 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## 例

| 例 | 説明 |
|---|---|
| [Quickstart](examples/Quickstart/) | 設定不要で接続、音声出力、WAV ファイルの保存 |
| [Agent Tool](examples/AgentTool/) | AI エージェントのパイプラインで呼び出し可能な SDK |

---

## ドキュメント

- [SDKの始め方](docs/getting-started-sdk.md)
- [ストリーミングモデル](docs/streaming-model.md)
- [エラーモデル](docs/error-model.md)
- [APIリファレンス](docs/api.md)
- [API契約](docs/api-contract.md)
- [互換性と信頼性](docs/compatibility.md)
- [エンジン設定](docs/engine-setup.md)
- [アップグレードとロールバック手順](docs/upgrade-playbook.md)
- [SDKの公開](docs/publishing.md)
- [新規インストール検証](docs/fresh-install.md)
- [評価ガイド](docs/evaluation-guide.md)
- [変更履歴](CHANGELOG.md)
- [貢献について](CONTRIBUTING.md)

---

## よくある質問

**SDKとは何ですか？**
`Soundboard.Client`は、エンジンとの通信（ヘルスチェック、ディスカバリー、WebSocket経由での音声ストリーミングなど）をすべて処理する、スタンドアロンの.NET 8+ ライブラリです。 どの.NETプロジェクトからも参照できます。

**MAUIアプリとは何ですか？**
SDKの使用方法を示すための、デスクトップUIを備えたリファレンスクライアントです。 これは製品ではなく、SDKの利用方法の一例を示すものです。

**これは本番環境での利用に適していますか？**
SDKのAPI（v1.0）は安定しています。 MAUIアプリはデモ用のものです。 [既知の制限事項](docs/known-limitations.md)を参照してください。

**独自のUIを構築できますか？**
はい、できます。 それが目的です。 SDKはUIに依存しません。 プラットフォームに対応した`IAudioPlayer`を実装して、利用を開始してください。

**エンジンはどこにありますか？**
別のリポジトリにあります：[voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)。 このリポジトリには、エンジンコードは含まれていません。

---

## ライセンス

このプロジェクトは、[MITライセンス](LICENSE)に基づいてライセンスされています。

---

## リンク

- [エンジンのリポジトリ](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [NuGet上のSoundboard.Client](https://www.nuget.org/packages/Soundboard.Client)
- [NuGet上のSoundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [既知の制限事項](docs/known-limitations.md)
