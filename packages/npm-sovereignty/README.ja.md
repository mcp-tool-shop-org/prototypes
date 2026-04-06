<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sovereignty/readme.png" width="400" alt="sovereignty" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/sovereignty"><img src="https://img.shields.io/npm/v/@mcptoolshop/sovereignty" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-sovereignty/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/sovereignty/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

統治、信頼、そして貿易に関する戦略ゲーム。オフラインのテーブルトーク形式と、XRPLによるオンライン認証に対応しています。

**Pythonは不要です。** このパッケージは、あらかじめコンパイルされたバイナリをダウンロードし、ローカルで実行します。

## インストールと実行

```bash
npx @mcptoolshop/sovereignty tutorial
```

これだけで完了です。Python、pip、仮想環境は不要です。

## 動作内容

1. 最初の実行時に、プラットフォームに合わせたバイナリファイル（約25MB）を[GitHub Releases](https://github.com/mcp-tool-shop-org/sovereignty/releases)からダウンロードします。
2. SHA256チェックサムによる検証を行います。
3. ローカルにキャッシュします（`~/.cache/mcptoolshop/sovereignty/`）。
4. 引数をそのまま引き継いで実行します。

以降の実行は、キャッシュから瞬時に起動します。

## コマンド

```bash
npx @mcptoolshop/sovereignty tutorial    # learn the rules
npx @mcptoolshop/sovereignty new         # start a new game
npx @mcptoolshop/sovereignty status      # check game state
npx @mcptoolshop/sovereignty --help      # see all commands
```

## 対応プラットフォーム

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## セキュリティ

すべてのバイナリファイルは、実行前にSHA256チェックサムによって検証されます。テレメトリー機能はありません。GitHubからの初期ダウンロード以外、ネットワークアクセスはありません。

[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher)によって提供されています。

## 代替手段：Pythonによるインストール

もしPythonをご希望の場合は：

```bash
pipx install sovereignty-game
sov tutorial
```

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
