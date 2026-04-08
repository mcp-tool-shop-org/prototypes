# CodeTeam Suite — Contract v0.1

## Status

**Stable for v0.1.0**

This contract defines the authoritative semantics of CodeTeam packages, approvals, signatures, and verification. All implementations (CLI, VS Code, Visual Studio, CI) MUST conform to this document.

---

## 1. Purpose

CodeTeam is an offline-first coordination system that enables teams to:

- create verifiable packages
- collect approvals under explicit policy
- apply final signatures
- export portable bundles
- verify results deterministically without servers

**The package is the unit of collaboration.**
**Editors and UIs are clients, not authorities.**

---

## 2. Design Principles

### Offline-first
All core workflows MUST function without network access.

### Deterministic verification
Verification results MUST depend only on package contents and documented rules.

### No-lies policy
A package MUST NOT be reported as verified unless all required checks pass.

### Append-only coordination
Approvals and signatures accumulate without mutating what was signed.

### Editor-agnostic truth
Packages MUST be verifiable independently of any editor or UI.

---

## 3. Core Objects

### 3.1 Package

A package is a directory or zip archive containing:
- a canonical manifest
- referenced artifacts and evidence
- append-only approval and signature records

### 3.2 Approval

An approval is a signed attestation by an authorized actor indicating consent under the package policy.

### 3.3 Signature

A signature is a final cryptographic attestation that seals the package for its declared intent.

### 3.4 Seal (optional)

A seal is an optional external anchoring record (e.g., XRPL).
Seals MUST NOT affect package validity.

---

## 4. Package Layout (normative)

**Required:**
```
codeteam.manifest.json
signatures/
  approvals.jsonl
  signatures.jsonl
```

**Optional:**
```
artifacts/
evidence/
README.md
```

### 4.1 Path Rules

- Paths MUST be relative
- Paths MUST NOT contain `..`
- Paths MUST use forward slashes
- Absolute paths are forbidden

---

## 5. Digest Model

- File digests use SHA-256 over raw bytes
- `size_bytes` MUST match actual size
- The package digest MUST be computed over:
  - the canonical manifest
  - referenced blob digests
- The `signatures/` directory MUST be excluded from the package digest

---

## 6. Policy Model

Each package defines:
- `required_approvals` (k)
- an explicit set of authorized approver public keys

**Rules:**
- Only listed keys may approve or sign
- Each approver may approve at most once per package digest
- Approval threshold MUST be met before final signing

---

## 7. Append-only Records

- `approvals.jsonl` and `signatures.jsonl` MUST be append-only
- Records MUST be canonical JSON
- Merging records is defined as:
  - concatenation
  - de-duplication by `(actor_id, package_digest)`

---

## 8. Status Codes (public contract)

Implementations MUST surface one of the following:

| Code | Exit | Meaning |
|------|------|---------|
| `OK_UNSIGNED` | 1 | Integrity OK, not signed |
| `OK_VERIFIED` | 0 | Signed + threshold met + integrity OK |
| `FAIL_INTEGRITY` | 2 | Artifact/evidence hash mismatch |
| `FAIL_SCHEMA` | 3 | Manifest schema validation failed |
| `FAIL_SIGNATURE` | 4 | Signature cryptographically invalid |
| `FAIL_THRESHOLD` | 5 | Signed but approval count < required |
| `FAIL_UNAUTHORIZED` | 6 | Actor not in authorized set |

These codes are **stable and part of the public API**.

---

## 9. Out of Scope (v0.1)

The following are explicitly excluded:
- servers or synchronization
- identity provisioning
- key escrow or recovery
- mandatory blockchain anchoring
- editor-specific storage formats

---

## 10. Forward Compatibility

Future versions MAY add:
- additional evidence kinds
- additional seal providers
- richer policy expressions

They MUST NOT change:
- v0.1 verification semantics
- meaning of status codes
- hash and signature rules

---

## 11. Canonical References

| Document | Purpose |
|----------|---------|
| `CONTRACT.md` | This document — authoritative semantics |
| `VERIFICATION.md` | Verification rules and phases |
| `schemas/*.json` | JSON Schema definitions |
| `fixtures/` | Golden test packages |
