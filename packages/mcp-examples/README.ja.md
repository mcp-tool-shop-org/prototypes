<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[MCP Tool Shop](https://github.com/mcp-tool-shop) のサンプルワークスペースです。

## MCP Tool Shop の構成

- **レジストリ** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → 存在するツールの一覧
- **CLI** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → ツールの利用方法
- **サンプル** → モデルの学習方法（このリポジトリ）
- **タグ** (v0.1.0, v0.2.0) → 安定性、再現性
- **main** → 開発用のみ。予告なく変更される可能性があります。ビルドが失敗する可能性もあります。
- **ツールはデフォルトで最小権限で動作** → ネットワーク接続なし、書き込み権限なし、副作用なし
- **機能は常に明示的に、かつオプションで有効化** → いつ有効にするかはユーザーが決定します。

## サンプル

| 例 | 説明 |
| --------- | ------------- |
| [hello-tools](./hello-tools/) | 最初の MCP ワークスペースを 2 分で構築 |
| [hello-filesystem](./hello-filesystem/) | 安全に処理される不可逆的な副作用 |

## クイックスタート

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## 関連

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - ツールの検索と実行を行うための CLI
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - ツールのメタデータレジストリ
