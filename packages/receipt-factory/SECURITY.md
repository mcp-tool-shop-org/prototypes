# Security Policy

## Threat Model

receipt-factory produces audit artifacts (receipts) that document what happened in CI, releases, and other automated processes. The threat model covers:

### What receipts protect against

- **Undetected tampering**: Receipts are content-addressed (SHA-256). Any modification to the receipt changes the hash, making tampering evident.
- **Missing provenance**: Receipts capture who/what/when/why/how, creating an audit trail.
- **Verification gaps**: Every receipt includes verification steps and commands.

### What receipts do NOT protect against

- **Compromised CI runners**: If the build environment is compromised, the receipt will faithfully document a compromised build.
- **Supply chain attacks**: Receipts prove process, not code quality.
- **Post-creation modification without signing**: Without cryptographic signing (cosign, sigstore), receipts are tamper-evident but not tamper-proof.

### Security boundaries

- `rf-core`: No network access. Pure computation (hashing, canonicalization, schema validation).
- `rf-render`: No network access. String formatting only.
- `rf-verify`: Makes HTTP HEAD requests to verify evidence URLs. No data is sent.
- `rf-adapter-github`: Calls `gh api` or GitHub REST API. Requires authentication.
- `rf-cli`: Orchestrates the above. File I/O for reading/writing receipts.

### Secrets

- receipt-factory never stores, transmits, or logs secrets.
- The GitHub adapter uses `gh` CLI authentication (existing session) or `GITHUB_TOKEN`.
- Receipt policy includes `redacted_fields` for documenting what was intentionally omitted.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.7.x   | Yes       |
| < 1.7   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in receipt-factory, please report it responsibly:

1. **Do NOT** open a public issue.
2. Email: 64996768+mcp-tool-shop@users.noreply.github.com
3. Include: description, reproduction steps, impact assessment.
4. Expected response time: 48 hours for acknowledgment, 7 days for fix.
