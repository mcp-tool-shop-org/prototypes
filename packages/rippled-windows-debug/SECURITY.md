# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | Yes                |

## Scope

rippled-windows-debug is a **documentation and debugging guide** — it provides instructions, scripts, and C++ examples for building and debugging the XRP Ledger (rippled) on Windows. It does not run as a service or handle user data.

Security-relevant components:
- **Scripts** (`scripts/`): PowerShell setup/build scripts for local development
- **C++ examples** (`src/`, `examples/`): Reference code for debugging rippled
- **Patches** (`patches/`): Build patches for rippled compilation on Windows

## Reporting a Vulnerability

If you discover a security issue — especially in scripts that modify system state:

1. **Email**: 64996768+mcp-tool-shop@users.noreply.github.com
2. **Subject**: `[SECURITY] rippled-windows-debug: <brief description>`
3. **Include**: affected component, description, reproduction steps

We will acknowledge reports within 7 days and provide a fix within 30 days.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Script injection via PowerShell | Scripts are static, version-controlled, reviewed |
| Malicious patches | Patches are committed with full diff context for review |
| Credential exposure | No credentials stored; scripts use local builds only |

## Security Practices

- No secrets or credentials in this repository
- Scripts target local development only (no network services)
- All code is reference/educational material
