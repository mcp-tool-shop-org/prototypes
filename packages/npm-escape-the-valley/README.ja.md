<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

オレゴン・トレイル風のサバイバルゲームで、AIによるナレーション機能と、オプションでXRPLのテストネットのレジャー機能を備えています。

**Pythonは不要です。** このパッケージは、あらかじめコンパイルされたバイナリをダウンロードし、ローカルで実行します。

## インストールと実行

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

これだけで完了です。Python、pip、仮想環境は不要です。

### セーブデータのロード

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

中断した場所からそのまま再開できます。ゲームは、すべてのチェックポイントで自動的にセーブされます。

## 動作内容

1. 最初の実行時に、プラットフォームに合わせたバイナリ（約15MB）を[GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)からダウンロードします。
2. SHA256のチェックサムを検証します。
3. ローカルにキャッシュします（`~/.cache/mcptoolshop/escape-the-valley/`）。
4. 引数をそのまま引き継いで実行します。

以降の実行は、キャッシュから瞬時に起動します。

## ゲームについて

プロシージャルに生成された荒野を、入植者のグループと共に進みます。食料、水、荷車の状態、士気を管理しながら、イベント、危険、そして難しい選択肢に遭遇します。この谷は厳しくも公平です。熟練したプレイヤーは、3回の試行のうち約1回で成功します。

オプションで、**AIゲームマスター**（Ollama搭載）が、3種類のナレーションであなたの冒険を語ります。また、オプションで**XRPLテストネットのレジャー機能**を搭載したバックパックが、すべての物資の変動をオンチェーンの記録として追跡します。

### キャンプでのアクション

| アクション | 内容 |
|--------|-------------|
| **Travel** | 出口へ移動します。移動しないと、無駄に物資を消費します。 |
| **Rest** | 体力と士気を回復します。病気の治療の可能性もあります。 |
| **Hunt** | 食料を調達します（森林や平原で最も効果的です）。 |
| **Repair** | 荷車の損傷を修理します。放置すると、動けなくなる可能性があります。 |
| **Ration** | 食料が不足している場合は、配給を半分にします（士気を下げます）。 |
| **Abandon** | 速度を上げるために、積載量を減らします（最終手段）。 |

### ゲームマスターのプロファイル

| プロファイル | 声 |
|---------|-------|
| **Chronicler** | 冷静で事実に基づいた、歴史的な口調 |
| **Fireside** | 温かく、親しみやすい語り手 |
| **Lantern-Bearer** | 不気味で、雰囲気があり、不吉な |

## コマンド

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## 対応プラットフォーム

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## トラブルシューティング

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

最新バージョンに問題がある場合は、**特定のバージョンを指定してインストール**してください。

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## セキュリティ

すべてのバイナリは、実行前にSHA256のチェックサムで検証されます。テレメトリーは一切ありません。GitHubからの初期ダウンロード以外のネットワークアクセスはありません。

[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher)によって提供されています。

## 代替手段：Pythonでインストール

Pythonをご希望の場合は：

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

制作：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
