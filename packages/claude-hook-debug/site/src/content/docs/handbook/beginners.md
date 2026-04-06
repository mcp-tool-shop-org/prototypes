---
title: Beginners Guide
description: Everything you need to know to start using claude-hook-debug.
sidebar:
  order: 99
---

## What is this tool?

claude-hook-debug is a diagnostic CLI that scans your Claude Code settings files and detects hook-related bugs. Claude Code uses a plugin and hook system where commands run automatically at specific lifecycle events (session start, tool use, stop, etc.). Several known bugs cause hooks to misbehave: disabled plugins still firing, settings overrides being silently dropped, and infinite loops from misconfigured Stop hooks. This tool reads your settings, computes the merged state, and tells you exactly what is wrong and how to fix it.

The tool is read-only. It never modifies any file, makes no network requests, and has zero production dependencies.

## Who is this for?

- **Claude Code users** who see unexpected "[Preview Required]" messages or other phantom hook behavior
- **Teams** deploying Claude Code with managed settings who need to verify that organization-enforced hooks are not being bypassed
- **Plugin developers** debugging why their plugin hooks are (or are not) firing
- **CI pipelines** that want to validate Claude Code settings as part of a project health check (use `--json` for machine-readable output)

## Prerequisites

- **Node.js 18 or later** — check with `node --version`
- **Claude Code installed** — the tool reads Claude Code settings files from `~/.claude/` and `<project>/.claude/`
- No other dependencies are required. The tool uses only Node.js built-ins.

## Your First 5 Minutes

**Step 1: Run the tool on your current project.**

```bash
npx @mcptoolshop/claude-hook-debug
```

This scans `~/.claude/` for user and managed settings, and the current directory for project and local settings.

**Step 2: Read the output.** The report has four sections:

1. **Settings Files** — which of the four settings files exist and whether they loaded cleanly.
2. **Plugins** — every plugin found across all scopes, with its enabled/disabled state at each scope and the final merged state.
3. **Hooks** — all user-defined hooks grouped by event type (Stop, PreToolUse, etc.). Plugin-injected hooks are invisible here.
4. **Diagnostics** — the findings, sorted by severity. Each one has an ID, a description, a fix suggestion, and links to relevant GitHub issues.

**Step 3: Check the exit code.** Exit code 0 means no errors. Exit code 1 means at least one error-severity diagnostic was found.

```bash
npx @mcptoolshop/claude-hook-debug
echo $?   # 0 = clean, 1 = errors found
```

**Step 4: Fix any findings.** Each diagnostic includes a "Fix" line explaining exactly what to change and in which file.

**Step 5 (optional): Scan a different project.**

```bash
npx @mcptoolshop/claude-hook-debug /path/to/other/project
```

## Common Mistakes

**Putting `enabledPlugins` only in `settings.local.json`.**
Local overrides only merge into keys that already exist in a broader scope (user or project `settings.json`). If the key does not exist elsewhere, the local value is silently dropped. Always ensure `"enabledPlugins": {}` exists in `~/.claude/settings.json` first.

**Using `disableAllHooks: true` as a permanent fix.**
This is a sledgehammer that suppresses all hooks, including organization-managed hooks. It is useful as a temporary workaround but should not be left in place. Disable specific plugins via `enabledPlugins` instead.

**Expecting the tool to see plugin-injected hooks.**
Plugins register their hooks from internal manifests at runtime. These hooks do not appear in your settings files, so claude-hook-debug cannot list them. Use `claude --debug` to see all hook events in the Claude Code log.

**Forgetting the `--json` flag in scripts.**
The default output is human-readable with ANSI colors. For CI or piping, use `claude-hook-debug --json` to get structured JSON output.

## Next Steps

- Read the [Diagnostic Rules](/handbook/diagnostics/) reference to understand every finding the tool can report
- Read [Settings Scopes](/handbook/settings-scopes/) to understand how Claude Code merges settings across four files
- Review the [Security](/handbook/security/) page for the tool's threat model
- File bugs or feature requests at [github.com/mcp-tool-shop-org/claude-hook-debug](https://github.com/mcp-tool-shop-org/claude-hook-debug/issues)

## Glossary

| Term | Definition |
|------|-----------|
| **Hook** | A command, prompt, agent task, or HTTP call that Claude Code runs automatically at a specific lifecycle event (e.g., Stop, PreToolUse, SessionStart). |
| **Hook event** | The lifecycle moment that triggers a hook. Examples: `Stop`, `PreToolUse`, `PostToolUse`, `Notification`, `SessionStart`, `SessionEnd`. |
| **Plugin** | A Claude Code extension that can register hooks from its internal manifest. Plugins are managed via the `enabledPlugins` key in settings. |
| **Scope** | One of four settings file locations: managed, user, project, or local. Each has different precedence in the merge order. |
| **Managed settings** | Organization-enforced settings at `~/.claude/managed-settings.json`. Intended to be non-overridable, though `disableAllHooks` currently bypasses them. |
| **Ghost hook** | A hook from a disabled plugin that still fires due to a known plugin lifecycle bug. |
| **Merge** | The process by which Claude Code combines settings from all four scope files. Last write wins for most keys. |
| **Diagnostic** | A finding reported by the tool, with an ID (e.g., `GHOST_HOOK_PREVIEW`), severity (error/warning/info), description, and fix suggestion. |
| **Severity** | The impact level of a diagnostic: `error` (something is broken), `warning` (potential issue), or `info` (informational). |
