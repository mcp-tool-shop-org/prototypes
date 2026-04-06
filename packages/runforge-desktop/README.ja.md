<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<h1 align="center">RunForge Desktop</h1>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop**は、機械学習（ML）のトレーニング実行の作成、監視、および検査を行うための、Windowsネイティブのデスクトップアプリケーションです。

これは、ML実験のための視覚的な制御インターフェースを提供します。実行の作成、リアルタイムチャートによるライブトレーニングの監視、および完了した実行の詳細な検査が可能です。

> **公式のリファレンス（成果物、スキーマ、保証事項）：**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## なぜRunForge Desktopを使うのか？

多くのML実験トラッカーは、クラウドベースのSaaSプラットフォームであり、アカウントの作成、テレメトリーの送信、複雑さの増加といった問題があります。RunForge Desktopは、その逆のアプローチを採用しています。**すべての処理は、ローカルマシン上で行われます。**

RunForge Desktopを使用すると、以下のことが可能です。

- 事前設定された構成でトレーニング実行を作成
- リアルタイムチャートとログによるライブトレーニングの監視
- 完了した実行とその出力の閲覧
- メトリクス、ログ、および成果物の検査
- 実行の管理（キャンセル、出力の表示、コマンドのコピー）

すべてのトレーニング実行は、Pythonを使用してローカルマシン上で行われます。クラウドは不要です。テレメトリーも不要です。アカウントも不要です。

---

## NuGetパッケージ

| パッケージ | 説明 |
| --------- | ------------- |
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | MLトレーニング実行の管理のためのコアドメインモデルとサービス。実行のライフサイクル、ハイパーパラメータの最適化、ライブ監視、および成果物の検査が含まれます。 |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## クイックスタート

### インストール

**オプション1：MSIXパッケージ（推奨）**
1. [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)から`.msix`ファイルをダウンロードします。
2. ダブルクリックしてインストールします。
3. スタートメニューから起動します。

**オプション2：ソースコードからのビルド**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

詳細なインストールオプションについては、[docs/INSTALL.md](docs/INSTALL.md)を参照してください。

### 使い方

1. **RunForge Desktopを起動します。**
2. **ワークスペースを選択します。** 「ワークスペースの選択」をクリックし、ML実験用のフォルダを選択します。
3. **トレーニングを開始します。** 「トレーニング」をクリックして、トレーニング実行を構成し、開始します。
4. **ライブ監視を行います。** リアルタイムの損失チャートとログで、トレーニングの進捗状況を監視します。
5. **実行を閲覧します。** すべての実行を、ステータスでフィルタリングして表示します。
6. **詳細を検査します。** 任意の実行をクリックして、メトリクス、成果物、および出力を表示します。

---

## 機能

### トレーニング実行の作成
- エポックの事前設定（クイック、標準、拡張、カスタム）でトレーニング実行を構成します。
- GPU/CPUデバイスの選択（自動検出）。
- 高度な設定：バッチサイズ、学習率、オプティマイザー、スケジューラー。
- オプションで、カスタムデータセットのパスを指定します。

### ハイパーパラメータの最適化（MultiRun）
- 異なるハイパーパラメータの組み合わせで、複数の実験を実行します。
- 学習率、バッチサイズ、およびオプティマイザーを、カンマ区切りのリストとして構成します。
- すべての組み合わせに対して、自動グリッドサーチを実行します。
- 最終的な損失に基づいて、最も優れた構成を追跡します。

### ライブ監視
- 自動更新されるリアルタイムの損失チャート。
- トレーニングプロセスからのライブログのストリーミング。
- 進行状況の追跡（エポック、ステップ、経過時間）。
- 実行中のトレーニングをいつでもキャンセルできます。

### 実行の閲覧
- 最新の実行が最初に表示されるように実行を閲覧します。
- ステータスでフィルタリング：保留中、実行中、完了、失敗、キャンセル。
- 実行の詳細と出力を表示します。

### 実行の検査
- **メトリクス：** 損失曲線、精度、トレーニング統計。
- **ログ：** トレーニングプロセスからの完全な標準出力/標準エラー出力。
- **成果物：** 出力フォルダを開き、トレーニングコマンドをコピーします。

### 診断
- アプリケーションのバージョン、フレームワーク、およびメモリ使用量を表示します。
- ワークスペースのパスとPythonの設定を表示します。
- サポートのために、診断情報をクリップボードにコピーします。

