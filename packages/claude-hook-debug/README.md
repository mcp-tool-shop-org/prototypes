<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Diagnostic CLI for Claude Code hook issues. Detects ghost hooks from disabled plugins, scope conflicts, misconfigured settings, and known Claude Code bugs.

## Install

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

Or run directly:

```bash
npx @mcptoolshop/claude-hook-debug
```

## Usage

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

Exit code 1 if any errors are found, 0 otherwise.

## What It Detects

| ID | Severity | Description |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | error | claude-preview plugin disabled but Stop hook still fires ([#19893](https://github.com/anthropics/claude-code/issues/19893)) |
| `GHOST_HOOK_GENERIC` | warning | Any disabled plugin that may still have active hooks |
| `LOCAL_ONLY_PLUGINS` | error | `enabledPlugins` in local settings only — overrides silently dropped ([#25086](https://github.com/anthropics/claude-code/issues/25086)) |
| `SCOPE_CONFLICT` | warning | Plugin enabled in one scope, disabled in another |
| `STOP_CONTINUE_LOOP` | error | Stop hook outputs `continue:true` causing infinite loop ([#1288](https://github.com/anthropics/claude-code/issues/1288)) |
| `DISABLE_ALL_HOOKS_ACTIVE` | warning/error | `disableAllHooks: true` suppresses all hooks (escalates to error if managed settings exist) |
| `BROKEN_SETTINGS_JSON` | error | Invalid JSON silently disables all settings from that file |
| `LARGE_SETTINGS_FILE` | warning | Settings file >100KB (may cause slow startup) |
| `HOOK_NO_TIMEOUT` | warning | Command or HTTP hook has no timeout — may hang the session |
| `PLUGIN_HOOKS_INVISIBLE` | info | No user hooks but plugins are enabled — plugin hooks are invisible to inspection |

## Settings Scopes

The tool reads all four settings scopes in Claude Code's load order:

| Scope | Path | Merge behavior |
|-------|------|----------------|
| managed | `~/.claude/managed-settings.json` | Loaded first |
| user | `~/.claude/settings.json` | Overwrites managed |
| project | `.claude/settings.json` | Overwrites user |
| local | `.claude/settings.local.json` | Last write wins (highest effective priority) |

**Important:** Local overrides only apply to keys that already exist in a broader scope. See the [handbook](https://mcp-tool-shop-org.github.io/claude-hook-debug/) for details.

## Library Usage

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## Security & Threat Model

**What it touches:** Claude Code settings files (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`). All reads are read-only — the tool never modifies any file.

**What it does NOT touch:** No API keys, tokens, env var values, or credentials are read or logged. The `env` block in settings is completely ignored. No files outside Claude Code settings paths are accessed.

**Permissions required:** Filesystem read access to `~/.claude/` and the project's `.claude/` directory. No elevated permissions, no network access, no shell execution.

**No telemetry.** No analytics. No phone-home. No data collection of any kind. Zero production dependencies.

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
