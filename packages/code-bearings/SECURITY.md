# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

**Response timeline:**
- Acknowledgment within 48 hours
- Initial assessment within 7 days
- Fix or mitigation within 30 days for confirmed vulnerabilities

## Threat Model

### What Code Bearings touches

- **Local filesystem (read-only):** Reads TypeScript/JavaScript source files in your project directory to build a code graph. Does not modify source files.
- **SQLite database (read/write):** Creates and writes to a local `.code-bearings/bearings.db` file in your project directory. This is the only file Code Bearings writes.
- **Git CLI (read-only):** Executes `git diff` and `git rev-parse` commands to detect changes for review. Does not modify git state.

### What Code Bearings does NOT touch

- No network access. No telemetry. No analytics. No phone-home.
- No cloud services. No API keys required.
- No file modification outside the `.code-bearings/` directory.
- No access to files outside your project directory.
- No execution of user code. Static analysis only (AST parsing via ts-morph).

### VS Code Extension

- The VS Code extension uses the same core logic. It reads files via the VS Code API and renders results in webview panels, tree views, hover tooltips, and status bar items.
- The webview panel (`retainContextWhenHidden: true`) renders HTML reports with `enableScripts: true` for interactive features (mode switching, module navigation). Scripts are injected by the extension, not loaded from external sources.

### No telemetry

Code Bearings does not collect, transmit, or store any telemetry, usage data, or analytics. This is by design and will not change.
