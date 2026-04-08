<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

小規模モデルを特定のタスクで学習させるためのデータセット構築ツール。

## 概要

特定の機能に特化した、構造化された高品質な学習データセットのライブラリです。各データセットには、生成ルール、検証ルール、評価セット、および一般的なファインチューニング環境へのエクスポートパスが含まれています。

## このツールの目的ではないこと

- 汎用的なデータセット集
- HuggingFaceのラッパー
- 学習フレームワーク

## インストール

```bash
pip install edgepacks
```

## クイックスタート

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## データセットの利用開始

| データセット | タスク | 学習対象 |
|------|------|---------------|
| `tool-routing` | 分類 | 自然言語による要求 → 適切なツール + 引数 |
| `structured-extraction` | 抽出 | 構造化されていないテキスト → 構造化されたJSON |
| `error-triage` | 分類 | エラーログ → 原因 + 深刻度 + 次の手順 |

## アーキテクチャ

3つのレイヤーで構成されます。

1. **スキーマ**: データセットがどのようなものであるかの正式な仕様
2. **ファウンダリ**: データセットの作成、検証、分割を行うための仕組み
3. **配信**: コマンドラインインターフェース（CLI）およびJSONL、HuggingFace、Unsloth、torchtuneへのエクスポート機能

## 各データセットには以下が含まれます

- タスク定義 + 標準的なスキーマ
- 学習データ、検証データ、テストデータの分割
- ポジティブな例と、学習を困難にするネガティブな例
- 生成レシピ（Ollamaを使用した合成データ生成）
- 形式が正しくない、または信号が弱いデータ行を拒否するバリデータ
- ファインチューニング後に実際のスキルをテストするための評価セット
- 既存のツールに直接統合できる形式へのエクスポート

## セキュリティと信頼性

**アクセスするデータ**: ユーザーが指定した出力ディレクトリ内のローカルの`.json` / `.jsonl`ファイル。シードデータはパッケージに同梱されています。生成されたデータは、`./output/`ディレクトリまたはユーザーが指定したパスに書き込まれます。

**ネットワーク**: 合成データの生成には、ローカルのOllamaインスタンス（`localhost:11434`）へのHTTP接続のみが必要です。クラウドAPI、テレメトリー、分析機能は一切ありません。Ollamaが利用可能になると、完全にオフラインで動作します。

**アクセスしないデータ**: 認証ファイル、システムファイル、環境変数は一切アクセスしません。ユーザーが指定した出力ディレクトリ以外のファイルには読み書きしません。

**テレメトリーは一切収集または送信しません。**

## 対応プラットフォーム

- Python 3.11以降
- Linux、macOS、Windowsで動作
- `generate`、`mutate`、および`build`コマンドには、Ollamaが必要です。

## ライセンス

MIT

---

開発元: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
