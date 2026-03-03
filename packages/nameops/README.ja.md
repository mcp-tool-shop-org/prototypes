<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

[clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine) 用の名前チェックオーケストレーター。

標準的な名前リストを、一括でのチェック実行、公開された成果物、そして人間が読みやすいプルリクエスト（PR）のサマリーに変換します。

## 動作原理

1. `data/names.txt` には、チェック対象となる標準的な名前リストが格納されています。
2. `data/profile.json` には、COE CLI のデフォルト設定（チャンネル、リスク、並列処理など）が格納されています。
3. `src/run.mjs` が、COE の一括処理、成果物の公開、検証をオーケストレーションします。
4. `src/build-pr-body.mjs` が、ティアごとのサマリー、衝突箇所のカード、およびコストに関する情報をまとめた Markdown 形式の PR の本文を生成します。
5. マーケティングリポジトリのスケジュールされたワークフローがこのロジックを呼び出し、取り込まれた成果物とともに PR を作成します。

## 使用方法

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## 設定

### `data/names.txt`

1行に1つの名前を記述します。 `#` で始まる行はコメントです。 最大500個の名前までです。

### `data/profile.json`

| Field | COE フラグ | デフォルト |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7日間) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | ワークフローのタイムアウト | `15` |

## 出力

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## アーキテクチャ

NameOps は、サービスではなくオーケストレーターです。 NameOps は、COE CLI 以外の実行時依存関係を持たず、独自のデータモデルを所有していません。 スケジュールはマーケティングリポジトリが管理します（CLAUDE.md のルールに従う）。 NameOps は、そのロジックを所有します。

## テスト

```bash
npm test
```

## ライセンス

MIT
