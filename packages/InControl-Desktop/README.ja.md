<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/InControl-Desktop/readme.png" alt="InControl Desktop" width="400"></p>

<h1 align="center">InControl Desktop</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/InControl-Desktop/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/InControl-Desktop/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://www.nuget.org/packages/InControl.Core"><img src="https://img.shields.io/nuget/v/InControl.Core?style=flat-square&label=InControl.Core" alt="InControl.Core NuGet"></a>
  <a href="https://www.nuget.org/packages/InControl.Inference"><img src="https://img.shields.io/nuget/v/InControl.Inference?style=flat-square&label=InControl.Inference" alt="InControl.Inference NuGet"></a>
  <img src="https://img.shields.io/badge/.NET-9-purple?style=flat-square&logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/WinUI-3-blue?style=flat-square" alt="WinUI 3">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/InControl-Desktop?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/InControl-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**Windows用ローカルAIチャットアシスタント**

プライバシーを重視し、GPUの処理能力を活用したチャットアプリケーションです。大規模言語モデルを完全にローカルマシン上で実行します。クラウド接続は不要です。

## InControlを選ぶ理由

- **デフォルトでプライベート:** 会話はあなたのコンピューターから一切外部に出ません。
- **RTX最適化:** NVIDIA GPUとCUDAアクセラレーションに対応。
- **ネイティブなWindows体験:** Fluent Designを採用したWinUI 3。
- **複数のバックエンド:** Ollama、llama.cpp、または独自のものを利用可能。
- **Markdownレンダリング:** リッチテキスト、コードブロック、構文ハイライトに対応。

## NuGetパッケージ

コアライブラリは、ローカルAI連携を構築するためのスタンドアロンNuGetパッケージとして提供されています。

| パッケージ | バージョン | 説明 |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | ローカルAIチャットアプリケーション向けのドメインモデル、会話タイプ、および共通抽象化。 |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | ストリーミングチャット、モデル管理、およびヘルスチェックを含む、LLMバックエンドの抽象化レイヤー。Ollamaの実装が含まれます。 |

```bash
dotnet add package InControl.Core
dotnet add package InControl.Inference
```

```csharp
// Example: use InControl.Inference in your own app
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}
```

## 対応ハードウェア

| コンポーネント | 最小要件 | 推奨要件 |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809以降 | Windows 11 |
| .NET | 9.0 | 9.0 |

## インストール

### リリース版から（推奨）

1. [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases) から最新のMSIXパッケージをダウンロードします。
2. ダブルクリックしてインストールします。
3. スタートメニューから起動します。

### ソースコードから

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## 前提条件

InControlは、ローカルLLMバックエンドが必要です。 [Ollama](https://ollama.ai/) を推奨します。

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## ビルド

### ビルド環境の確認

```powershell
# Run verification script
./scripts/verify.ps1
```

### 開発ビルド

```bash
dotnet build
```

### リリースビルド

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### テストの実行

```bash
dotnet test
```

## アーキテクチャ

InControlは、クリーンで階層化されたアーキテクチャを採用しています。

```
+-------------------------------------------+
|         InControl.App (WinUI 3)           |  UI Layer
+-------------------------------------------+
|         InControl.ViewModels              |  Presentation
+-------------------------------------------+
|         InControl.Services                |  Business Logic
+-------------------------------------------+
|         InControl.Inference               |  LLM Backends
+-------------------------------------------+
|         InControl.Core                    |  Shared Types
+-------------------------------------------+
```

詳細な設計については、[ARCHITECTURE.md](./docs/ARCHITECTURE.md) を参照してください。

## データストレージ

すべてのデータはローカルに保存されます。

| Data | 場所 |
| ------ | ---------- |
| セッション | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| エクスポート | `%USERPROFILE%\Documents\InControl\exports\` |

データの取り扱いに関する詳細については、[PRIVACY.md](./docs/PRIVACY.md) を参照してください。

## トラブルシューティング

一般的な問題と解決策は、[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) に記載されています。

### クイックフィックス

**アプリケーションが起動しない場合:**
- .NET 9.0 Runtimeがインストールされているか確認してください。
- `dotnet --list-runtimes` を実行して確認してください。

**モデルが利用できない場合:**
- Ollamaが実行されていることを確認してください: `ollama serve`
- モデルをダウンロードしてください: `ollama pull llama3.2`

**GPUが検出されない場合:**
- NVIDIAのドライバーを最新バージョンにアップデートしてください。
- CUDAツールのインストール状況を確認してください。

## 貢献

貢献を歓迎します。以下の手順に従ってください。

1. リポジトリをフォークしてください。
2. 機能ブランチを作成してください。
3. 新しい機能に対してテストを作成してください。
4. プルリクエストを送信してください。

## 問題の報告

1. まず、[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) を確認してください。
2. アプリケーション内の「診断情報のコピー」機能を使用してください。
3. 診断情報が添付された問題を報告してください。

## 技術スタック

| Layer | 技術 |
| ------- | ------------ |
| UIフレームワーク | WinUI 3 (Windows App SDK 1.6) |
| アーキテクチャ | MVVM (CommunityToolkit.Mvvmを使用) |
| LLM連携 | OllamaSharp、Microsoft.Extensions.AI |
| DIコンテナ | Microsoft.Extensions.DependencyInjection |
| 設定 | Microsoft.Extensions.Configuration |
| ロギング | Microsoft.Extensions.Logging + Serilog |

## バージョン

現在のバージョン: **0.4.0-alpha**

リリース履歴については、[CHANGELOG.md](./CHANGELOG.md) を参照してください。

## サポート

- **質問 / ヘルプ:** [ディスカッション](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **バグ報告:** [イシュー](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **セキュリティ:** [SECURITY.md](SECURITY.md)

## ライセンス

[MIT](LICENSE) -- 詳細については、[LICENSE](LICENSE) を参照してください。

---

*Windows向けに開発。ローカルAIを活用。*
