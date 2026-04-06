---
title: Security
description: Code Bearings threat model and security posture.
sidebar:
  order: 4
---

## Threat Model

### What Code Bearings touches

- **Local filesystem (read-only):** Reads TypeScript/JavaScript source files via AST parsing (ts-morph). Does not modify source files.
- **SQLite database (read/write):** Creates and writes to `.code-bearings/bearings.db` in your project directory. This is the only file Code Bearings writes.
- **Git CLI (read-only):** Executes `git diff` and `git rev-parse` to detect changes. Does not modify git state.

### What Code Bearings does NOT touch

- No network access
- No telemetry, analytics, or phone-home
- No cloud services or API keys
- No file modification outside `.code-bearings/`
- No access to files outside your project directory
- No execution of user code — static analysis only

### No Telemetry

Code Bearings does not collect, transmit, or store any telemetry, usage data, or analytics. This is by design and will not change.

## VS Code Extension

- Webview panel uses `enableScripts: true` for interactive features
- Scripts are injected by the extension, not loaded from external sources
- `retainContextWhenHidden: true` preserves review state across tab switches
- The extension reads files via the VS Code API — same read-only contract as the CLI

## Reporting Vulnerabilities

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

- Acknowledgment within 48 hours
- Initial assessment within 7 days
- Fix or mitigation within 30 days for confirmed vulnerabilities
