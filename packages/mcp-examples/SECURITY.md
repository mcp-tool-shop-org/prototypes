# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |

## Scope

mcp-examples is a **reference/example repository** — it demonstrates MCP tool patterns with working Python examples. It does not provide a production runtime service.

Security-relevant components:
- **hello-tools**: Echo tool (no I/O), HTTP-get tool (optional network with stub default)
- **hello-filesystem**: File-write tool with sandbox enforcement and path traversal prevention
- **CI**: Validates schemas, runs tools, tests path traversal defenses

## Reporting a Vulnerability

If you discover a security issue — especially in the sandbox enforcement or path traversal prevention logic:

1. **Email**: 64996768+mcp-tool-shop@users.noreply.github.com
2. **Subject**: `[SECURITY] mcp-examples: <brief description>`
3. **Include**: affected component, description, reproduction steps

We will acknowledge reports within 7 days and provide a fix within 30 days.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Path traversal via file_write | Resolved paths clamped to sandbox directory; CI tests unix, windows, URL-encoded, drive letter, UNC, and symlink vectors |
| Network access in tools | Stub mode by default; real network requires explicit `ALLOW_NETWORK=1` |
| Symlink escape | Symlink targets outside sandbox are blocked; CI tests this |
| Unreproducible examples | CI validates `mcp.yaml` pins to tagged releases, not `main` |

## Security Practices

- No secrets or credentials in this repository
- Sandbox enforcement tested in CI with 6+ traversal vectors
- Network access disabled by default (stub mode)
- YAML configs validated for reproducibility
