# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

Pocket Ledger is a **local-first personal finance app** for Windows (WinUI 3 / .NET 8).

- **Data touched:** Financial transactions, budgets, and account data stored in a local SQLite database. All data stays on-device
- **Data NOT touched:** No telemetry. No analytics. No cloud sync. No external API calls. No credential storage
- **Permissions:** Read/write: local SQLite database file only. No network access. No file system access beyond app data directory
- **Network:** None — fully offline application. Zero external connections unless user explicitly opts in
- **Telemetry:** None collected or sent

### Security model

- **Local-first by design:** All financial data remains on the user's device
- **Privacy by design:** Zero telemetry, zero external connections
- **Clean Architecture:** Domain logic isolated from infrastructure concerns
- **No secrets handling:** Application does not read, store, or transmit credentials