---

## 基本原則

### ローカル優先
すべてのトレーニングは、お客様のコンピューター上で行われます。クラウドは不要です。

### 透明性
何が起こっているのかを正確に把握できます。ライブログ、リアルタイムのメトリクス、完全なプロセス制御。

### シンプル
1つのワークスペース、明確なプリセット、管理する必要のある設定ファイルはありません。

### 監査可能
すべての実行結果はディスクに保存され、検査と再現が可能です。

---

## 仕組み

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

RunForge Desktopは、作成、実行、監視、検査という、すべてのライフサイクルを管理します。

---

## システム要件

| 要件 | Value |
| ------------- | ------- |
| OS | Windows 10 (1809+) または Windows 11 |
| アーキテクチャ | x64 |
| 実行環境 | .NET 10 (MSIXに同梱) |
| Python | 3.10+ (トレーニング用) |
| GPU | オプション (GPUトレーニング用CUDA) |
| ディスク容量 | 約100MB |

---

## プラットフォームとパッケージング

| 属性 | Value |
| ----------- | ------- |
| プラットフォーム | Windows 10/11 |
| UIフレームワーク | .NET MAUI |
| パッケージング | MSIX (スタンドアロン) |
| インストール/アンインストール | クリーン、分離、元に戻し可能 |

このアプリケーションは、ファイルアクセスに関して、標準的なWindowsのアクセス許可モデルに従います。

---

## プロジェクトのステータス

| 属性 | Value |
| ----------- | ------- |
| 現在のバージョン | v1.0.0 |
| Scope | 機械学習のトレーニング、監視、検査 |

最近の変更については、[RELEASE_NOTES_v0.4.0.md](RELEASE_NOTES_v0.4.0.md) を参照してください。

---

## 開発

### 前提条件

- .NET 10 SDK
- Windows 10/11
- Visual Studio 2022 (17.12+) (MAUIワークロード付き) または、.NET MAUI拡張機能付きのVS Code

### ビルド

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### プロジェクトの構成

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── PHASE-DESKTOP-0.1-ACCEPTANCE.md
│   └── INSTALL.md
└── scripts/
    ├── build-msix.ps1
    └── build-release.cmd
```

---

## RunForge Coreとの関係

すべてのスキーマ、保証、およびアーティファクト形式は、以下で定義および固定されています。

> https://github.com/mcp-tool-shop-org/runforge-vscode

このリポジトリには、以下が含まれています。
- トレーニングロジックは含まれていません
- スキーマ定義は含まれていません
- 所有権の定義は含まれていません

RunForge Desktopは、これらのアーティファクトを忠実に**利用**します。

---

## 対象ユーザー

- Windows上でローカルでモデルをトレーニングする開発者
- シンプルで検査可能な実験追跡が必要な研究者
- ネイティブなWindowsの機械学習トレーニングUIを求めるユーザー
- ローカルファーストでクラウドに依存しない機械学習ワークフローを求めるチーム

---

## ライセンス

MITライセンス - 詳細については、[LICENSE](LICENSE) を参照してください。

---

## 信頼性テスト

RunForgeには、キューイング、一時停止/再開、キャンセル、クラッシュからの復旧、公平性、ディスクドリフト耐性、およびデスクトップの再接続動作を検証するための、繰り返し可能な信頼性テストスイートが付属しています。

| テスト項目 | Focus |
| ---------- | ------- |
| G1 | 並列処理の制限 |
| G2 | 一時停止/再開 |
| G3 | キャンセルの一貫性 |
| G4 | クラッシュからの復旧 |
| G5 | 公平なスケジューリング |
| G6 | ディスクドリフト耐性 |
| G7 | デスクトップの再接続 |
| G8-G10 | GPUサポート (v0.4.0以降) |

詳細については、[`docs/GAUNTLETS.md`](docs/GAUNTLETS.md) を参照してください。

---

## 貢献

貢献は大歓迎です。以下のコア原則を尊重してください。

- シンプルさを保ち、ローカルファーストを優先する
- クラウドへの依存やテレメトリーは避ける
- 明確で実行可能なエラーメッセージを提供する

---

## サポート

- **問題点**: [GitHub Issues](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **診断**: 診断ページを使用して、システム情報をコピーし、バグ報告に添付してください。
