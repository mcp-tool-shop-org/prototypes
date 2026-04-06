<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## 概要

- **ASCIIレンダリング:** どんなWebSketchのキャプチャも、ターミナルやLLMのコンテキストウィンドウに収まるように、ボックス描画形式に変換します。
- **構造フィンガープリント:** ページのレイアウトをハッシュ化し、ピクセルごとの比較なしに変更を検出できるようにします。
- **意味的差分:** 2つのキャプチャを比較し、変更内容をランク付けしたレポート（追加、移動、サイズ変更、テキスト変更）を取得します。
- **バンドルパッケージング:** キャプチャ（およびオプションの差分）を、共有可能な`.ws.json`ファイルにまとめます。
- **パイプライン優先:** すべてのコマンドが`--json`出力と、CIスクリプト向けの決定的な終了コードをサポートしています。
- **LLM最適化モード:** `--llm`フラグは、エージェントが利用しやすいように、メタデータが豊富な出力を生成します。

## インストール

```bash
pnpm add -g @mcptoolshop/websketch
```

または、インストールせずに実行します。

```bash
npx @mcptoolshop/websketch render capture.json
```

## コマンド

### validate

キャプチャファイルがWebSketch IRスキーマに準拠しているかを確認します。

```bash
websketch validate capture.json
```

### render-ascii

キャプチャをASCIIアート（LLMで読み取り可能）にレンダリングします。

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**出力例:**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

比較用の構造フィンガープリントを計算します。

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

2つのキャプチャを比較し、変更点を報告します。

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

1つ以上のキャプチャを、共有可能な`.ws.json`ファイルにパッケージ化します。正確に2つのキャプチャが提供された場合、バンドルには自動的に差分サマリーが含まれます。

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## パイプラインモード

機械可読の出力を得るために、すべてのコマンドの前に`--json`を追加します。

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**成功:** `{ "ok": true, ... }`

**エラー:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

JSONモードでも、終了コードは有効です。スクリプトでは`$?`または`set -e`を使用してください。

## 終了コード

| Code | 意味 |
| ------ | --------- |
| 0 | 成功 |
| 1 | 検証/データエラー（不正なJSON、無効なキャプチャ、不明なコマンド） |
| 2 | ファイルシステムエラー（ファイルが見つからない、アクセス権がない、I/Oエラー） |

## キャプチャ形式

このCLIは、WebSketch IRキャプチャファイル（JSON）を扱います。キャプチャは、以下を使用して作成します。

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) -- Chrome拡張機能で、ワンクリックでページをキャプチャします。
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) -- プログラム的にキャプチャを作成します。

## ドキュメント

| ドキュメント | 説明 |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | 詳細ガイド：アーキテクチャ、コマンド、パイプラインのパターン、統合 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 貢献方法、開発環境のセットアップ、プルリクエストのガイドライン |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | コミュニティの基準 |
| [CHANGELOG.md](CHANGELOG.md) | リリース履歴 |

## ライセンス

MIT
