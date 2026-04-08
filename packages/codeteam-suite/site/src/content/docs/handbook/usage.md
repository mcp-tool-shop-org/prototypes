---
title: Usage
description: CLI commands, structured output, and golden test fixtures for CodeTeam Suite.
sidebar:
  order: 3
---

This page covers the three CLI commands and the golden fixture system used for validation.

## Verify a package

The primary command. It runs the full verification pipeline -- schema validation, integrity checks, approval counting, and signature verification:

```bash
codeteam verify <package-path> --json
```

The `--json` flag produces structured output that editors and CI systems can parse reliably. Without it, the CLI produces human-readable text.

The verification pipeline runs four phases in order:

1. **Schema validation** -- confirms the manifest and records match the v0.1 JSON schemas
2. **Integrity verification** -- checks that every referenced file exists, has the correct size, and matches its SHA-256 digest
3. **Approval verification** -- validates approval signatures cryptographically and counts distinct approvers against the policy threshold
4. **Signature verification** -- validates the final package signature

Verification short-circuits on the first failure. If schema validation fails, integrity checks are not run.

## Approve a package

Add a signed approval attestation as an authorized approver:

```bash
codeteam approve <package-path> --key <key-id> --json
```

This appends a new record to `signatures/approvals.jsonl`. The approval includes your key ID, the package digest, and an Ed25519 signature over the signable payload.

Approvals are append-only. Each approver may approve at most once per package digest. Duplicate approvals are deduplicated during verification.

## Sign a package

Apply a final cryptographic signature to seal the package:

```bash
codeteam sign <package-path> --key <key-id> --json
```

Signing requires that the approval threshold has been met. If there are not enough valid approvals, the sign command will fail with `FAIL_THRESHOLD`.

The signature is appended to `signatures/signatures.jsonl` and seals the package for its declared intent.

## Verification phases in detail

### Quorum policy

Packages can define multi-signer quorum policies. Each requirement specifies:

- A **purpose** (`codeteam.approval` or `codeteam.package_attestation`) to prevent cross-protocol replay
- An optional **allowlist** of key IDs
- A **threshold** of distinct signers required

Only distinct signers count toward the threshold. The same key signing multiple times does not increase the quorum count.

### Signature formats

Two formats are supported:

- **Legacy format (v0.1.0)** -- signable string: `codeteam:signature:v0.1:{digest}:{signer_id}`
- **Envelope format (v0.1.1+)** -- signable is canonical JSON per the signable schema

Format detection is deterministic: if a record contains a `signable` object, it uses envelope format. Otherwise, it uses legacy format. Quorum verification counts only envelope signatures toward quorum.

## Golden fixtures

The test suite includes golden fixtures that define expected verification outcomes. These fixtures are the source of truth for correctness:

| Fixture | Expected status |
|---------|-----------------|
| `fixtures/minimal_unsigned/` | `OK_UNSIGNED` |
| `fixtures/approved_threshold_met/` | `OK_UNSIGNED` |
| `fixtures/signed_verified/` | `OK_VERIFIED` |
| `fixtures/tampered_artifact/` | `FAIL_INTEGRITY` |
| `fixtures/invalid_manifest/` | `FAIL_SCHEMA` |
| `fixtures/signed_verified_real/` | `OK_VERIFIED` |
| `fixtures/signed_invalid_sig/` | `FAIL_SIGNATURE` |

Additional quorum-specific fixtures:

| Fixture | Expected status |
|---------|-----------------|
| `fixtures/two_signatures_threshold_2_pass/` | `OK_VERIFIED` |
| `fixtures/two_signatures_same_keyid_threshold_2_fail/` | `OK_UNSIGNED` |
| `fixtures/one_signature_threshold_2_fail/` | `OK_UNSIGNED` |
| `fixtures/signature_wrong_purpose_ignored/` | `OK_UNSIGNED` |
| `fixtures/signature_not_in_allowlist/` | `OK_UNSIGNED` |

Every implementation is validated against these fixtures. If a fixture test fails, the implementation has a bug -- the fixtures define correctness, not the code.
