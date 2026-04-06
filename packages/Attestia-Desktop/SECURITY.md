# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

## Scope

Attestia Desktop is a **WinUI 3 desktop application** and **.NET SDK** for financial intent verification and blockchain attestation.
- **Data accessed:** Reads and writes intent declarations, Merkle proofs, reconciliation reports, and compliance data via a local Node.js sidecar backend. Stores configuration in `appsettings.json`. NuGet SDK packages make HTTP calls to the configured backend URL only.
- **Data NOT accessed:** No telemetry. No cloud analytics. No user data collection. No credential storage (optional API key is user-configured). No direct blockchain writes — the app verifies intent, not executes transactions.
- **Permissions required:** Network access to local sidecar (localhost). File system access for bundled Node.js runtime and configuration. Windows App SDK runtime for the desktop UI.
