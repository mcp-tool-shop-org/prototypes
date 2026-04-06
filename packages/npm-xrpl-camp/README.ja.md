<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

XRP Ledgerの基礎を1回のセッションで学習できます。ウォレット、支払い、検証、証明書について、10分で理解できます。

**Pythonは不要です。** このパッケージは、あらかじめコンパイルされたバイナリをダウンロードし、ローカルで実行します。

## インストールと実行

```bash
npx @mcptoolshop/xrpl-camp start
```

これだけで完了です。Python、pip、仮想環境は不要です。

## 動作内容

1. 最初の実行時に、プラットフォームに合わせたバイナリファイル（約20MB）を[GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-camp/releases)からダウンロードします。
2. SHA256チェックサムによる検証を行います。
3. ローカルにキャッシュします（`~/.cache/mcptoolshop/xrpl-camp/`）。
4. 引数をそのまま引き継いで実行します。

以降の実行は、キャッシュから瞬時に起動します。

## コマンド

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## 対応プラットフォーム

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## セキュリティ

すべてのバイナリファイルは、実行前にSHA256チェックサムによって検証されます。テレメトリー機能はありません。GitHubからの最初のダウンロード以外、ネットワークへのアクセスはありません。

[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher)によって提供されています。

## 代替手段：Pythonによるインストール

Pythonをご希望の場合は：

```bash
pipx install xrpl-camp
xrpl-camp start
```

---

作成：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
