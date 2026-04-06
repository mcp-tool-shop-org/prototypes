# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Witness, please report it responsibly.

### How to report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email: 64996768+mcp-tool-shop@users.noreply.github.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in the security advisory (unless you prefer anonymity)

### Scope

Security issues we care about:

| Category | In Scope |
|----------|----------|
| Signature bypass | Yes |
| Digest collision exploitation | Yes |
| Canonical JSON edge cases | Yes |
| Key material exposure | Yes |
| Append-only violation | Yes |
| Local privilege escalation | Yes |
| Denial of service (local) | Case-by-case |

### Out of scope

- Social engineering attacks
- Physical access attacks
- Issues in dependencies (report upstream)
- Theoretical attacks without demonstrated impact

## Security Design

Witness is designed with these security properties:

1. **Cryptographic integrity**: Ed25519 signatures over canonical JSON
2. **Deterministic verification**: Same bytes = same result, always
3. **Append-only**: No mutation of recorded events
4. **Local-first**: No network required for verification
5. **Key rotation**: Explicit events for key lifecycle

## Cryptographic Choices

| Component | Algorithm | Rationale |
|-----------|-----------|-----------|
| Signatures | Ed25519 | Fast, small, well-audited |
| Digests | SHA-256 | Universal, auditor-friendly |
| Encoding | Canonical JSON | Deterministic, human-readable |

These choices are locked for Phase 1. Changes require a schema version bump.
