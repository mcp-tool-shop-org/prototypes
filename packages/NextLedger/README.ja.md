<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# NextLedger

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/NextLedger/readme.png" alt="NextLedger" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/NextLedger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Windows版 予算管理ツール - すべてのお金を有効活用しましょう。

Windows環境に最適化された、エンベロープ方式による個人向け家計簿アプリです。データはすべてローカルに保存され、クラウド接続は不要です。このアプリは、**未来の会計システム**として設計されており、明確な人間の意思決定に基づいた、信頼性の高い財務管理システムです。

## ダウンロード

📦 **[最新リリース](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

ZIPファイルをダウンロードし、展開して、`NextLedger.App.exe`を実行してください。インストールは不要です。

## エンベロープ予算とは何ですか？

エンベロープ予算とは、収入を仮想の「封筒」に分け、それぞれの封筒に異なる支出カテゴリを設定する、シンプルで効果的な方法です。各封筒に入っている金額以上の支出はできないため、使いすぎを防ぐことができます。

## 特徴

- **オフライン優先**: データはすべてローカルマシンに保存されます。クラウド接続は不要です。
- **エンベロープ式予算管理**: すべての費用を目的別に割り当てます。
- **複数アカウント対応**: 預金口座、貯蓄口座、クレジットカード、現金などを管理できます。
- **取引履歴の追跡**: 支出を分類し、検索できます。
- **CSVインポート**: 銀行の明細書を簡単にインポートできます。
- **照合機能**: 記録と銀行の明細書を照合できます。
- **Windowsネイティブ**: 最新のWindowsエクスペリエンスを実現するために、WinUI 3で構築されています。

## スクリーンショット

*近日公開予定*

## ドキュメント

- [変更履歴](CHANGELOG.md)
- [エンジン エラーコード](ENGINE_ERROR_CODES.md)
- [リリース プロセス](docs/RELEASE_PROCESS.md)
- [将来のLedgerのビジョン](docs/FUTURE_LEDGER_VISION.md)
- [Ledger実行チェックリスト](docs/LEDGER_EXECUTION_CHECKLIST.md)

## テクノロジー

- **UI (ユーザーインターフェース)**: WinUI 3 / Windows App SDK
- **プログラミング言語**: C# / .NET 9
- **データベース**: SQLite (ローカル)
- **アーキテクチャ**: MVVMに基づいたクリーンアーキテクチャ

## プロジェクトの状況

✅ **v1.0.0** - リリース準備完了。

主要機能が完了しました：
- 月ごとの予算設定機能
- 分割機能付きの取引履歴追跡機能
- 銀行明細からのCSVインポート機能
- 口座残高照合機能
- 予算カテゴリごとの支出分析機能
- アプリ内ヘルプおよびガイダンス機能

詳細なアーキテクチャについては、[DESIGN.md](DESIGN.md) を参照してください。

## ロードマップ

NextLedgerは、より高度なシステムへと進化しており、その全体的なアーキテクチャについては、[Future Ledger Vision](docs/FUTURE_LEDGER_VISION.md)をご参照ください。

| Layer | 状態 | 説明 |
| The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。)
------- | 以下に翻訳します。
-------- | 以下に翻訳します。
-------------
申し訳ありませんが、翻訳するテキストが提供されていません。テキストを入力してください。 |
| 観察 | ✅ 完了しました。 | ローカルの残高、取引、口座。 |
| 解釈 | ✅ 完了しました。 | 予算管理（エンベロープ方式）、支出分析。 |
| 意図の表明 | 🔜 予定中 | 予算目標、予算配分ルール。 |
| 制約の適用・遵守。
または、制約の強制。 | 🔜 予定中 | 予算制限、および予算超過防止機能。 |
| ユーザー承認済み実行。 | 🔮 未来 | Web3との連携（非カストディアル方式） |

## 開発

### 前提条件

- Windows 10 (1809 以降) または Windows 11
- Visual Studio (2022 17.8 以降のバージョン) で、以下のものがインストールされていること:
- .NET デスクトップ開発 ワークロード
- Windows App SDK C# テンプレート
- Windows SDK / MSIX (Appx/PRI ビルドツール)
- .NET 9 SDK

**CLIビルドに関する注意点 (WinUI):** WinUIプロジェクト (`NextLedger.App`) は、Appx/MSIX + PRIのMSBuildタスクアセンブリを必要とするWindows App SDKのビルド手順を実行します。 `Microsoft.Build.AppxPackage.dll` または `Microsoft.Build.Packaging.Pri.Tasks.dll` が見つからないという `MSB4062` のようなエラーが表示された場合は、Visual StudioインストーラーからWindows SDK / MSIXコンポーネントをインストールするか、Visual Studio内でアプリをビルドしてください。

### ビルド

```bash
dotnet restore
dotnet build
```

### アプリの実行方法

**Visual Studio (推奨)**

1. Visual Studio 2022で `NextLedger.sln` を開きます。
2. `NextLedger.App` を起動プロジェクトとして設定します。
3. **F5** キーで実行します。

**CLI (ビルド + 起動)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

`MSB4062` で失敗する場合は、「前提条件」の注意点をご確認ください。

次に、以下のフォルダにある生成されたexeファイルを実行します。

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**ローカルデータ保存場所**

このアプリは、以下の場所にローカルのSQLiteデータベースを作成します。

- `%LOCALAPPDATA%\NextLedger\NextLedger.db`

### テストの実行

```bash
dotnet test
```

## ライセンス

MITライセンス - 詳細については、LICENSEファイルをご覧ください。

## 作者

ビルド: [mcp-tool-shop](https://github.com/mcp-tool-shop-org)
