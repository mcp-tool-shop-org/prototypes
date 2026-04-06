<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

レシートは、**何が起こったか**を記録した、署名付きでタイムスタンプが付けられ、再現可能な記録です。

- **何が行われたか**：アクション、入力、出力
- **なぜそれが実行されたか**：意図、ポリシー、コンテキスト
- **誰/何が実行したか**：実行者、ツール、バージョン
- **それが実際に起こったことの証明**：ハッシュ値、リンク、チェックサム、ログ
- **どのように検証するか**：コマンド、再実行手順

レシートは30秒で読み、2分で検証できます。すべてが再現可能です。もし再現できないなら、それはレシートではありません。

## パッケージ

| パッケージ | 説明 |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | レシートのスキーマ、正規化、SHA-256ハッシュ、Fluent Builder API |
| [`@receipt-factory/render`](packages/render) | MarkdownとスタンドアロンHTMLレンダラー |
| [`@receipt-factory/verify`](packages/verify) | スキーマ検証、ハッシュの完全性、リンクの検証、ポリシーの適用 |
| [`@receipt-factory/sign`](packages/sign) | Cosignベースの署名：レシート、ポリシー、バンドル（分離されたサイドカー） |
| [`@receipt-factory/evidence`](packages/evidence) | エビデンスパック：ポータブルな、コンテンツアドレス指定されたエビデンスバンドル |
| [`@receipt-factory/index`](packages/index) | レシートインデックス：レシートディレクトリをスキャン、検索、フィルタリング |
| [`@receipt-factory/policy`](packages/policy) | ポリシーパック：ポータブルでバージョン管理されたLint設定 |
| [`@receipt-factory/bundle`](packages/bundle) | レシートバンドル：自己検証型の真実のカプセル（zip） |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | `gh` CLIを介したGitHub Actionsデータ取得 |
| [`@receipt-factory/cli`](apps/factory-cli) | `rf`コマンド：レシートの作成、収集、レンダリング、検証、署名 |

## パイプライン

| パイプライン | レシートの種類 | それが証明するもの |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | 特定の入力と結果を使用したCIビルド/テストが行われたこと |
| [`release-receipts`](pipelines/release-receipts) | `release` | 特定の資産とコミットを使用してリリースが公開されたこと |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | 公開されたものとリポジトリにあるものの違い（ドリフト分類） |
| [`security-audit`](pipelines/security-audit) | `audit` | スキャンされたもの、使用したツール、検出された脆弱性 |
| [`sbom`](pipelines/sbom) | `sbom` | ソフトウェアの部品表（SBOM）が生成され、その正当性が証明されたこと |

## クイックスタート

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## 信頼レイヤー

receipt-factoryは、4つの信頼レイヤーを提供します。

1. **レシートの完全性**：改ざんを検知可能なSHA-256コンテンツアドレス指定レシート
2. **ガバナンスの完全性**：署名されたポリシーファイルを使用したポリシーベースのLintルール
3. **バンドルの完全性**：ハッシュマニフェストを含む自己検証型のzipバンドル
4. **バンドルの権限**：バンドルに対する分離されたCosign署名（改ざん防止）

検証順序：署名 → ファイルの完全性 → 意味的な完全性 → ガバナンス。

## これが証明するもの

- 特定の時刻にビルド、テスト、リリース、監査、またはSBOMの生成が行われたこと
- 入力と出力はコンテンツアドレス指定されており、改ざんを検知可能であること
- `rf verify`を使用して、いつでもレシートを再検証できること
- `rf graph`を使用して、完全なトレーサビリティチェーンを辿ることができること

## これが証明できないこと

- 基盤となるコードが正しいこと（レシートはプロセスを証明するだけで、品質は証明しない）
- CI環境自体が侵害されていないこと（これはサプライチェーンの問題）
- レシート作成後にアーティファクトが変更されていないこと（その場合は署名を使用する）

## セキュリティ

脅威モデルと報告については、[SECURITY.md](SECURITY.md)を参照してください。

**テレメトリーは一切ありません。** receipt-factoryは、外部サーバーへの通信、利用状況の追跡、または分析データの収集を行いません。

## ライセンス

MIT

---

開発者：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
