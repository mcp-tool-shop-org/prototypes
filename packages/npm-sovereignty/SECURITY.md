# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email: 64996768+mcp-tool-shop@users.noreply.github.com
3. Include a description of the vulnerability and steps to reproduce

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Threat Model

This package is a thin launcher (~15 lines) that:

- Sets a hardcoded JSON config (repo owner/name/version)
- Delegates to `@mcptoolshop/npm-launcher` for binary download and execution
- Downloads only from GitHub releases of known repositories
- Verifies checksums before execution (via npm-launcher)
- No user input processing, no network code, no secrets handling
