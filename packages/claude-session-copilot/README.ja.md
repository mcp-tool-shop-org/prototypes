<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## なぜですか？

Claude Codeのセッションは一時的なものです。`/compact`コマンドを実行したり、新しいセッションを開始したりすると、思考、決定、進捗状況がすべて消えてしまいます。Session Copilotはこれらすべてを記録し、復元できるようにします。

**このプラグインはClaude Codeでのみ動作します**。これは、PostToolUseフック、スキル、リソース通知、およびCLAUDE.mdコンテキストインジェクションに依存しており、他のMCPクライアントにはこれらの機能がありません。

## クイックスタート

```bash
npx @mcptoolshop/claude-session-copilot
```

### Claude Codeプラグイン

プロジェクトの`.mcp.json`ファイルに追加します。

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

## 機能

### 7つの機能

| 機能 | 目的 |
| ------ | --------- |
| `copilot.decision` | 決定を記録する（何をしたか、なぜそうしたか、代替案はなぜ却下したか） |
| `copilot.snapshot` | セッションの状態を保存して、継続性を確保する |
| `copilot.resume` | 最新のスナップショットと決定をロードして、新しいセッションを開始する |
| `copilot.timeline_event` | タイムラインのイベントを記録する |
| `copilot.query` | 決定、タイムライン、スナップショットを検索する |
| `copilot.pulse` | プロジェクトの健全性ダッシュボードを表示する |
| `copilot.forget` | 古いデータを削除する |

### 4つのスキル（Claude Codeのみ）

| スキル | 機能 |
| ------- | ------------- |
| `/copilot:resume` | 前回のセッションの続きから始める |
| `/copilot:snapshot` | `/compact`コマンドを実行する前に、包括的な状態を保存する |
| `/copilot:decisions` | 決定のログを確認する |
| `/copilot:pulse` | プロジェクトの健全性ダッシュボードを表示する |

### 4つのPostToolUseフック（Claude Codeのみ）

以下の操作後に、自動的にタイムラインに記録されます。
- **Bash** — ビルド/テストの結果（成功/失敗）を検出します
- **Write** — ファイルの作成を記録します
- **Edit** — ファイルの変更を記録します
- **TodoWrite** — タスクの状態変更を記録します

### パターン検出

以下の状況を検知すると、アラートを表示します。
- **繰り返し失敗** — 同じコマンドが3回以上失敗する
- **頻繁なファイル変更** — 同じファイルが1セッションで5回以上編集される
- **長時間のセッション** — スナップショットなしで100以上のイベントが発生する

### 4つのリソース

| URI | 表示内容 |
| ----- | --------------- |
| `copilot://pulse` | プロジェクトの健全性（リアルタイム） |
| `copilot://timeline` | 現在のセッションのイベント |
| `copilot://decisions` | 最近の決定ログ |
| `copilot://snapshot/latest` | 最新の引き継ぎメモ |

## セッションのライフサイクル

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## ストレージ

データは`.claude/copilot/store.json`（プロジェクトローカル）または`~/.claude/copilot/store.json`（グローバルバックアップ）に保存されます。

`COPILOT_STORE_PATH`環境変数で上書きできます。

## Claude Codeでのみ動作する理由

このサーバーは、Claude Codeの基本的な機能に依存しています。

| 機能 | Claude Codeの基本的な機能 | 他のMCPクライアント |
| --------- | ---------------------- | ------------------- |
| 自動タイムライン | PostToolUseフック | フックシステムなし |
| スラッシュコマンド | スキル（SKILL.md） | スキルなし |
| コンテキストインジェクション | CLAUDE.md | 同等の機能なし |
| リアルタイムダッシュボード | リソース通知 | リソースのポーリングなし |
| タスクの調整 | TodoWriteフック | TodoWrite機能なし |

これらがないと、サーバーは単なるJSONファイルであり、自動的にデータを入力する方法がありません。

## ライセンス

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
