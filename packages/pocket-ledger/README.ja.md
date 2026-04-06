<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Windows向けの、ローカル環境を重視した個人向けファイナンスおよび予算管理アプリ。シンプルで使いやすく、プライバシー保護に重点を置いています。

## 理念

- **ローカルファースト**: 金融データはすべてデバイス上に保存されます。クラウド同期は不要です。
- **設計段階からのプライバシー**: テレメトリーは一切行わず、ユーザーが明示的に許可しない限り、外部への接続はありません。
- **エンベロープ式予算管理**: すべての支出を特定の目的（エンベロープ）に割り当てる、実績のある方法論です。
- **目標志向**: 支出だけでなく、何のために貯金しているのかに焦点を当てます。

## 機能（予定）

- [ ] 取引履歴のカテゴリ別追跡
- [ ] エンベロープ式予算管理システム
- [ ] 視覚的な進捗表示付きの貯蓄目標
- [ ] 定期的な取引管理
- [ ] 視覚的な支出分析とレポート
- [ ] 複数アカウントのサポート
- [ ] CSVインポート/エクスポート
- [ ] ダーク/ライトテーマのサポート

## 技術スタック

- **.NET 8**: 最新で高性能な実行環境
- **WinUI 3 / Windows App SDK**: ネイティブなWindows 11エクスペリエンス
- **SQLite**: ローカルで持ち運び可能なデータベース
- **アーキテクチャ**: メンテナンス性とテスト容易性を重視した設計

## プロジェクト構成

```
src/
├── PocketLedger.Domain/        # Core entities and business rules
├── PocketLedger.Application/   # Use cases and application logic
├── PocketLedger.Infrastructure/# Data persistence, external services
└── PocketLedger.Desktop/       # WinUI 3 presentation layer
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## 開発

### 前提条件

- Windows 10/11
- Visual Studio 2022 (17.8+) または C# Dev KitをインストールしたVS Code
- .NET 8 SDK
- Windows App SDK

### ビルド

```bash
dotnet build
```

### テストの実行

```bash
dotnet test
```

## ライセンス

MITライセンス - 詳細については、[LICENSE](LICENSE) をご確認ください。

## 貢献

貢献を歓迎します！プルリクエストを送信する前に、必ず貢献ガイドラインをお読みください。

---

開発者: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
