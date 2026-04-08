# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | Yes                |

## Scope

nexus-suite is a **prototype integration suite** containing multiple Python packages for development, testing, deployment, and monitoring orchestration.

Security-relevant components:
- **nexus-attest**: Attestation and approval workflows with XRPL adapters
- **nexus-control**: Control plane for development tooling
- **nexus-router**: Message routing between components
- **nexus-router-adapter-http**: HTTP adapter for nexus-router
- **nexus-router-adapter-stdout**: Stdout adapter for nexus-router

## Reporting a Vulnerability

If you discover a security issue:

1. **Email**: 64996768+mcp-tool-shop@users.noreply.github.com
2. **Subject**: `[SECURITY] nexus-suite: <brief description>`
3. **Include**: affected package, description, reproduction steps

We will acknowledge reports within 7 days and provide a fix within 30 days.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| XRPL adapter credential exposure | Adapters use testnet by default; no mainnet keys stored |
| HTTP adapter injection | Input validation via typed schemas |
| Supply chain | CI runs tests for all packages; lockfiles committed |

## Security Practices

- No secrets or credentials in this repository
- Prototype status — not intended for production use
- CI runs pytest for all packages on every push
- Each package has its own test suite
