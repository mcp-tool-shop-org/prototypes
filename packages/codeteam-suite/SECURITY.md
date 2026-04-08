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

CodeTeam Suite is a **.NET CLI and library** for cryptographic package verification, approval, and signing.
- **Data accessed:** Reads package manifests, approval files, and signature files for cryptographic verification (Ed25519 + SHA-256). Writes approval and signature records to package directories. All operations are local and deterministic.
- **Data NOT accessed:** No network requests (except optional XRPL anchoring). No telemetry. No cloud services. No credential storage beyond local Ed25519 keys.
- **Permissions required:** File system read/write for package directories. No elevated permissions required.
