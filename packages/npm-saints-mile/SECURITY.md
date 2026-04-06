# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

Email [64996768+mcp-tool-shop@users.noreply.github.com](mailto:64996768+mcp-tool-shop@users.noreply.github.com) with:

- Description of the vulnerability
- Steps to reproduce
- Expected vs actual behavior

We aim to respond within 48 hours and will credit reporters in the fix.

## Scope

This package is a thin npm wrapper that downloads a pre-built binary from GitHub Releases.

- **Network**: HTTPS only to `github.com` CDN
- **Filesystem**: Writes only to user-scoped cache (`~/.cache/mcptoolshop/saints-mile/`)
- **Verification**: SHA256 checksum on every download
- **Telemetry**: None
- **Secrets**: None stored or transmitted
