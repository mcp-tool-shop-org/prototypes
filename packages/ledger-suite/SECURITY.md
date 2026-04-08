# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

Ledger Suite is a **local-first** collection of cryptographic provenance ledgers.

- **Data touched:** Local SQLite databases, Ed25519 keypairs, claim/attestation records, proof bundles
- **Data NOT touched:** No cloud sync. No telemetry. No analytics. No external API calls
- **Cryptography:** Ed25519 signatures, SHA-256 hash chains, RFC 3161 timestamps
- **No network egress** — all operations are local. Publish commands target local/configurable endpoints only
- **No telemetry** is collected or sent

### Cryptographic Considerations

- Private keys are stored locally and never transmitted
- Hash chains provide tamper evidence but not tamper prevention — physical access to the database allows modification (detectable via chain verification)
- RFC 3161 timestamping requires an external TSA endpoint when used
- Proof bundles are self-contained and portable — verify signatures before trusting imported bundles
