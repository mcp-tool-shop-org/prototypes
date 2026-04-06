<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

Claude Codeの連携に関する問題の診断を行うコマンドラインツールです。無効になっているプラグインからの不要な連携、スコープの競合、設定の誤り、およびClaude Codeの既知のバグを検出します。

## インストール

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

または、直接実行します。

```bash
npx @mcptoolshop/claude-hook-debug
```

## 使用方法

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

エラーが見つかった場合は終了コードが1、エラーがない場合は0になります。

## 検出される内容

| ID | 重要度 | 説明 |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | error | `claude-preview`プラグインが無効になっているにもかかわらず、Stop連携が依然として実行される（[#19893](https://github.com/anthropics/claude-code/issues/19893)）。 |
| `GHOST_HOOK_GENERIC` | warning | 無効になっているプラグインで、まだ連携が有効になっている可能性がある。 |
| `LOCAL_ONLY_PLUGINS` | error | ローカル設定の`enabledPlugins`が、サイレントに上書きされる（[#25086](https://github.com/anthropics/claude-code/issues/25086)）。 |
| `SCOPE_CONFLICT` | warning | あるスコープでプラグインが有効になっているが、別のスコープで無効になっている。 |
| `STOP_CONTINUE_LOOP` | error | Stop連携が`continue:true`を出力し、無限ループを引き起こす（[#1288](https://github.com/anthropics/claude-code/issues/1288)）。 |
| `DISABLE_ALL_HOOKS_ACTIVE` | warning/error | `disableAllHooks: true`を設定すると、すべての連携が無効になる（管理設定が存在する場合はエラーに昇格する）。 |
| `BROKEN_SETTINGS_JSON` | error | 無効なJSON形式の場合、そのファイルの設定全体がサイレントで無効になる。 |
| `LARGE_SETTINGS_FILE` | warning | 設定ファイルが100KBを超える場合（起動が遅くなる可能性がある）。 |
| `PLUGIN_HOOKS_INVISIBLE` | info | ユーザー連携は定義されていないが、プラグインが有効になっている場合、プラグインの連携は検査対象にならない。 |

## 設定のスコープ

このツールは、Claude Codeのロード順で定義されている、すべての設定スコープを読み込みます。

| スコープ | パス | 優先度 |
|-------|------|------------|
| managed | `~/.claude/managed-settings.json` | 最高 |
| user | `~/.claude/settings.json` | |
| project | `.claude/settings.json` | |
| local | `.claude/settings.local.json` | 最低（最後に書き込まれたものが優先） |

## ライブラリの使用

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## セキュリティと脅威モデル

**アクセスするファイル:** Claude Codeの設定ファイル (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`)。 すべての読み込みは読み取り専用であり、このツールはどのファイルも変更しません。

**アクセスしないファイル:** APIキー、トークン、環境変数、または認証情報は読み込まれたり、ログに記録されたりしません。設定ファイル内の`env`ブロックは完全に無視されます。Claude Codeの設定ファイルのパス以外のファイルにはアクセスしません。

**必要な権限:** `~/.claude/`ディレクトリとプロジェクトの`.claude/`ディレクトリへのファイルシステム読み取りアクセスが必要です。管理者権限は不要で、ネットワークアクセスやシェル実行も不要です。

**テレメトリはありません。** 分析機能もありません。外部へのデータ送信もありません。また、プロダクション環境で利用できる依存関係は一切ありません。

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/)によって作成されました。
