<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**コードの理解を深めましょう。**

Code Bearingsは、最新のコードベースを対象とした、ソースコードに基づいた制御インターフェースです。TypeScriptプロジェクトを、ファイル、シンボル、モジュール、依存関係のグラフとしてインデックス化し、その情報をCLI、VS Code、CIなど、必要なあらゆる場所に表示します。

常に正確な情報を提供します。AIが説明、教育、情報提供を支援します。最終的な判断は人間が行います。

## 機能

| 表示 | 得られるもの |
|---------|-------------|
| **CLI** | `code-bearings analyze`コマンドは、プロジェクトをインデックス化します。`code-bearings review`コマンドは、Gitの差分から変更内容の概要を生成します。リスクスコアが付けられ、根拠が示され、レビュー担当者向けのガイダンスが含まれます。 |
| **VS Code** | アクティビティバーのツリー表示、インタラクティブなレビューパネル、ホバー時のツールチップ、CodeLensのアノテーション、ガターの装飾、ステータスバーのコンテキスト情報など、すべてが同じ正確な情報源から提供されます。 |
| **CI** | `code-bearings ci`コマンドは、レビューレポート（Markdown、JSON、HTML）を生成し、必要に応じてリスクの閾値を超えた場合にビルドを失敗させます。 |

## インストール

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## クイックスタート

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## アーキテクチャ

Code Bearingsは、厳格なレイヤー構造を持つ3つのパッケージを含むモノレポです。

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**コアは真実を管理します。** CLIと拡張機能は軽量です。派生製品はありません。

### 真実の3つのレイヤー

| レイヤー | 内容 | 例 |
|-------|------|---------|
| **A. Extracted Truth** | ソースコードからの事実 | 「関数Xは関数Yを呼び出す」 |
| **B. Derived Structure** | レイヤーAから算出 | 「モジュールMの依存関係数は7、リスクスコアは25」 |
| **C. Human Narration** | A+Bによる説明 | 「この変更により、高トラフィックのパスからのエラー処理が削除されました」 |

### 5つの目的別モード

一般的なレビューは、事実を提示します。他のモードは、人間がその事実に基づいて思考できるように支援します。

| モード | レンズ |
|------|------|
| **General** | 変更内容の概要（変更点、リスク、根拠） |
| **Bug Hunter** | 失敗の可能性、見落としの可能性、調査のヒント |
| **Learning** | 構文の翻訳、変更前後の説明 |
| **Architecture** | モジュールの役割、境界の状態、システムの位置 |
| **Exploration** | 不明なコードベースに対する質問 |

## パッケージ

| パッケージ | 説明 | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | 共有の抽出、グラフ作成、レビュー、レンダリングロジック | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | コマンドラインインターフェース | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | VS Code拡張機能 | — |

## 要件

- Node.js >= 20
- `tsconfig.json`ファイルを含むTypeScriptプロジェクト
- Git（レビュー/比較コマンド用）

## セキュリティと信頼性

- **ネットワークアクセスはありません。** テレメトリー、分析、および外部へのデータ送信はありません。
- **読み取り専用のソースコードアクセス。** Code Bearingsは、AST解析によってソースファイルを読み取ります。ファイルを変更することはありません。
- **ローカルデータベースのみ。** `.code-bearings/bearings.db`というSQLiteファイルは、プロジェクト内に保存されます。
- **コードの実行はありません。** 静的解析のみを行います。

詳細については、[SECURITY.md](SECURITY.md)を参照してください。

## ライセンス

[MIT](LICENSE)

---

開発：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
