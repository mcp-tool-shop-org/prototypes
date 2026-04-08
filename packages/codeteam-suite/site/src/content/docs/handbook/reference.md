---
title: Reference
description: Exit codes, error codes, documentation links, security scope, and verification rules.
sidebar:
  order: 4
---

Quick reference for exit codes, error codes, related documents, and the security model.

## Exit codes

The CLI returns these exit codes. They are stable, part of the public API, and will not change in future versions:

| Code | Status | Meaning |
|------|--------|---------|
| 0 | `OK_VERIFIED` | Package verified with valid signature |
| 1 | `OK_UNSIGNED` | Package valid but unsigned |
| 2 | `FAIL_INTEGRITY` | Missing file, size mismatch, or digest mismatch |
| 3 | `FAIL_SCHEMA` | Schema validation failed |
| 4 | `FAIL_SIGNATURE` | Signature verification failed |
| 5 | `FAIL_THRESHOLD` | Approval threshold not met |
| 6 | `FAIL_UNAUTHORIZED` | Actor not authorized |

## Structured error codes

When verification fails, the structured JSON output includes a specific error code:

| Error code | Meaning |
|------------|---------|
| `MISSING_FILE` | Referenced file does not exist |
| `SIZE_MISMATCH` | File size differs from manifest |
| `DIGEST_MISMATCH` | SHA-256 hash differs from manifest |
| `SCHEMA_INVALID` | JSON does not match schema |
| `SIGNATURE_INVALID` | Ed25519 signature verification failed |
| `ACTOR_NOT_AUTHORIZED` | Approver or signer not in policy |
| `THRESHOLD_NOT_MET` | Approval count below required |
| `SIGNATURE_QUORUM_NOT_MET` | Signature quorum not satisfied |
| `APPROVAL_QUORUM_NOT_MET` | Approval quorum not satisfied |
| `SIGNATURE_NOT_ALLOWED` | Key not in allowlist (signature ignored) |
| `PURPOSE_MISMATCH` | Signature purpose does not match requirement (ignored) |
| `LEGACY_SIGNATURE_IGNORED` | Legacy-format signature ignored in quorum mode |

## Stability guarantees

These artifacts are frozen and protected by CI:

| Artifact | Location | Guarantee |
|----------|----------|-----------|
| JSON schemas | `/schemas/*.v0.1.json` | Additive changes only |
| CLI `verify --json` output | `codeteam.cli.verify.schema.v0.1.json` | Backward compatible |
| Error codes | `ErrorCode.cs` | No removals or renames |
| Severity mapping | `severity-map.v0.1.json` | New codes require mapping |

## Documentation

The repository includes several normative and informative documents:

| Document | Purpose |
|----------|---------|
| [CONTRACT.md](https://github.com/mcp-tool-shop-org/codeteam-suite/blob/main/CONTRACT.md) | Authoritative package semantics -- the single source of truth for what packages, approvals, and signatures mean |
| [VERIFICATION.md](https://github.com/mcp-tool-shop-org/codeteam-suite/blob/main/VERIFICATION.md) | Normative verification rules, phases, and pseudocode algorithm |
| [EDITOR_INTEGRATION.md](https://github.com/mcp-tool-shop-org/codeteam-suite/blob/main/docs/EDITOR_INTEGRATION.md) | Editor extension contract for VS Code and Visual Studio |
| [sealing.md](https://github.com/mcp-tool-shop-org/codeteam-suite/blob/main/docs/sealing.md) | Sealing design (informative, not normative) |
| [SECURITY.md](https://github.com/mcp-tool-shop-org/codeteam-suite/blob/main/SECURITY.md) | Security policy and vulnerability reporting |

## Security and data scope

CodeTeam Suite is a **local-first** tool. Here is what it accesses and what it does not:

**Data accessed:**
- Reads package manifests, approval files, and signature files for cryptographic verification (Ed25519 + SHA-256)
- Writes approval and signature records to package directories
- All operations are local and deterministic

**Data NOT accessed:**
- No network requests (except optional XRPL anchoring)
- No telemetry
- No cloud services
- No credential storage beyond local Ed25519 keys

**Permissions:**
- File system read/write for package directories
- No elevated permissions required

## Reporting vulnerabilities

If you discover a security issue, email **64996768+mcp-tool-shop@users.noreply.github.com** with a description, reproduction steps, and potential impact. Response timeline: acknowledgment within 48 hours, assessment within 7 days, fix within 30 days.

## License

MIT -- see [LICENSE](https://github.com/mcp-tool-shop-org/codeteam-suite/blob/main/LICENSE) in the repository.
