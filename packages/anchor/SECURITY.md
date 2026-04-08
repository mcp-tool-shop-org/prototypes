# Security Policy

## Scope

Anchor is a local-only Tauri v2 desktop application for decision management. It:

- Operates entirely offline with no network access
- Stores project data as JSON files on the local filesystem
- Uses Tauri IPC with minimal capabilities (core:default only)
- Has no telemetry, analytics, or external service connections

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Malicious project files | 3-layer validation (version, schema, integrity hash) on load |
| Path traversal via save/load | Tauri capabilities restrict filesystem scope |
| Data tampering | djb2 integrity hash detects accidental corruption |
| Supply chain | Cargo.lock + package-lock.json pin all dependencies |

## Known Limitations

- Integrity hash (djb2) is non-cryptographic; it detects corruption but not sophisticated tampering
- No encryption at rest for project files

## Reporting

To report a vulnerability, email 64996768+mcp-tool-shop@users.noreply.github.com or open a GitHub issue.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |
