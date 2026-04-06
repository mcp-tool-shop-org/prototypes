---
title: Getting Started
description: Install and run your first hook diagnostic scan.
sidebar:
  order: 1
---

## Install

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

Or run directly without installing:

```bash
npx @mcptoolshop/claude-hook-debug
```

## Run a scan

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

The tool reads all Claude Code settings files and outputs a diagnostic report. Exit code 1 if errors are found, 0 otherwise.

## Understanding the output

The report has four sections:

### Settings Files
Shows which settings files exist, their size, and whether they loaded successfully. A broken JSON file silently disables all settings from that file.

### Plugins
Lists all plugins found across all scopes, showing their enabled/disabled state at each scope and the final merged state.

### Hooks
Lists all user-defined hooks by event type. Note: plugin-injected hooks are invisible here — they're loaded from plugin manifests at runtime.

### Diagnostics
The actionable findings, sorted by severity (errors first). Each diagnostic includes an ID, description, fix suggestion, and references to relevant GitHub issues.
