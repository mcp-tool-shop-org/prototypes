<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**メタデータのみを登録するリポジトリ。MCP Tool Shop のすべてのツールに関する唯一の信頼できる情報源です。**

コミットごとにスキーマ検証が行われます。ルールに基づいて構築された、あらかじめ定義されたツールセットです。検索インデックスがパッケージに同梱されています。バージョンを固定すると、毎回同じメタデータが取得できます。

## クイックスタート

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## 概要

- **データのみ**：実行可能なコードは含まれておらず、エコシステム内のすべてのツールに関する JSON メタデータのみが含まれています。
- **スキーマ検証済み**：すべてのエントリが、コミット時および CI 環境で JSON スキーマに対して検証されます。
- **ツールセットシステム**：ツールは、手動でのキュレーションではなく、ルールに基づいて `core`、`agents`、`ops`、`evaluation` などのツールセットにグループ化されます。
- **高速な検索**：キーワードとファセットを含む、あらかじめ構築された検索インデックスがパッケージに含まれています。
- **最小権限**：ツールはデフォルトで最小限の機能しか持っていません。副作用はオプションであり、明示的に宣言する必要があります。
- **再現性**：リポジトリのバージョンを固定すると、毎回同じメタデータが取得できます。

## 利用対象者

### 完全なリポジトリ

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### ツールセット

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

利用可能なツールセット：`core`、`agents`、`ops`、`evaluation`。

### 検索インデックス

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### LLM コンテキスト

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## ツールセット

| ツールセット   | 説明                                                             | 選択ロジック                               |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| **core**       | 基本的なユーティリティ                                           | 明示的な ID リスト                         |
| **agents**     | エージェントのオーケストレーション、ナビゲーション、コンテキスト | 明示的な ID と `agents` タグ               |
| **ops**        | DevOps、インフラストラクチャ、デプロイメント                     | タグ：`automation`、`packaging`、`release` |
| **evaluation** | テスト、ベンチマーク、カバレッジ                                 | タグ：`testing`、`evaluation`、`benchmark` |

## 構造

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## ツールの追加

1. [docs/registry-guidelines.md](docs/registry-guidelines.md) を参照してください。
2. `registry.json` にエントリを追加します（`id` でソートされた状態を維持してください）。
3. `npm run validate` と `npm run policy` を実行します。
4. プルリクエストを送信します。

## バージョン管理

v1 の仕様は安定しています。マイナーバージョンで新しいオプションフィールドが追加される可能性がありますが、必須フィールドおよび既存のフィールドの構造は、メジャーバージョン内では変更されません。

## エコシステム

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)**：ツールを発見、インストール、実行します。
- **[ツールの登録](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)**：ツールをエコシステムに追加します。

## ライセンス

MIT — 詳細については、[LICENSE](LICENSE) を参照してください。
