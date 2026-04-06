# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | Yes                |

## Scope

prov-spec is a **specification repository** — it contains normative documents, JSON schemas, test vectors, and a reference Python validator. It does not provide a runtime service, accept user input over a network, or store credentials.

Security-relevant components:
- **JSON Schemas** (`spec/schemas/`): validated in CI; malformed schemas could cause interop issues
- **Reference Validator** (`tools/python/prov_validator.py`): CLI tool, reads local files only, no network access
- **Test Vectors** (`spec/vectors/`): static data, validated in CI

## Reporting a Vulnerability

If you discover a security issue in prov-spec — including schema vulnerabilities, validator input handling bugs, or integrity issues with test vectors — please report it responsibly:

1. **Email**: 64996768+mcp-tool-shop@users.noreply.github.com
2. **Subject**: `[SECURITY] prov-spec: <brief description>`
3. **Include**: affected version, description of the issue, reproduction steps

We will acknowledge reports within 7 days and provide a fix or mitigation plan within 30 days.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Malicious schema injection | Schemas are version-controlled and validated in CI |
| Validator path traversal | Validator uses `pathlib` with explicit directory roots |
| Supply chain (CI dependencies) | Actions pinned to major versions; minimal dependency footprint (ruff, mypy only) |
| Test vector tampering | Vectors are committed with known-good digests; CI validates them on every push |

## Security Practices

- No secrets or credentials in this repository
- CI runs ruff lint + mypy type checking on every push
- JSON schemas validated for well-formedness in CI
- Minimal dependencies: Python stdlib + ruff + mypy (dev only)
