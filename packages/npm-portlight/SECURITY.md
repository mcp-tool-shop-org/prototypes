# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

Report security issues to: **64996768+mcp-tool-shop@users.noreply.github.com**

- You will receive an acknowledgment within 48 hours
- We aim to provide a fix or mitigation within 7 days for critical issues
- Please do not open public issues for security vulnerabilities

## Threat Model

### What this package does

- Downloads pre-built Portlight binaries from GitHub Releases over HTTPS
- Verifies SHA256 checksums on every download
- Caches binaries in the user's cache directory (`~/.cache/mcptoolshop/portlight/`)
- Executes the cached binary with the user's arguments

### What this package does NOT do

- Does not collect telemetry or analytics
- Does not store credentials, tokens, or secrets
- Does not write outside the user cache directory
- Does not make network requests beyond `github.com` for binary downloads
- Does not modify system PATH or global configuration

### Trust boundaries

- Binary integrity depends on GitHub Releases + SHA256 verification
- The executed binary runs with the same permissions as the calling user
- Game save files are written to the current working directory
