---
title: Overview
description: What claude-hook-debug does and why it exists.
sidebar:
  order: 0
---

claude-hook-debug is a diagnostic CLI for Claude Code hook issues. It scans all settings scopes, extracts plugin and hook state, and runs diagnostic rules to detect known bugs.

## Why this tool exists

Claude Code has a plugin system that can register hooks (commands that run at specific lifecycle events). Several bugs in the hook loading system cause unexpected behavior:

- **Disabled plugins still fire hooks** — setting `enabledPlugins: false` doesn't prevent a plugin's hooks from loading
- **Local settings overrides are silently dropped** — if the `enabledPlugins` key doesn't exist in a broader scope, local overrides are ignored
- **Stop hooks can loop infinitely** — outputting `continue: true` in a Stop hook re-invokes the hook endlessly

This tool detects all of these issues and more, providing actionable fix suggestions with references to the relevant GitHub issues.

## How it works

1. Reads all 4 Claude Code settings files (managed, user, project, local)
2. Extracts `enabledPlugins` state from each scope and computes merged state
3. Extracts user-defined hooks from each scope with provenance tracking
4. Runs 9 diagnostic rules against the collected state
5. Outputs a report with severity-ranked diagnostics and fix suggestions
